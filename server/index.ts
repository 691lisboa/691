import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Bot } from 'grammy'
import webpush from 'web-push'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const PORT             = process.env.PORT || 5000
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL       = process.env.VAPID_EMAIL       || 'mailto:booking@691.pt'
const WEBAPP_URL        = process.env.WEBAPP_URL        || ''

// ── Reverse geocode cache (Nominatim) ─────────────────────────────────────────
// Key: "lat,lng" rounded; Value: { addr, ts }
const reverseGeocodeCache = new Map<string, { addr: string; ts: number }>()
const REVERSE_CACHE_TTL_MS = 6 * 60 * 60 * 1000

// ── Reverse Geocode (browser-safe; uses server-side fetch) ───────────────────
app.get('/api/reverse-geocode', async (req: Request, res: Response) => {
  const lat = Number(req.query.lat)
  const lng = Number(req.query.lng)
  const lang = String(req.query.lang || 'pt').toLowerCase()

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return res.status(400).json({ ok: false })
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ ok: false })

  // Cache key rounded to reduce cardinality
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`
  const cached = reverseGeocodeCache.get(key)
  if (cached && (Date.now() - cached.ts) < REVERSE_CACHE_TTL_MS) {
    return res.json({ ok: true, addr: cached.addr })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&accept-language=${lang}`
    const r = await fetch(url, {
      headers: {
        // Nominatim usage policy: identify application
        'User-Agent': '691.pt/1.0 (booking@691.pt)',
        'Accept': 'application/json'
      }
    })
    if (!r.ok) return res.status(502).json({ ok: false })

    const json = await r.json() as { address?: Record<string, string>; display_name?: string }
    const a = json.address || {}
    const street = a.road || a.pedestrian || a.footway || ''
    const number = a.house_number ? ` ${a.house_number}` : ''
    const city   = a.city || a.town || a.village || a.municipality || a.county || ''
    const addr   = street ? `${street}${number}${city ? ', ' + city : ''}` : (json.display_name || '')
    if (!addr) return res.status(502).json({ ok: false })

    reverseGeocodeCache.set(key, { addr, ts: Date.now() })
    return res.json({ ok: true, addr })
  } catch {
    return res.status(502).json({ ok: false })
  }
})

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  console.log('Web Push (VAPID) configurado')
} else {
  console.log('VAPID keys não configuradas — Web Push inativo')
}

// ── Estado em memória ────────────────────────────────────────────────────────
let bot: Bot | null = null
const connectedClients = new Set<string>()
const activeBookings   = new Map<string, Record<string, any>>()  // bookingId → dados
const clientBookings   = new Map<string, string>()                  // clientId  → bookingId
const bookingMessages  = new Map<string, number>()                  // bookingId → telegram messageId
const rateLimit           = new Map<string, { count: number; ts: number }>()  // IP → contador
// Dados persistidos em ficheiro para sobreviver a reinicios
const PUSH_SUBS_FILE     = path.join(__dirname, '../data/push-subscriptions.json')
const CLIENT_BOOK_FILE   = path.join(__dirname, '../data/client-bookings.json')
const ACTIVE_BOOK_FILE   = path.join(__dirname, '../data/active-bookings.json')

function loadPushSubs(): Map<string, webpush.PushSubscription> {
  try {
    const raw = fs.readFileSync(PUSH_SUBS_FILE, 'utf-8')
    const obj = JSON.parse(raw) as Record<string, webpush.PushSubscription>
    const m   = new Map<string, webpush.PushSubscription>()
    for (const [k, v] of Object.entries(obj)) m.set(k, v)
    console.log(`${m.size} push subscription(ões) carregada(s) do disco`)
    return m
  } catch { return new Map() }
}

function savePushSubs(): void {
  try {
    const dir = path.dirname(PUSH_SUBS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const obj: Record<string, webpush.PushSubscription> = {}
    for (const [k, v] of Array.from(pushSubscriptions.entries())) obj[k] = v
    fs.writeFileSync(PUSH_SUBS_FILE, JSON.stringify(obj))
  } catch (e) { console.warn('Erro ao guardar push subscriptions:', e) }
}

const pushSubscriptions = loadPushSubs()       // clientId → sub

// ── Persistência de reservas ─────────────────────────────────────────────────
function persist(file: string, data: unknown): void {
  try {
    const dir = path.dirname(file)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data))
  } catch (e) { console.warn(`Erro ao guardar ${path.basename(file)}:`, e) }
}

function loadClientBookings(): Map<string, string> {
  try {
    const obj = JSON.parse(fs.readFileSync(CLIENT_BOOK_FILE, 'utf-8')) as Record<string, string>
    const m = new Map<string, string>()
    for (const [k, v] of Object.entries(obj)) m.set(k, v)
    console.log(`${m.size} clientBooking(s) carregado(s) do disco`)
    return m
  } catch { return new Map() }
}

