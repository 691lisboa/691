import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Bot } from 'grammy'
import webpush from 'web-push'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import {
  persistenceMode,
  loadPersistentState,
  upsertBooking,
  deleteBooking,
  upsertPushSubscription,
  deletePushSubscription,
} from './store'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)
const server = createServer(app)
const ALLOWED_ORIGINS = new Set(['https://691.pt', 'https://www.691.pt', 'http://localhost:3000', 'http://localhost:5173'])
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true)
      return callback(new Error('Origin não permitida'))
    },
    methods: ['GET', 'POST']
  }
})

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()')
  next()
})

const PORT             = process.env.PORT || 5000
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
// Novas chaves VAPID geradas para corrigir erro de push
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL       = process.env.VAPID_EMAIL || 'mailto:jose@79.pt'
const TELEGRAM_WEBHOOK_URL = String(process.env.TELEGRAM_WEBHOOK_URL || '')
const TELEGRAM_WEBHOOK_SECRET = String(process.env.TELEGRAM_WEBHOOK_SECRET || '')

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
        'User-Agent': '691.pt/1.1 (jose@79.pt)',
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
  console.log('Web Push (VAPID) configurado com chaves válidas')
  console.log('[VAPID] Public key preview:', VAPID_PUBLIC_KEY.slice(0, 20) + '...')
} else {
  console.warn('VAPID keys não configuradas — Web Push inativo')
  console.warn('[VAPID] Public key exists:', !!VAPID_PUBLIC_KEY)
  console.warn('[VAPID] Private key exists:', !!VAPID_PRIVATE_KEY)
}

// ── Estado em memória + persistência ────────────────────────────────────────
let bot: Bot | null = null
const connectedClients = new Set<string>()
const activeBookings = new Map<string, Record<string, any>>()
const clientBookings = new Map<string, string>()
const bookingMessages = new Map<string, number>()
const rateLimit = new Map<string, { count: number; ts: number }>()
const apiRateLimit = new Map<string, { count: number; ts: number }>()
let persistenceReady = false

async function initializePersistence(): Promise<void> {
  if (persistenceMode !== 'supabase') {
    persistenceReady = false
    console.error('Persistência não configurada. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente de produção.')
    return
  }

  try {
    const state = await loadPersistentState()
    activeBookings.clear()
    clientBookings.clear()
    bookingMessages.clear()

    for (const booking of state.bookings) {
      activeBookings.set(String(booking.bookingId), booking)
      clientBookings.set(String(booking.clientId), String(booking.bookingId))
      if (booking._telegramMessageId) {
        bookingMessages.set(String(booking.bookingId), Number(booking._telegramMessageId))
      }
    }

    pushSubscriptions.clear()
    for (const row of state.pushSubscriptions) {
      pushSubscriptions.set(row.clientId, row.subscription as webpush.PushSubscription)
    }

    persistenceReady = true
    console.log(`Persistência: Supabase (${activeBookings.size} reservas, ${pushSubscriptions.size} push subscriptions)`)
  } catch (error) {
    persistenceReady = false
    console.error('Falha ao carregar Supabase:', error)
    throw error
  }
}

// Estado em memória usado como cache de execução. A persistência de produção
// é feita exclusivamente através do Supabase; não dependemos do filesystem
// efémero do Render.
const pushSubscriptions = new Map<string, webpush.PushSubscription>()

async function savePushSubs(): Promise<void> {
  if (persistenceMode !== 'supabase') return
  try {
    await Promise.all(Array.from(pushSubscriptions.entries()).map(([clientId, subscription]) =>
      upsertPushSubscription(clientId, subscription)
    ))
  } catch (error) {
    console.error('Falha ao persistir push subscriptions:', error)
  }
}

async function saveBookings(): Promise<void> {
  if (persistenceMode !== 'supabase') return
  try {
    await Promise.all(Array.from(activeBookings.values()).map(booking => upsertBooking(booking)))
  } catch (error) {
    console.error('Falha ao persistir reservas:', error)
    throw error
  }
}

async function deletePersistedBooking(bookingId: string): Promise<void> {
  if (persistenceMode !== 'supabase') return
  await deleteBooking(bookingId)
}

async function deletePersistedPushSubscription(clientId: string): Promise<void> {
  if (persistenceMode !== 'supabase') return
  await deletePushSubscription(clientId)
}