function loadActiveBookings(): Map<string, Record<string, string>> {
  try {
    const obj = JSON.parse(fs.readFileSync(ACTIVE_BOOK_FILE, 'utf-8')) as Record<string, Record<string, string>>
    const m = new Map<string, Record<string, string>>()
    for (const [k, v] of Object.entries(obj)) m.set(k, v)
    console.log(`${m.size} activeBooking(s) carregado(s) do disco`)
    return m
  } catch { return new Map() }
}

function saveBookings(): void {
  const cbObj: Record<string, string> = {}
  for (const [k, v] of Array.from(clientBookings.entries())) cbObj[k] = v
  persist(CLIENT_BOOK_FILE, cbObj)
  const abObj: Record<string, Record<string, string>> = {}
  for (const [k, v] of Array.from(activeBookings.entries())) abObj[k] = v
  persist(ACTIVE_BOOK_FILE, abObj)
}

// Inicializar a partir de disco (antes de iniciar o bot e sockets)
for (const [k, v] of loadActiveBookings()) activeBookings.set(k, v)
for (const [k, v] of loadClientBookings()) clientBookings.set(k, v)

// Limpar rate limit expirado a cada 15 min
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [ip, entry] of Array.from(rateLimit.entries()))
    if (entry.ts < cutoff) rateLimit.delete(ip)
}, 15 * 60 * 1000)

// Limpar reservas expiradas (> 4h) a cada 30 min
setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000
  let changed = false
  for (const [bookingId, booking] of Array.from(activeBookings.entries())) {
    if (Number(booking._ts || 0) < cutoff) {
      for (const [cid, bid] of Array.from(clientBookings.entries()))
        if (bid === bookingId) clientBookings.delete(cid)
      activeBookings.delete(bookingId)
      bookingMessages.delete(bookingId)
      console.log(`Reserva expirada removida: ${bookingId}`)
      changed = true
    }
  }
  if (changed) saveBookings()
}, 30 * 60 * 1000)

// ── Helpers ──────────────────────────────────────────────────────────────────
function clientIdForBooking(bookingId: string): string | undefined {
  return Array.from(clientBookings.entries()).find(([, bid]) => bid === bookingId)?.[0]
}

/** Sanitiza input: converte para string, remove espaços extremos, limita tamanho */
function sanitize(s: unknown, max = 200): string {
  return String(s ?? '').trim().slice(0, max)
}

/** Verifica rate limit por IP: máx 5 reservas por 10 min */
function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const window = 10 * 60 * 1000
  const entry  = rateLimit.get(ip)
  if (!entry || now - entry.ts > window) {
    rateLimit.set(ip, { count: 1, ts: now })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

/** Envia Web Push para um cliente específico */
async function sendPush(
  clientId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  const sub = pushSubscriptions.get(clientId)
  if (!sub) { console.warn(`sendPush: sem subscrição para ${clientId}`); return }
  if (!VAPID_PUBLIC_KEY) { console.warn('sendPush: VAPID não configurado'); return }
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title, body, data }))
    console.log(`Push enviado [${data.type || '?'}] → ${clientId.slice(0, 12)}…`)
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      pushSubscriptions.delete(clientId)
      savePushSubs()
      console.warn(`Push subscription expirada (${status}) removida: ${clientId}`)
    } else {
      console.error(`sendPush error [${status}]: ${String(e).slice(0, 120)}`)
    }
  }
}

/** Tradução automática — tenta Google, fallback Lingva */
async function translate(text: string, from: string, to: string): Promise<string> {
  if (from === to || !text.trim()) return text
  const q = encodeURIComponent(text.slice(0, 500))

  // Tentativa 1: Google Translate (não oficial, sem chave)
  try {
    const ctrl = new AbortController()
    const tid  = setTimeout(() => ctrl.abort(), 5000)
    const res  = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${q}`,
      { signal: ctrl.signal }
    )
    clearTimeout(tid)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t1 = (json?.[0] as any[])?.map((c: any[]) => c?.[0] ?? '').join('') ?? ''
    if (t1 && t1.toLowerCase() !== text.toLowerCase()) {
      console.log(`[translate] ${from}→${to} (Google): "${text.slice(0,30)}" → "${t1.slice(0,30)}"`)
      return t1
    }
  } catch (e) { console.warn(`[translate] Google falhou: ${String(e).slice(0, 80)}`) }

  // Tentativa 2: Lingva Translate (open-source, sem limites)
  try {
    const ctrl2 = new AbortController()
    const tid2  = setTimeout(() => ctrl2.abort(), 5000)
    const res2  = await fetch(
      `https://lingva.ml/api/v1/${from}/${to}/${q}`,
      { signal: ctrl2.signal }
    )
    clearTimeout(tid2)
    const json2 = await res2.json() as { translation?: string }
    const t2 = json2?.translation ?? ''
    if (t2 && t2.toLowerCase() !== text.toLowerCase()) {
      console.log(`[translate] ${from}→${to} (Lingva): "${text.slice(0,30)}" → "${t2.slice(0,30)}"`)
      return t2
    }
  } catch (e) { console.warn(`[translate] Lingva falhou: ${String(e).slice(0, 80)}`) }

  console.warn(`[translate] ${from}→${to}: ambas as APIs falharam — texto original devolvido`)
  return text
}