function clientIdForBooking(bookingId: string): string | undefined {
  return activeBookings.get(bookingId)?.clientId || Array.from(clientBookings.entries()).find(([, bid]) => bid === bookingId)?.[0]
}

function publicBooking(booking: Record<string, any>): Record<string, unknown> {
  return {
    bookingId: booking.bookingId,
    nome: booking.nome,
    telefone: booking.telefone,
    data: booking.data,
    hora: booking.hora,
    recolha: booking.recolha,
    destino: booking.destino,
    clientId: booking.clientId,
    lang: booking.lang,
    status: booking.status,
    createdAt: booking.createdAt || undefined,
    updatedAt: booking.updatedAt || undefined
  }
}

/** Sanitiza input: converte para string, remove espaços extremos, limita tamanho */
function sanitize(s: unknown, max = 200): string {
  return String(s ?? '').trim().slice(0, max)
}

function requestIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function checkRateLimit(key: string, max = 5, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now()
  const entry = rateLimit.get(key)
  if (!entry || now - entry.ts > windowMs) {
    rateLimit.set(key, { count: 1, ts: now })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function checkApiRateLimit(key: string, max = 30, windowMs = 60 * 1000): boolean {
  const now = Date.now()
  const entry = apiRateLimit.get(key)
  if (!entry || now - entry.ts > windowMs) {
    apiRateLimit.set(key, { count: 1, ts: now })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function hashDriverToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex')
}

function validDriverToken(booking: Record<string, any> | undefined, token: string): boolean {
  if (!booking || !token || !booking.driverTokenHash) return false
  const a = Buffer.from(String(booking.driverTokenHash), 'hex')
  const b = Buffer.from(hashDriverToken(token), 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function roomForDriver(bookingId: string): string {
  return `driver:${bookingId}`
}

app.use('/api', (req, res, next) => {
  const key = `${requestIp(req)}:${req.path}`
  if (!checkApiRateLimit(key, 120, 60 * 1000)) return res.status(429).json({ ok: false, error: 'Demasiados pedidos. Tente novamente em instantes.' })
  next()
})

// Limpar rate limit expirado a cada 15 min
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [key, entry] of Array.from(rateLimit.entries()))
    if (entry.ts < cutoff) rateLimit.delete(key)
  for (const [key, entry] of Array.from(apiRateLimit.entries()))
    if (entry.ts < cutoff) apiRateLimit.delete(key)
}, 15 * 60 * 1000)

// Limpar reservas pendentes expiradas (> 24h) a cada 30 min
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  let changed = false
  for (const [bookingId, booking] of Array.from(activeBookings.entries())) {
    // Só expirar reservas pendentes após 24h (dá tempo para aceitar no dia seguinte)
    if (booking.status === 'pending' && Number(booking._ts || 0) < cutoff) {
      for (const [cid, bid] of Array.from(clientBookings.entries()))
        if (bid === bookingId) clientBookings.delete(cid)
      activeBookings.delete(bookingId)
      bookingMessages.delete(bookingId)
      void deletePersistedBooking(bookingId).catch(err => console.warn(`Cleanup reserva expirada ${bookingId}:`, err))
      console.log(`Reserva pendente expirada (>24h): ${bookingId}`)
      changed = true
    }
  }
  if (changed) void saveBookings().catch(() => {})
}, 30 * 60 * 1000)

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
      deletePersistedPushSubscription(clientId)
      void savePushSubs().catch(() => {})
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
    onway:      '🚗 A caminho',
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
  // Hora de Portugal com DST automático (UTC+1 inverno, UTC+2 verão)
  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-PT', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Lisbon' 
  })
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
    `<b>🕐 Pedido às:</b> ${timeStr}\n` +
    `<b>🔑 ID:</b> <code>${esc(b.bookingId)}</code>`
  )
}