/** Mensagens de estado localizadas */
function statusMsg(event: string, lang: string): string {
  const en: Record<string, string> = {
    accepted:  '✅ Booking accepted!',
    rejected:  '❌ Booking rejected. Please try again.',
    arrived:   '📍 Driver arrived.',
    completed: '✅ Trip completed! Thank you. 🙏',
    cancelled: '❌ Booking cancelled.',
    onway:     '🚗 Driver is on the way!'
  }
  const pt: Record<string, string> = {
    accepted:  '✅ Viagem Aceite',
    rejected:  '❌ Reserva Recusada',
    arrived:   '📍 Motorista Chegou',
    completed: '✅ Viagem Concluída. Muito obrigado pela sua preferência.',
    cancelled: '❌ Reserva Cancelada',
    onway:     '🚗 Motorista a Caminho'
  }
  const fr: Record<string, string> = {
    accepted:  '✅ Réservation acceptée!',
    rejected:  '❌ Réservation refusée. Veuillez réessayer.',
    arrived:   '📍 Le chauffeur est arrivé.',
    completed: '✅ Trajet terminé! Merci. 🙏',
    cancelled: '❌ Réservation annulée.',
    onway:     '🚗 Le chauffeur est en route!'
  }
  const es: Record<string, string> = {
    accepted:  '✅ ¡Reserva aceptada!',
    rejected:  '❌ Reserva rechazada. Por favor intente nuevamente.',
    arrived:   '📍 El conductor ha llegado.',
    completed: '✅ ¡Viaje completado! Gracias. 🙏',
    cancelled: '❌ Reserva cancelada.',
    onway:     '🚗 ¡El conductor está en camino!'
  }
  const de: Record<string, string> = {
    accepted:  '✅ Buchung akzeptiert!',
    rejected:  '❌ Buchung abgelehnt. Bitte versuchen Sie es erneut.',
    arrived:   '📍 Fahrer angekommen.',
    completed: '✅ Fahrt abgeschlossen! Vielen Dank. 🙏',
    cancelled: '❌ Buchung storniert.',
    onway:     '🚗 Fahrer ist unterwegs!'
  }
  const it: Record<string, string> = {
    accepted:  '✅ Prenotazione accettata!',
    rejected:  '❌ Prenotazione rifiutata. Riprova.',
    arrived:   '📍 L\'autista è arrivato.',
    completed: '✅ Viaggio completato! Grazie. 🙏',
    cancelled: '❌ Prenotazione annullata.',
    onway:     '🚗 L\'autista è in viaggio!'
  }
  const zh: Record<string, string> = {
    accepted:  '✅ 预订已接受！',
    rejected:  '❌ 预订被拒绝。请重试。',
    arrived:   '📍 司机已到达。',
    completed: '✅ 行程完成！谢谢。🙏',
    cancelled: '❌ 预订已取消。',
    onway:     '🚗 司机正在路上！'
  }
  const ja: Record<string, string> = {
    accepted:  '✅ 予約が承認されました！',
    rejected:  '❌ 予約が拒否されました。もう一度お試しください。',
    arrived:   '📍 ドライバーが到着しました。',
    completed: '✅ 旅行が完了しました！ありがとうございます。🙏',
    cancelled: '❌ 予約がキャンセルされました。',
    onway:     '🚗 ドライバーが向かっています！'
  }
  const ru: Record<string, string> = {
    accepted:  '✅ Бронирование принято!',
    rejected:  '❌ Бронирование отклонено. Попробуйте еще раз.',
    arrived:   '📍 Водитель прибыл.',
    completed: '✅ Поездка завершена! Спасибо. 🙏',
    cancelled: '❌ Бронирование отменено.',
    onway:     '🚗 Водитель в пути!'
  }
  const nl: Record<string, string> = {
    accepted:  '✅ Boeking geaccepteerd!',
    rejected:  '❌ Boeking geweigerd. Probeer het opnieuw.',
    arrived:   '📍 Bestuurder is aangekomen.',
    completed: '✅ Rit voltooid! Dank u. 🙏',
    cancelled: '❌ Boeking geannuleerd.',
    onway:     '🚗 Bestuurder is onderweg!'
  }
  const pl: Record<string, string> = {
    accepted:  '✅ Rezerwacja przyjęta!',
    rejected:  '❌ Rezerwacja odrzucona. Spróbuj ponownie.',
    arrived:   '📍 Kierowca przyjechał.',
    completed: '✅ Podróż zakończona! Dziękujemy. 🙏',
    cancelled: '❌ Rezerwacja anulowana.',
    onway:     '🚗 Kierowca w drodze!'
  }

  const languages: Record<string, Record<string, string>> = {
    en, pt, fr, es, de, it, zh, ja, ru, nl, pl
  }
  
  return languages[lang]?.[event] || pt[event] || ''
}

/** Textos dos botões localizados (sempre em português) */
function buttonText(textKey: string, lang: string): string {
  const buttons: Record<string, string> = {
    accept:     '✅ Aceitar',
    reject:     '❌ Recusar',
    arrived:    '📍 Cheguei',
    onway:      '🚗 Motorista a Caminho',
    whatsapp:   '📱 WhatsApp',
    waze:       '🚀 Waze',
    complete:   '🏁 Concluir'
  }
  
  return buttons[textKey] || textKey
}