/** Formata número de telefone para link WhatsApp - mantém exatamente como cliente introduziu */
function formatWhatsAppNumber(telefone: string): string {
  // Apenas remove espaços, parênteses, traços e pontos - mantém o + e dígitos exatamente como foram introduzidos
  return telefone.replace(/[\s()\-\.]/g, '')
}
function buildKeyboard(bookingId: string, recolha: string, destino: string, telefone?: string, status?: string, lang?: string) {
  // Waze: pickup on accept/onway, destination on arrived
  const wazeAddress = (status === 'arrived') ? destino : recolha
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(wazeAddress)}&navigate=yes`
  const whatsappUrl = telefone ? `https://wa.me/${formatWhatsAppNumber(telefone)}` : null
  const language = lang || 'pt'
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[][] = []
  
  if (status === 'pending') {
    // Estado inicial: só Aceitar, Recusar, WhatsApp
    rows.push([
      { text: buttonText('accept', language), callback_data: `accept_${bookingId}` },
      { text: buttonText('reject', language), callback_data: `reject_${bookingId}` }
    ])
    if (whatsappUrl) {
      rows.push([{ text: buttonText('whatsapp', language), url: whatsappUrl }])
    }
  } else {
    // Depois de aceitar: Waze, Motorista a caminho, Cheguei, Concluir
    // Linha 1: Waze + Motorista a caminho
    rows.push([
      { text: buttonText('waze', language), url: wazeUrl },
      { text: buttonText('onway', language), callback_data: `onway_${bookingId}` }
    ])
    // Linha 2: Cheguei + Concluir
    rows.push([
      { text: buttonText('arrived', language), callback_data: `arrived_${bookingId}` },
      { text: buttonText('complete', language), callback_data: `complete_${bookingId}` }
    ])
    // Linha 3: WhatsApp (se houver)
    if (whatsappUrl) {
      rows.push([{ text: buttonText('whatsapp', language), url: whatsappUrl }])
    }
  }
  
  return { inline_keyboard: rows }
}

/** Edita a mensagem Telegram original com o novo estado — mantém os botões visíveis */
async function editMsg(bookingId: string, statusLine: string): Promise<void> {
  const booking = activeBookings.get(bookingId)
  const msgId = bookingMessages.get(bookingId) || Number(booking?._telegramMessageId || 0)
  if (!bot || !TELEGRAM_CHAT_ID || !msgId || !booking) return
  try {
    const lang = booking.lang || 'pt'
    await bot.api.editMessageText(
      Number(TELEGRAM_CHAT_ID), msgId,
      buildMessage(booking, statusLine),
      { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, booking.recolha, booking.destino, booking.telefone, booking.status, lang) }
    )
  } catch (e) {
    console.warn('editMessageText falhou (pode já ter sido editada):', String(e).slice(0, 80))
  }
}

// ── Alteração segura do estado da reserva ─────────────────────────────────────
type BookingStatus = 'pending' | 'accepted' | 'onway' | 'arrived' | 'completed' | 'rejected' | 'cancelled'

async function transitionBookingStatus(
  bookingId: string,
  nextStatus: BookingStatus,
  allowedCurrentStatuses: BookingStatus[]
): Promise<{ booking: Record<string, any>; clientId: string; lang: string } | null> {
  const booking = activeBookings.get(bookingId)
  if (!booking) {
    console.warn(`[Reserva] ${nextStatus}: reserva não encontrada: ${bookingId}`)
    return null
  }

  const currentStatus = String(booking.status || 'pending') as BookingStatus
  if (!allowedCurrentStatuses.includes(currentStatus)) {
    console.warn(`[Reserva] ${bookingId}: transição ${currentStatus} → ${nextStatus} não permitida`)
    return null
  }

  const previousStatus = booking.status
  booking.status = nextStatus

  try {
    await saveBookings()
  } catch (error) {
    booking.status = previousStatus
    console.error(`[Reserva] Falha ao persistir ${bookingId} (${currentStatus} → ${nextStatus}); estado revertido`, error)
    return null
  }

  return {
    booking,
    clientId: String(booking.clientId || ''),
    lang: String(booking.lang || 'pt')
  }
}