/** Mensagens de status para o Telegram (sempre em português) */
function telegramStatusMsg(status: string, lang: string): string {
  const messages: Record<string, string> = {
    accepted:  '✅ Viagem Aceite',
    rejected:  '❌ Reserva Recusada',
    arrived:   '📍 Motorista Chegou',
    completed: '✅ Viagem Concluída',
    cancelled: '❌ Reserva Cancelada',
    onway:     '🚗 Motorista a Caminho'
  }
  
  return messages[status] || status
}

/** Escapa caracteres especiais para HTML do Telegram */
function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Constrói a mensagem rica em HTML para o Telegram */
function buildMessage(b: Record<string, string>, statusLine = ''): string {
  const now = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
  let dateStr = `${esc(b.data)} às ${esc(b.hora)}`
  try {
    dateStr = new Date(`${b.data}T${b.hora}`).toLocaleString('pt-PT', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { /* mantém fallback */ }

  const header = statusLine
    ? `<b>🚖 NOVA RESERVA — 691.PT</b>\n<b>${statusLine}</b>`
    : `<b>🚖 NOVA RESERVA — 691.PT</b>`

  return (
    `${header}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>👤 Nome:</b> ${esc(b.nome)}\n` +
    `<b>📞 Tel:</b> <a href="tel:${esc(b.telefone)}">${esc(b.telefone)}</a>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>📍 DE:</b>  ${esc(b.recolha)}\n` +
    `<b>🏁 PARA:</b> ${esc(b.destino)}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>📅 Data/Hora:</b> ${dateStr}\n` +
    `<b>🕐 Pedido às:</b> ${now}\n` +
    `<b>🔑 ID:</b> <code>${esc(b.bookingId)}</code>`
  )
}

/** Formata número de telefone para link WhatsApp - mantém exatamente como cliente introduziu */
function formatWhatsAppNumber(telefone: string): string {
  // Apenas remove espaços, parênteses, traços e pontos - mantém o + e dígitos exatamente como foram introduzidos
  return telefone.replace(/[\s()\-\.]/g, '')
}
function buildKeyboard(bookingId: string, recolha: string, telefone?: string, status?: string, lang?: string) {
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(recolha)}&navigate=yes`
  const whatsappUrl = telefone ? `https://wa.me/${formatWhatsAppNumber(telefone)}` : null
  const language = lang || 'pt'
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[][] = [
    [
      { text: buttonText('accept', language),   callback_data: `accept_${bookingId}`  },
      { text: buttonText('reject', language),   callback_data: `reject_${bookingId}`  }
    ]
  ]
  
  // Adicionar botão "Motorista a caminho" em 3ª posição quando aceite
  if (status === 'accepted') {
    rows.push([{ text: buttonText('onway', language), callback_data: `onway_${bookingId}` }])
  }
  
  // Segunda linha de ação
  rows.push([
    { text: buttonText('arrived', language),  callback_data: `arrived_${bookingId}` },
    whatsappUrl ? { text: buttonText('whatsapp', language), url: whatsappUrl } : { text: buttonText('waze', language), url: wazeUrl }
  ])
  
  // Adicionar Waze como botão separado se houver WhatsApp
  if (whatsappUrl) {
    rows.push([{ text: buttonText('waze', language), url: wazeUrl }])
  }
  
  rows.push([{ text: buttonText('complete', language), callback_data: `complete_${bookingId}` }])
  return { inline_keyboard: rows }
}

/** Edita a mensagem Telegram original com o novo estado — mantém os botões visíveis */
async function editMsg(bookingId: string, statusLine: string): Promise<void> {
  const msgId   = bookingMessages.get(bookingId)
  const booking = activeBookings.get(bookingId)
  if (!bot || !TELEGRAM_CHAT_ID || !msgId || !booking) return
  try {
    const lang = booking.lang || 'pt'
    await bot.api.editMessageText(
      Number(TELEGRAM_CHAT_ID), msgId,
      buildMessage(booking, statusLine),
      { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, booking.recolha, booking.telefone, booking.status, lang) }
    )
  } catch (e) {
    console.warn('editMessageText falhou (pode já ter sido editada):', String(e).slice(0, 80))
  }
}