// ── Bot Telegram ─────────────────────────────────────────────────────────────
function setupTelegram() {
if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
  try {
    bot = new Bot(TELEGRAM_TOKEN)
    
    // Webhook is preferred in production because it avoids 409 conflicts during deploys.
    async function initBot() {
      await bot!.init()
      if (TELEGRAM_WEBHOOK_URL && TELEGRAM_WEBHOOK_SECRET) {
        await bot.api.setWebhook(TELEGRAM_WEBHOOK_URL, {
          secret_token: TELEGRAM_WEBHOOK_SECRET,
          drop_pending_updates: false,
          allowed_updates: ['message', 'callback_query']
        })
        app.post('/telegram/webhook', express.json({ limit: '256kb' }), async (req: Request, res: Response) => {
          const provided = String(req.get('X-Telegram-Bot-Api-Secret-Token') || '')
          if (!provided || provided !== TELEGRAM_WEBHOOK_SECRET) return res.sendStatus(401)
          try {
            await bot!.handleUpdate(req.body)
            res.sendStatus(200)
          } catch (error) {
            console.error('Telegram webhook error:', error)
            res.sendStatus(500)
          }
        })
        console.log('Telegram: Webhook configurado')
        return
      }
      console.warn('Telegram: webhook não configurado; a usar polling (configure TELEGRAM_WEBHOOK_URL e TELEGRAM_WEBHOOK_SECRET para produção).')
      await bot.api.deleteWebhook({ drop_pending_updates: false }).catch(() => {})
      bot.start().catch((err) => console.error('Erro ao iniciar polling:', err))
    }

    initBot().catch(err => console.error('Telegram init:', err))

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

    // Botões inline — valida cada transição e só notifica depois de persistir
    bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery.data || ''

      try {
        // ── ✅ Aceitar ─────────────────────────────────────────────────────────
        if (data.startsWith('accept_')) {
          const bookingId = data.slice(7)
          const result = await transitionBookingStatus(bookingId, 'accepted', ['pending'])
          if (!result) {
            await ctx.answerCallbackQuery({ text: 'Reserva indisponível ou já processada.', show_alert: true })
            return
          }

          await ctx.answerCallbackQuery({ text: 'Reserva aceite.' })
          const { clientId, lang } = result
          const msg = statusMsg('accepted', lang)
          if (clientId) {
            io.to(clientId).emit('booking_accepted', { bookingId, message: msg, timestamp: new Date().toISOString() })
            sendPush(clientId, '691 Lisboa 🚕', msg, { bookingId, type: 'accepted' }).catch(() => {})
          }
          io.to(roomForDriver(bookingId)).emit('booking_status_update', { bookingId, status: 'accepted', message: msg })
          await editMsg(bookingId, telegramStatusMsg('accepted', lang))
          return
        }

        // ── ❌ Recusar ─────────────────────────────────────────────────────────
        if (data.startsWith('reject_')) {
          const bookingId = data.slice(7)
          const result = await transitionBookingStatus(bookingId, 'rejected', ['pending'])
          if (!result) {
            await ctx.answerCallbackQuery({ text: 'Reserva indisponível ou já processada.', show_alert: true })
            return
          }

          await ctx.answerCallbackQuery({ text: 'Reserva recusada.' })
          const { clientId, lang } = result
          await editMsg(bookingId, telegramStatusMsg('rejected', lang))
          const msg = statusMsg('rejected', lang)
          if (clientId) {
            io.to(clientId).emit('booking_rejected', { bookingId, message: msg, timestamp: new Date().toISOString() })
            sendPush(clientId, '691 Lisboa', msg, { bookingId, type: 'rejected' }).catch(() => {})
          }
          io.to(roomForDriver(bookingId)).emit('booking_status_update', { bookingId, status: 'rejected', message: msg })
          bookingMessages.delete(bookingId)
          setTimeout(() => {
            activeBookings.delete(bookingId)
            if (clientId) clientBookings.delete(clientId)
            bookingMessages.delete(bookingId)
            void deletePersistedBooking(bookingId)
              .then(() => saveBookings())
              .catch(err => console.warn('Cleanup reserva:', err))
          }, 5 * 60 * 1000)
          return
        }

        // ── 🚗 Motorista a caminho ────────────────────────────────────────────
        if (data.startsWith('onway_')) {
          const bookingId = data.slice(6)
          const result = await transitionBookingStatus(bookingId, 'onway', ['accepted'])
          if (!result) {
            await ctx.answerCallbackQuery({ text: 'Estado da reserva inválido.', show_alert: true })
            return
          }

          await ctx.answerCallbackQuery({ text: 'A caminho.' })
          const { clientId, lang } = result
          const msg = statusMsg('onway', lang)
          if (clientId) {
            io.to(clientId).emit('booking_status_update', { bookingId, status: 'onway', message: msg, timestamp: new Date().toISOString() })
            sendPush(clientId, '691 Lisboa 🚕', msg, { bookingId, type: 'onway' }).catch(() => {})
          }
          io.to(roomForDriver(bookingId)).emit('booking_status_update', { bookingId, status: 'onway', message: msg })
          await editMsg(bookingId, telegramStatusMsg('onway', lang))
          return
        }

        // ── 📍 Cheguei ─────────────────────────────────────────────────────────
        if (data.startsWith('arrived_')) {
          const bookingId = data.slice(8)
          const result = await transitionBookingStatus(bookingId, 'arrived', ['accepted', 'onway'])
          if (!result) {
            await ctx.answerCallbackQuery({ text: 'Estado da reserva inválido.', show_alert: true })
            return
          }

          await ctx.answerCallbackQuery({ text: 'Cheguei.' })
          const { clientId, lang } = result
          const msg = statusMsg('arrived', lang)
          if (clientId) {
            io.to(clientId).emit('driver_arrived', { bookingId, message: msg, timestamp: new Date().toISOString() })
            sendPush(clientId, '691 Lisboa 📍', msg, { bookingId, type: 'arrived' }).catch(() => {})
          }
          io.to(roomForDriver(bookingId)).emit('booking_status_update', { bookingId, status: 'arrived', message: msg })
          await editMsg(bookingId, telegramStatusMsg('arrived', lang))
          return
        }

        // ── 🏁 Concluir ────────────────────────────────────────────────────────
        if (data.startsWith('complete_')) {
          const bookingId = data.slice(9)
          const result = await transitionBookingStatus(bookingId, 'completed', ['arrived', 'onway', 'accepted'])
          if (!result) {
            await ctx.answerCallbackQuery({ text: 'Estado da reserva inválido.', show_alert: true })
            return
          }

          await ctx.answerCallbackQuery({ text: 'Viagem concluída.' })
          const { clientId, lang } = result
          await editMsg(bookingId, telegramStatusMsg('completed', lang))
          const msg = statusMsg('completed', lang)
          if (clientId) {
            io.to(clientId).emit('booking_completed', { bookingId, message: msg, timestamp: new Date().toISOString() })
            sendPush(clientId, '691 Lisboa ✅', msg, { bookingId, type: 'completed' }).catch(() => {})
          }
          io.to(roomForDriver(bookingId)).emit('booking_status_update', { bookingId, status: 'completed', message: msg })
          bookingMessages.delete(bookingId)
          setTimeout(() => {
            activeBookings.delete(bookingId)
            if (clientId) clientBookings.delete(clientId)
            bookingMessages.delete(bookingId)
            void deletePersistedBooking(bookingId)
              .then(() => saveBookings())
              .catch(err => console.warn('Cleanup reserva:', err))
          }, 5 * 60 * 1000)
          return
        }

        await ctx.answerCallbackQuery({ text: 'Ação desconhecida.' })
      } catch (error) {
        console.error(`[Telegram] Erro ao processar callback "${data.slice(0, 40)}":`, error)
        try {
          await ctx.answerCallbackQuery({ text: 'Não foi possível atualizar a reserva.', show_alert: true })
        } catch {
          // callback já respondido
        }
      }
    })

    bot.catch((err) => {
      console.error('Erro no bot Telegram:', err)
    })

    console.log('Bot Telegram inicializado (grammy)')
  } catch (error: unknown) {
    console.error('Erro ao inicializar bot Telegram:', error)
  }
} else {
  console.log('TELEGRAM_BOT_TOKEN não configurado — bot inativo')
}
}

// ── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  connectedClients.add(socket.id)

  socket.on('register_client', (data: { clientId: string }) => {
    const clientId = sanitize(data.clientId, 64)
    // Accept the legacy client IDs already used by existing reservations,
    // plus the newer UUID-based IDs. Keep the value bounded and room-safe.
    if (!/^client-[A-Za-z0-9_-]{1,60}$/.test(clientId)) return
    socket.join(clientId)
    socket.data.clientId = clientId
    console.log(`Cliente registado: ${clientId} (push: ${pushSubscriptions.has(clientId) ? '✓' : '✗'})`)
  })

  socket.on('register_booking_view', (data: { bookingId: string }) => {
    const bookingId = sanitize(String(data?.bookingId || ''), 96)
    if (!bookingId) {
      socket.emit('booking_view_error', { error: 'Reserva inválida.' })
      return
    }

    const booking = activeBookings.get(bookingId)
    const clientId = clientIdForBooking(bookingId)

    if (!booking || !clientId) {
      socket.emit('booking_view_error', { error: 'Reserva não encontrada.' })
      return
    }

    socket.join(clientId)
    socket.data.clientId = clientId
    socket.data.bookingId = bookingId

    socket.emit('session_restored', {
      booking: publicBooking(booking),
      status: booking.status || 'pending'
    })

    console.log(`Vista da reserva registada: ${bookingId} → ${clientId}`)
  })

  socket.on('restore_session', (data: { clientId: string }) => {
    const clientId  = sanitize(data.clientId, 64)
    // Support both existing legacy client IDs and new UUID-based IDs.
    if (!/^client-[A-Za-z0-9_-]{1,60}$/.test(clientId)) {
      socket.emit('session_not_found')
      return
    }
    const bookingId = clientBookings.get(clientId)
    if (bookingId) {
      const booking = activeBookings.get(bookingId)
      if (booking) {
        socket.join(clientId)
        socket.data.clientId = clientId
        socket.emit('session_restored', {
          booking: publicBooking(booking),
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
  socket.on('driver_location_update', (data: { lat: number; lng: number; bookingId: string; driverToken: string }) => {
    const bookingId = sanitize(String(data.bookingId || ''), 64)
    const driverToken = sanitize(String(data.driverToken || ''), 128)
    const booking = activeBookings.get(bookingId)
    if (!validDriverToken(booking, driverToken)) return
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') return
    const lat = Math.max(-90, Math.min(90, data.lat))
    const lng = Math.max(-180, Math.min(180, data.lng))
    const clientId = clientIdForBooking(bookingId)
    if (!clientId) return
    socket.join(roomForDriver(bookingId))
    io.to(clientId).emit('tracking_update', { lat, lng, bookingId, ts: Date.now() })
  })

  // Driver checks booking status (for GPS tracking page) — requires private token.
  socket.on('check_booking_status', (data: { bookingId: string; driverToken: string }) => {
    const bookingId = sanitize(String(data.bookingId || ''), 64)
    const driverToken = sanitize(String(data.driverToken || ''), 128)
    const booking = activeBookings.get(bookingId)
    if (!validDriverToken(booking, driverToken)) {
      socket.emit('booking_status_result', { exists: false })
      return
    }
    socket.join(roomForDriver(bookingId))
    socket.data.driverBookingId = bookingId
    socket.emit('booking_status_result', {
      exists: true,
      status: booking.status || 'pending',
      message: statusMsg(booking.status || 'pending', booking.lang || 'pt')
    })
  })

  // Cliente cancela reserva
  socket.on('cancel_booking', async (data) => {
    const bookingId = sanitize(data.bookingId, 96)
    const socketClientId = sanitize(socket.data.clientId, 64)
    const payloadClientId = sanitize(data.clientId, 64)

    // A identidade usada para cancelar vem do socket autenticado/associado à reserva.
    // O clientId no payload é apenas compatibilidade com clientes antigos.
    if (!socketClientId || (payloadClientId && payloadClientId !== socketClientId)) {
      console.warn(`cancel_booking: clientId mismatch (socket=${socketClientId || 'undefined'}, payload=${payloadClientId || 'undefined'})`)
      return
    }

    const clientId = socketClientId
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
    if (!bkCancel) {
      socket.emit('booking_cancelled_error', { bookingId, message: 'Reserva não encontrada.' })
      return
    }

    const previousStatus = bkCancel.status
    bkCancel.status = 'cancelled'
    try {
      await saveBookings()
    } catch (error) {
      bkCancel.status = previousStatus
      console.error(`[Reserva] Falha ao cancelar ${bookingId}; estado revertido`, error)
      socket.emit('booking_cancelled_error', { bookingId, message: 'Não foi possível cancelar a reserva.' })
      return
    }

    bookingMessages.delete(bookingId)
    socket.emit('booking_cancelled', { bookingId, message: cancelMsg, timestamp: new Date().toISOString() })
    // Broadcast status update to driver's tracking page
    io.to(roomForDriver(bookingId)).emit('booking_status_update', { bookingId, status: 'cancelled', message: cancelMsg })
    // Manter em memória 5 min (consistente com reject/complete)
    setTimeout(() => { activeBookings.delete(bookingId); clientBookings.delete(clientId); bookingMessages.delete(bookingId); void deletePersistedBooking(bookingId).then(() => saveBookings()).catch(err => console.warn('Cleanup reserva:', err)) }, 5 * 60 * 1000)
  })
})

// ── Web Push endpoints ────────────────────────────────────────────────────────
app.get('/api/vapid-public-key', (_req: Request, res: Response) => {
  console.log('[VAPID] Public key requested:', VAPID_PUBLIC_KEY ? 'Sending key...' : 'No key available')
  res.json({ publicKey: VAPID_PUBLIC_KEY || null })
})

app.post('/api/subscribe', express.json({ limit: '50kb' }), async (req: Request, res: Response) => {
  const raw = req.body || {}
  const clientId = sanitize(String(raw.clientId || ''), 64)
  const subscription = raw.subscription as webpush.PushSubscription
  console.log('[Push] Subscribe request:', { clientId: clientId ? 'Yes' : 'No', subscription: subscription ? 'Yes' : 'No' })
  if (!clientId || !subscription) {
    console.warn('[Push] Subscribe failed: missing clientId or subscription')
    return res.status(400).json({ ok: false })
  }
  pushSubscriptions.set(clientId, subscription)
  await savePushSubs()
  console.log('[Push] Subscription saved for client:', clientId.slice(0, 12) + '...')
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


// ── POST /api/reserva ─────────────────────────────────────────────────────────
app.post('/api/reserva', express.json({ limit: '10kb' }), async (req: Request, res: Response) => {
  const raw = req.body || {}
  const lang = raw.lang || 'pt'
  
  // Rate limiting por IP
  const ip = requestIp(req)
  if (!checkRateLimit(ip)) {
    const rateLimitMsgs: Record<string, string> = {
      pt: 'Demasiados pedidos. Tente novamente em 10 minutos.',
      en: 'Too many requests. Please try again in 10 minutes.',
      fr: 'Trop de demandes. Veuillez réessayer dans 10 minutes.',
      es: 'Demasiadas solicitudes. Por favor inténtelo de nuevo en 10 minutos.',
      de: 'Zu viele Anfragen. Bitte versuchen Sie es in 10 Minuten erneut.',
      it: 'Troppe richieste. Per favore riprova tra 10 minuti.',
      zh: '请求过多。请10分钟后再试。',
      ja: 'リクエストが多すぎます。10分後にもう一度お試しください。',
      ru: 'Слишком много запросов. Пожалуйста, попробуйте снова через 10 минут.',
      nl: 'Te veel verzoeken. Probeer het over 10 minuten opnieuw.',
      pl: 'Zbyt wiele próśb. Spróbuj ponownie za 10 minut.'
    }
    return res.status(429).json({ success: false, error: rateLimitMsgs[lang] || rateLimitMsgs.pt })
  }

  // Validação: campos obrigatórios
  const validationMsgs: Record<string, Record<string, string>> = {
    pt: { missing: 'Campos obrigatórios em falta', name: 'Nome inválido', phone: 'Telefone inválido', address: 'Moradas inválidas' },
    en: { missing: 'Required fields missing', name: 'Invalid name', phone: 'Invalid phone', address: 'Invalid addresses' },
    fr: { missing: 'Champs obligatoires manquants', name: 'Nom invalide', phone: 'Téléphone invalide', address: 'Adresses invalides' },
    es: { missing: 'Campos obligatorios faltantes', name: 'Nombre inválido', phone: 'Teléfono inválido', address: 'Direcciones inválidas' },
    de: { missing: 'Pflichtfelder fehlen', name: 'Ungültiger Name', phone: 'Ungültiges Telefon', address: 'Ungültige Adressen' },
    it: { missing: 'Campi obbligatori mancanti', name: 'Nome non valido', phone: 'Telefono non valido', address: 'Indirizzi non validi' },
    zh: { missing: '必填字段缺失', name: '姓名无效', phone: '电话无效', address: '地址无效' },
    ja: { missing: '必須フィールドが不足しています', name: '無効な名前', phone: '無効な電話', address: '無効な住所' },
    ru: { missing: 'Обязательные поля отсутствуют', name: 'Неверное имя', phone: 'Неверный телефон', address: 'Неверные адреса' },
    nl: { missing: 'Verplichte velden ontbreken', name: 'Ongeldige naam', phone: 'Ongeldige telefoon', address: 'Ongeldige adressen' },
    pl: { missing: 'Brak wymaganych pól', name: 'Nieprawidłowe imię', phone: 'Nieprawidłowy telefon', address: 'Nieprawidłowe adresy' }
  }
  const vm = validationMsgs[lang] || validationMsgs.pt
  if (!raw.nome || !raw.telefone || !raw.data || !raw.hora || !raw.recolha || !raw.destino || !raw.clientId) {
    return res.status(400).json({ success: false, error: vm.missing })
  }

  // Sanitização
  const nome     = sanitize(raw.nome, 100)
  const telefone = sanitize(raw.telefone, 30)
  const data     = sanitize(raw.data, 20)
  const hora     = sanitize(raw.hora, 10)
  const recolha  = sanitize(raw.recolha, 300)
  const destino  = sanitize(raw.destino, 300)
  const clientId = sanitize(raw.clientId, 64)

  if (nome.length < 2)
    return res.status(400).json({ success: false, error: vm.name })
  if (!/^[+\d\s()\-]{7,30}$/.test(telefone))
    return res.status(400).json({ success: false, error: vm.phone })
  if (recolha.length < 3 || destino.length < 3)
    return res.status(400).json({ success: false, error: vm.address })

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    return res.status(400).json({ success: false, error: vm.missing })
  }
  const todayLisbon = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  if (data < todayLisbon) return res.status(400).json({ success: false, error: vm.missing })

  const existingBookingId = clientBookings.get(clientId)
  if (existingBookingId) {
    const existing = activeBookings.get(existingBookingId)
    if (existing && ['pending', 'accepted', 'onway', 'arrived'].includes(String(existing.status))) {
      return res.status(409).json({ success: false, error: 'Já tem uma reserva ativa.' , bookingId: existingBookingId })
    }
  }

  const bookingId = `691-${crypto.randomBytes(12).toString('hex')}`
  const driverToken = crypto.randomBytes(32).toString('hex')
  const driverTokenHash = hashDriverToken(driverToken)
  const bookingData: Record<string, any> = {
    bookingId, driverToken, driverTokenHash, nome, telefone, data, hora, recolha, destino, clientId, lang,
    status: 'pending', _ts: String(Date.now()),
  }

  // Persistir primeiro. Se o Supabase falhar, não deixamos a reserva "fantasma" em memória.
  activeBookings.set(bookingId, bookingData)
  clientBookings.set(clientId, bookingId)

  try {
    await saveBookings()
  } catch (error) {
    activeBookings.delete(bookingId)
    clientBookings.delete(clientId)
    bookingMessages.delete(bookingId)
    console.error(`[Reserva] Falha ao criar ${bookingId}; reserva revertida`, error)
    return res.status(503).json({
      success: false,
      error: 'Não foi possível registar a reserva. Tente novamente em instantes.'
    })
  }

  console.log('Nova reserva:', bookingId, nome, recolha, '→', destino)

  const successMsgs: Record<string, string> = {
    pt: '🚕 Reserva recebida!',
    en: '🚕 Booking received!',
    fr: '🚕 Réservation reçue !',
    es: '🚕 ¡Reserva recibida!',
    de: '🚕 Buchung erhalten!',
    it: '🚕 Prenotazione ricevuta!',
    zh: '🚕 预订已收到！',
    ja: '🚕 予約を受け付けました！',
    ru: '🚕 Бронирование получено!',
    nl: '🚕 Reservering ontvangen!',
    pl: '🚕 Rezerwacja otrzymana!'
  }

  // Notificar cliente via socket
  io.to(clientId).emit('new_booking', {
    ...publicBooking(bookingData),
    message: successMsgs[lang] || successMsgs.pt,
    timestamp: new Date().toISOString()
  })

  // Enviar para Telegram
  if (bot && TELEGRAM_CHAT_ID) {
    try {
      const sent = await bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        buildMessage(bookingData),
        { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, recolha, destino, bookingData.telefone, 'pending', bookingData.lang || 'pt') }
      )
      bookingMessages.set(bookingId, sent.message_id)
      bookingData._telegramMessageId = sent.message_id
      try {
        await saveBookings()
      } catch (error) {
        // A reserva já foi persistida; não a apagamos só por falhar a persistência
        // do ID da mensagem Telegram. Mantemos a reserva recuperável.
        bookingMessages.delete(bookingId)
        delete bookingData._telegramMessageId
        console.error(`[Telegram] Reserva ${bookingId} criada, mas não foi possível guardar o message_id`, error)
      }
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
async function bootstrap(): Promise<void> {
  await initializePersistence()
  setupTelegram()

  app.get('/health', (_req: Request, res: Response) => {
    if (!persistenceReady) return res.status(503).json({ ok: false, persistence: 'not-ready' })
    res.json({ ok: true, persistence: persistenceMode })
  })

  server.listen(PORT, () => {
    console.log(`Servidor na porta ${PORT}`)
    console.log(`Persistência: ${persistenceMode}`)
    console.log(`Bot Telegram: ${bot ? 'Ativo' : 'Inativo'}`)
  })
}

bootstrap().catch(error => {
  console.error('Falha fatal no arranque:', error)
  process.exit(1)
})