// ── Bot Telegram ─────────────────────────────────────────────────────────────
if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
  try {
    bot = new Bot(TELEGRAM_TOKEN)
    
    // Initialize bot asynchronously
    initBot().catch(console.error)

    async function initBot() {
      // Delete any existing webhook to ensure polling works
      await bot.api.deleteWebhook().catch(() => {})
      
      // Add delay to ensure webhook is fully deleted
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Start polling
      bot.start().catch((err) => {
        if (String(err).includes('409')) {
          console.warn('Bot Telegram: Erro 409 ao iniciar - outra instância pode estar ativa')
          // Não falhar completamente se for apenas conflito 409
        } else {
          console.error('Erro ao iniciar polling:', err)
        }
      })
    }

    // Comandos de texto
    bot.on('message', async (ctx) => {
      const text = ctx.message.text || ''

      if (text === '/start') {
        await ctx.reply(
          '<b>🚕 691 Lisboa — Central de Comando</b>\n\n' +
          '/start — Este menu\n' +
          '/status — Reservas ativas\n' +
          '/whatsapp — Contactar clientes via WhatsApp\n' +
          'Aguarde novas reservas.',
          { parse_mode: 'HTML' }
        )

      } else if (text === '/status') {
        const bookingList = activeBookings.size === 0
          ? 'Nenhuma reserva ativa.'
          : Array.from(activeBookings.values())
              .map(b => `• <code>${b.bookingId}</code> — ${esc(b.nome)} (${esc(b.recolha)})`)
              .join('\n')
        await ctx.reply(
          `<b>📊 Status 691.pt</b>\n\n` +
          `👥 Clientes online: <b>${connectedClients.size}</b>\n` +
          `🚕 Reservas ativas: <b>${activeBookings.size}</b>\n` +
          `🤖 Bot: ✅ Ativo\n\n${bookingList}`,
          { parse_mode: 'HTML' }
        )

      } else if (text === '/whatsapp') {
        if (activeBookings.size === 0) {
          await ctx.reply(
            '<b>💬 WhatsApp Clientes</b>\n\n' +
            '❌ Nenhuma reserva ativa para contactar.',
            { parse_mode: 'HTML' }
          )
        } else {
          const rows = Array.from(activeBookings.values()).map(booking => {
            const whatsappUrl = `https://wa.me/${formatWhatsAppNumber(booking.telefone)}`
            return [
              {
                text: `💬 ${esc(booking.nome)} (${esc(booking.telefone)})`,
                url: whatsappUrl
              }
            ]
          })
          
          await ctx.reply(
            '<b>💬 WhatsApp Clientes</b>\n\n' +
            `📱 <b>${activeBookings.size}</b> reserva(s) ativa(s):\n\n` +
            'Clique nos botões para abrir WhatsApp:',
            {
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: rows }
            }
          )
        }
      }
    })

    // Botões inline — um handler limpo por ação
    bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery.data || ''
      await ctx.answerCallbackQuery()

      // ── ✅ Aceitar ─────────────────────────────────────────────────────────
      if (data.startsWith('accept_')) {
        const bookingId = data.slice(7)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'accepted'
        if (clientId) {
          const msg = statusMsg('accepted', lang)
          io.to(clientId).emit('booking_accepted', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa 🚕', msg, { bookingId, type: 'accepted' }).catch(() => {})
        }
        // Broadcast status update to all sockets (including driver's tracking page)
        io.emit('booking_status_update', { bookingId, status: 'accepted', message: statusMsg('accepted', lang) })
        await editMsg(bookingId, telegramStatusMsg('accepted', lang))

      // ── ❌ Recusar ─────────────────────────────────────────────────────────
      } else if (data.startsWith('reject_')) {
        const bookingId = data.slice(7)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'rejected'
        saveBookings()
        await editMsg(bookingId, telegramStatusMsg('rejected', lang))
        if (clientId) {
          const msg = statusMsg('rejected', lang)
          io.to(clientId).emit('booking_rejected', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa', msg, { bookingId, type: 'rejected' }).catch(() => {})
        }
        // Broadcast status update
        io.emit('booking_status_update', { bookingId, status: 'rejected', message: statusMsg('rejected', lang) })
        bookingMessages.delete(bookingId)
        setTimeout(() => { activeBookings.delete(bookingId); if (clientId) clientBookings.delete(clientId); saveBookings() }, 5 * 60 * 1000)

      // ── 📍 Cheguei ─────────────────────────────────────────────────────────
      } else if (data.startsWith('arrived_')) {
        const bookingId = data.slice(8)
        console.log(`[Telegram] Cheguei clicado para reserva: ${bookingId}`)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        console.log(`[Telegram] ClientId encontrado: ${clientId}, Lang: ${lang}`)
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'arrived'
        saveBookings()
        if (clientId) {
          const msg = statusMsg('arrived', lang)
          io.to(clientId).emit('driver_arrived', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa 📍', msg, { bookingId, type: 'arrived' }).catch(() => {})
          console.log(`[Telegram] Evento driver_arrived emitido para ${clientId}`)
        } else {
          console.warn(`[Telegram] arrived_: clientId não encontrado para ${bookingId}`)
        }
        // Broadcast status update
        io.emit('booking_status_update', { bookingId, status: 'arrived', message: statusMsg('arrived', lang) })
        await editMsg(bookingId, telegramStatusMsg('arrived', lang))

      // ── 🚗 Motorista a caminho ────────────────────────────────────────────────────
      } else if (data.startsWith('onway_')) {
        const bookingId = data.slice(6)
        console.log(`[Telegram] Motorista a caminho clicado para reserva: ${bookingId}`)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'accepted' // Mantém status como accepted
        saveBookings()
        if (clientId) {
          const msg = statusMsg('onway', lang)
          io.to(clientId).emit('booking_status_update', { bookingId, status: 'accepted', message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa 🚕', msg, { bookingId, type: 'message' }).catch(() => {})
        }
        // Broadcast status update
        io.emit('booking_status_update', { bookingId, status: 'accepted', message: statusMsg('accepted', lang) })
        await editMsg(bookingId, telegramStatusMsg('onway', lang))

      // ── 🏁 Concluir ────────────────────────────────────────────────────────
      } else if (data.startsWith('complete_')) {
        const bookingId = data.slice(9)
        console.log(`[Telegram] Concluir clicado para reserva: ${bookingId}`)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        console.log(`[Telegram] ClientId encontrado: ${clientId}, Lang: ${lang}`)
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'completed'
        saveBookings()
        await editMsg(bookingId, telegramStatusMsg('completed', lang))
        if (clientId) {
          const msg = statusMsg('completed', lang)
          io.to(clientId).emit('booking_completed', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa ✅', msg, { bookingId, type: 'completed' }).catch(() => {})
          console.log(`[Telegram] Evento booking_completed emitido para ${clientId}`)
        } else {
          console.warn(`[Telegram] complete_: clientId não encontrado para ${bookingId}`)
        }
        // Broadcast status update
        io.emit('booking_status_update', { bookingId, status: 'completed', message: statusMsg('completed', lang) })
        bookingMessages.delete(bookingId)
        setTimeout(() => { activeBookings.delete(bookingId); if (clientId) clientBookings.delete(clientId); saveBookings() }, 5 * 60 * 1000)
      }
    })

    bot.catch((err) => {
      if (String(err).includes('409')) {
        console.warn('Bot Telegram: Conflito 409 detectado - tentando reiniciar...')
        setTimeout(() => {
          bot?.start().catch(() => {})
        }, 5000)
      } else {
        console.error('Erro no bot Telegram:', err)
      }
    })

    console.log('Bot Telegram inicializado (grammy)')
  } catch (error: unknown) {
    console.error('Erro ao inicializar bot Telegram:', error)
  }
} else {
  console.log('TELEGRAM_BOT_TOKEN não configurado — bot inativo')
}

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  connectedClients.add(socket.id)

  socket.on('register_client', (data: { clientId: string }) => {
    const clientId = sanitize(data.clientId, 64)
    socket.join(clientId)
    socket.data.clientId = clientId
    console.log(`Cliente registado: ${clientId} (push: ${pushSubscriptions.has(clientId) ? '✓' : '✗'})`)
  })

  socket.on('restore_session', (data: { clientId: string }) => {
    const clientId  = sanitize(data.clientId, 64)
    const bookingId = clientBookings.get(clientId)
    if (bookingId) {
      const booking = activeBookings.get(bookingId)
      if (booking) {
        socket.join(clientId)
        socket.data.clientId = clientId
        socket.emit('session_restored', {
          booking,
          status: booking.status || 'pending'
        })
        console.log(`Sessão restaurada: ${clientId} → ${bookingId}`)
        return
      }
    }
    socket.emit('session_not_found')
  })

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id)
    // Reserva mantida em memória — o cliente pode estar a fazer refresh
  })

  // Motorista envia posição GPS em tempo real
  socket.on('driver_location_update', (data: { lat: number; lng: number; bookingId: string }) => {
    const bookingId = sanitize(String(data.bookingId || ''), 20)
    if (!activeBookings.has(bookingId)) return
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return
    const lat = Math.max(-90,  Math.min(90,  data.lat))
    const lng = Math.max(-180, Math.min(180, data.lng))
    const clientId = clientIdForBooking(bookingId)
    if (!clientId) return
    io.to(clientId).emit('tracking_update', { lat, lng, bookingId, ts: Date.now() })
  })

  // Driver checks booking status (for GPS tracking page)
  socket.on('check_booking_status', (data: { bookingId: string }) => {
    const bookingId = sanitize(String(data.bookingId || ''), 20)
    const booking = activeBookings.get(bookingId)
    if (booking) {
      socket.emit('booking_status_result', {
        exists: true,
        status: booking.status || 'pending',
        message: statusMsg(booking.status || 'pending', booking.lang || 'pt')
      })
    } else {
      socket.emit('booking_status_result', { exists: false })
    }
  })

  // Cliente cancela reserva
  socket.on('cancel_booking', async (data) => {
    const clientId  = sanitize(data.clientId, 64)
    const bookingId = sanitize(data.bookingId, 20)

    // Verificar que o socket é o dono desta reserva
    if (clientId !== socket.data.clientId) {
      console.warn(`cancel_booking: clientId mismatch (socket=${socket.data.clientId}, payload=${clientId})`)
      return
    }
    const ownedBookingId = clientBookings.get(clientId)
    if (!ownedBookingId || ownedBookingId !== bookingId) {
      console.warn(`cancel_booking: bookingId mismatch para ${clientId}`)
      return
    }

    const booking = activeBookings.get(bookingId)
    const hasMsgId = bookingMessages.has(bookingId)

    // Notificar Telegram ANTES de apagar da memória
    // Editar mensagem original (marca como cancelada no histórico)
    if (booking && hasMsgId) {
      const lang = booking.lang || 'pt'
      await editMsg(bookingId, telegramStatusMsg('cancelled', lang)).catch(() => {})
    }
    // Enviar SEMPRE uma nova mensagem — edições não geram notificação no Telegram
    if (bot && TELEGRAM_CHAT_ID) {
      const lang = booking?.lang || 'pt'
      const cancelTitle = lang === 'en' ? '🚫 BOOKING CANCELLED BY CLIENT' : '🚫 RESERVA CANCELADA PELO CLIENTE'
      await bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        `<b>${cancelTitle}</b>\n` +
        `<b>ID:</b> <code>${esc(bookingId)}</code>\n` +
        `<b>👤</b> ${esc(booking?.nome || data.name || '—')} — ` +
        `<a href="tel:${esc(booking?.telefone || data.phone || '')}">${esc(booking?.telefone || data.phone || '—')}</a>\n` +
        `<b>📍</b> ${esc(booking?.recolha || '—')}\n` +
        `<b>🎯</b> ${esc(booking?.destino || '—')}`,
        { parse_mode: 'HTML' }
      ).catch(console.error)
    }

    // Ler lang antes de alterar estado
    const cancelledLang = activeBookings.get(bookingId)?.lang || 'pt'
    const cancelMsg     = statusMsg('cancelled', cancelledLang)
    const bkCancel      = activeBookings.get(bookingId)
    if (bkCancel) bkCancel.status = 'cancelled'
    saveBookings()

    bookingMessages.delete(bookingId)
    socket.emit('booking_cancelled', { bookingId, message: cancelMsg, timestamp: new Date().toISOString() })
    // Broadcast status update to driver's tracking page
    io.emit('booking_status_update', { bookingId, status: 'cancelled', message: cancelMsg })
    // Manter em memória 5 min (consistente com reject/complete)
    setTimeout(() => { activeBookings.delete(bookingId); clientBookings.delete(clientId); saveBookings() }, 5 * 60 * 1000)
  })
})

// ── Web Push endpoints ────────────────────────────────────────────────────────
app.get('/api/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null })
})

app.post('/api/subscribe', express.json({ limit: '50kb' }), (req: Request, res: Response) => {
  const raw = req.body || {}
  const clientId = sanitize(String(raw.clientId || ''), 64)
  const subscription = raw.subscription as webpush.PushSubscription
  if (!clientId || !subscription) return res.status(400).json({ ok: false })
  pushSubscriptions.set(clientId, subscription)
  savePushSubs()
  res.json({ ok: true })
})

// ── Booking details page (tracking only) ─────────────────────────────────────
app.get('/reserva/:id', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/reserva.html'))
})

// ── Ficheiros estáticos ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')))

// ... (rest of the code remains the same)
app.get('/api/geocode', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim()
  if (!q || q.length < 3) return res.json(null)
  const TOMTOM_KEY = process.env.TOMTOM_API_KEY
  if (!TOMTOM_KEY || TOMTOM_KEY === 'your_tomtom_api_key_here') return res.json(null)
  try {
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(q)}.json?key=${TOMTOM_KEY}&limit=1`
    const r = await fetch(url)
    if (!r.ok) return res.json(null)
    const body = await r.json() as { results?: Array<{ position: { lat: number; lon: number } }> }
    const pos = body.results?.[0]?.position
    if (!pos) return res.json(null)
    return res.json({ lat: pos.lat, lng: pos.lon })
  } catch {
    return res.json(null)
  }
})

// ── Route (motorista → recolha, rota real + tráfego) ─────────────────────────
app.get('/api/route', async (req: Request, res: Response) => {
  const from = String(req.query.from || '').trim()  // "lat,lng"
  const to   = String(req.query.to   || '').trim()  // "lat,lng"
  if (!from || !to) return res.json(null)

  const TOMTOM_KEY = process.env.TOMTOM_API_KEY
  if (TOMTOM_KEY && TOMTOM_KEY !== 'your_tomtom_api_key_here') {
    try {
      const url =
        `https://api.tomtom.com/routing/1/calculateRoute/${encodeURIComponent(from)}:${encodeURIComponent(to)}/json` +
        `?key=${TOMTOM_KEY}&traffic=true&travelMode=car`
      const r = await fetch(url)
      if (r.ok) {
        const body = await r.json() as {
          routes?: Array<{ summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number } }>
        }
        const s = body.routes?.[0]?.summary
        if (s) {
          return res.json({
            distanceKm:      (s.lengthInMeters / 1000).toFixed(1),
            etaMin:          Math.max(1, Math.ceil(s.travelTimeInSeconds / 60)),
            trafficDelaySec: s.trafficDelayInSeconds ?? 0
          })
        }
      }
    } catch { /* fall through to OSRM */ }
  }

  // OSRM fallback — free, no key, real road routing
  try {
    const [fromLat, fromLng] = from.split(',').map(Number)
    const [toLat,   toLng]   = to.split(',').map(Number)
    if ([fromLat, fromLng, toLat, toLng].some(isNaN)) return res.json(null)
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=full&geometries=geojson`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const r = await fetch(osrmUrl, { signal: controller.signal })
    clearTimeout(timeout)
    if (!r.ok) return res.json(null)
    const body = await r.json() as {
      routes?: Array<{ distance: number; duration: number; geometry: { type: string; coordinates: number[][] } }>
    }
    const route = body.routes?.[0]
    if (!route) return res.json(null)
    return res.json({
      distanceKm:      (route.distance / 1000).toFixed(1),
      etaMin:          Math.max(1, Math.ceil(route.duration / 60)),
      trafficDelaySec: 0,
      geometry:        route.geometry
    })
  } catch {
    return res.json(null)
  }
})

// ── Proxy TomTom Search API ───────────────────────────────────────────────────
app.get('/api/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim()
  if (!q || q.length < 2) return res.json([])

  const TOMTOM_KEY = process.env.TOMTOM_API_KEY
  if (!TOMTOM_KEY || TOMTOM_KEY === 'your_tomtom_api_key_here') return res.json([])

  try {
    const url =
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json` +
      `?key=${TOMTOM_KEY}&language=pt-PT&countrySet=PT&limit=8&typeahead=true` +
      `&lat=38.7169&lon=-9.1399&radius=60000`
    const r = await fetch(url)
    if (!r.ok) return res.json([])
    const body = await r.json() as { results?: Array<Record<string, unknown>> }
    const results = (body.results || []).map((item: Record<string, unknown>) => {
      const a   = (item.address || {}) as Record<string, string>
      const poi = (item.poi as Record<string, string> | undefined)?.name
      const street = a.streetName || ''
      const num    = a.streetNumber ? ` ${a.streetNumber}` : ''
      const city   = a.municipality || a.municipalitySubdivision || ''
      if (poi)    return `${poi}${street ? ' – ' + street + num : ''}${city ? ', ' + city : ''}`
      if (street) return `${street}${num}${city ? ', ' + city : ''}`
      return a.freeformAddress || ''
    }).filter(Boolean)
    return res.json(Array.from(new Set(results)))
  } catch (err) {
    console.error('TomTom search error:', err)
    return res.json([])
  }
})

app.get('/health', (_req: Request, res: Response) => res.send('OK'))

// ── POST /api/reserva ─────────────────────────────────────────────────────────
app.post('/api/reserva', express.json({ limit: '10kb' }), async (req: Request, res: Response) => {
  // Rate limiting por IP
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress || 'unknown'
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ success: false, error: 'Demasiados pedidos. Tente novamente em 10 minutos.' })
  }

  const raw = req.body || {}

  // Validação: campos obrigatórios
  if (!raw.nome || !raw.telefone || !raw.data || !raw.hora || !raw.recolha || !raw.destino || !raw.clientId) {
    return res.status(400).json({ success: false, error: 'Campos obrigatórios em falta' })
  }

  // Sanitização
  const nome     = sanitize(raw.nome, 100)
  const telefone = sanitize(raw.telefone, 30)
  const data     = sanitize(raw.data, 20)
  const hora     = sanitize(raw.hora, 10)
  const recolha  = sanitize(raw.recolha, 300)
  const destino  = sanitize(raw.destino, 300)
  const clientId = sanitize(raw.clientId, 64)
  const lang     = raw.lang || 'pt'

  if (nome.length < 2)
    return res.status(400).json({ success: false, error: 'Nome inválido' })
  if (!/^[+\d\s()\-]{7,30}$/.test(telefone))
    return res.status(400).json({ success: false, error: 'Telefone inválido' })
  if (recolha.length < 3 || destino.length < 3)
    return res.status(400).json({ success: false, error: 'Moradas inválidas' })

  const bookingId  = '691-' + Date.now().toString().slice(-6)
  const bookingData: Record<string, any> = {
    bookingId, nome, telefone, data, hora, recolha, destino, clientId, lang,
    status: 'pending', _ts: String(Date.now()),
  }

  activeBookings.set(bookingId, bookingData)
  clientBookings.set(clientId, bookingId)
  saveBookings()
  console.log('Nova reserva:', bookingId, nome, recolha, '→', destino)

  // Notificar cliente via socket
  io.to(clientId).emit('new_booking', {
    ...bookingData,
    message: `🚕 Reserva ${bookingId} recebida!`,
    timestamp: new Date().toISOString()
  })

  // Enviar para Telegram
  if (bot && TELEGRAM_CHAT_ID) {
    try {
      const sent = await bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        buildMessage(bookingData),
        { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, recolha, bookingData.telefone, 'pending', bookingData.lang || 'pt') }
      )
      bookingMessages.set(bookingId, sent.message_id)
    } catch (error: unknown) {
      console.error('Erro ao enviar para Telegram:', error)
      // Fallback: registar no log — reserva continua ativa no sistema
    }
  } else {
    console.log('Telegram não configurado — reserva registada apenas no sistema')
  }

  res.json({ success: true, bookingId, clientsConnected: connectedClients.size })
})

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Servidor na porta ${PORT}`)
  console.log(`Bot Telegram: ${bot ? 'Ativo' : 'Inativo'}`)
})
