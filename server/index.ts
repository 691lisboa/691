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
// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  if (req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000')
  res.setHeader('Permissions-Policy', 'geolocation=(), notifications=(self), camera=(), microphone=()')
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "object-src 'none'",
      "script-src 'self' https://unpkg.com",
      "script-src-attr 'none'",
      "style-src 'self' https://fonts.googleapis.com https://unpkg.com",
      "style-src-attr 'unsafe-inline'", // Leaflet positions map elements through runtime style attributes
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com https://unpkg.com",
      "connect-src 'self' wss://691.pt wss://www.691.pt ws://localhost:3000 ws://localhost:5173",
      "worker-src 'self' blob:",
      "manifest-src 'self'"
    ].join('; ')
  )
  next()
})

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


const PORT             = process.env.PORT || 5000
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
// Configuração Web Push (VAPID)
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL       = process.env.VAPID_EMAIL || 'mailto:jose@79.pt'
const TELEGRAM_WEBHOOK_URL = String(process.env.TELEGRAM_WEBHOOK_URL || '')
const TELEGRAM_WEBHOOK_SECRET = String(process.env.TELEGRAM_WEBHOOK_SECRET || '')
const IS_PRODUCTION = String(process.env.NODE_ENV || 'production').toLowerCase() === 'production'
const BOOKING_ACCESS_SECRET = String(process.env.BOOKING_ACCESS_SECRET || '')

if (BOOKING_ACCESS_SECRET.length < 32) {
  throw new Error('BOOKING_ACCESS_SECRET deve estar configurado com pelo menos 32 caracteres e ser independente dos restantes segredos.')
}

if (IS_PRODUCTION) {
  if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN === 'your_telegram_bot_token_here' || !TELEGRAM_CHAT_ID || !TELEGRAM_WEBHOOK_URL || !TELEGRAM_WEBHOOK_SECRET) {
    throw new Error('Em produção, Telegram requer BOT_TOKEN, CHAT_ID, WEBHOOK_URL e WEBHOOK_SECRET.')
  }
  if (!/^-?\d+$/.test(TELEGRAM_CHAT_ID)) {
    throw new Error('TELEGRAM_CHAT_ID inválido.')
  }
  if (TELEGRAM_WEBHOOK_SECRET.length < 16) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET deve ter pelo menos 16 caracteres.')
  }
}

function bookingAccessToken(bookingId: string): string {
  return crypto
    .createHmac('sha256', BOOKING_ACCESS_SECRET)
    .update(String(bookingId))
    .digest('base64url')
}

function validBookingAccessToken(bookingId: string, token: string): boolean {
  const provided = String(token || '')
  if (!provided) return false

  const expected = bookingAccessToken(bookingId)
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(expected, 'utf8')

  return a.length === b.length && crypto.timingSafeEqual(a, b)
}


function vapidKeyPairMatches(publicKey: string, privateKey: string): boolean {
  try {
    const ecdh = crypto.createECDH('prime256v1')
    ecdh.setPrivateKey(Buffer.from(privateKey, 'base64url'))
    const derivedPublicKey = ecdh.getPublicKey(undefined, 'uncompressed')
    const configuredPublicKey = Buffer.from(publicKey, 'base64url')

    return (
      derivedPublicKey.length === configuredPublicKey.length &&
      crypto.timingSafeEqual(derivedPublicKey, configuredPublicKey)
    )
  } catch {
    return false
  }
}

const VAPID_READY =
  Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) &&
  vapidKeyPairMatches(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

if (VAPID_READY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  console.log('Web Push (VAPID) configurado com par de chaves válido')
  console.log('[VAPID] Public key preview:', VAPID_PUBLIC_KEY.slice(0, 20) + '...')
} else if (VAPID_PUBLIC_KEY || VAPID_PRIVATE_KEY) {
  console.error('[VAPID] ERRO: a chave pública e a chave privada não pertencem ao mesmo par. Web Push desativado até corrigir as variáveis no Render.')
} else {
  console.warn('VAPID keys não configuradas — Web Push inativo')
}

if (IS_PRODUCTION && !VAPID_READY) {
  throw new Error('Em produção, Web Push requer um par VAPID público/privado válido.')
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
    throw new Error('Persistência não configurada. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')
  }

  try {
    const state = await loadPersistentState()
    activeBookings.clear()
    clientBookings.clear()
    bookingMessages.clear()

    const terminalBookingsToDelete: string[] = []
    for (const booking of state.bookings) {
      const bookingId = String(booking.bookingId)
      const status = normalizeBookingStatus(booking.status)

      // Estados finais só existem brevemente para permitir que o cliente receba
      // a última atualização. Depois de um restart não devem ressuscitar.
      if (TERMINAL_BOOKING_STATUSES.has(status)) {
        terminalBookingsToDelete.push(bookingId)
        continue
      }

      activeBookings.set(bookingId, booking)
      clientBookings.set(String(booking.clientId), bookingId)
      if (booking._telegramMessageId) {
        bookingMessages.set(bookingId, Number(booking._telegramMessageId))
      }
    }

    if (terminalBookingsToDelete.length) {
      await Promise.all(terminalBookingsToDelete.map(bookingId =>
        deletePersistedBooking(bookingId).catch(error => {
          console.warn(`Cleanup de reserva terminal ${bookingId}:`, String(error).slice(0, 120))
        })
      ))
    }

    pushSubscriptions.clear()
    for (const row of state.pushSubscriptions) {
      pushSubscriptions.set(row.clientId, row.subscription as webpush.PushSubscription)
    }

    persistenceReady = true
    console.log(`Persistência: Supabase (${activeBookings.size} reservas, ${pushSubscriptions.size} push subscriptions)`)
  } catch (error) {
    persistenceReady = false
    console.error('Falha ao carregar Supabase:', String(error).slice(0, 180))
    throw error
  }
}

// Estado em memória usado como cache de execução. A persistência de produção
// é feita exclusivamente através do Supabase; não dependemos do filesystem
// efémero do Render.
const pushSubscriptions = new Map<string, webpush.PushSubscription>()

async function persistBooking(booking: Record<string, any>): Promise<void> {
  if (persistenceMode !== 'supabase') return
  await upsertBooking(booking)
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
    accessToken: bookingAccessToken(String(booking.bookingId)),
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
  for (const [bookingId, booking] of Array.from(activeBookings.entries())) {
    // Só expirar reservas pendentes após 24h (dá tempo para aceitar no dia seguinte)
    if (booking.status === 'pending' && Number(booking._ts || 0) < cutoff) {
      for (const [cid, bid] of Array.from(clientBookings.entries()))
        if (bid === bookingId) clientBookings.delete(cid)
      activeBookings.delete(bookingId)
      bookingMessages.delete(bookingId)
      void deletePersistedBooking(bookingId).catch(error =>
        console.warn(`Falha ao eliminar reserva expirada ${bookingId}:`, String(error).slice(0, 120))
      )
      console.log(`Reserva pendente expirada (>24h): ${bookingId}`)
    }
  }
}, 30 * 60 * 1000)

/** Envia Web Push para um cliente específico */
async function sendPush(
  clientId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  const sub = pushSubscriptions.get(clientId)
  if (!sub) {
    console.warn(`sendPush: sem subscrição para ${clientId.slice(0, 12)}…`)
    return
  }
  if (!VAPID_READY) {
    console.warn('sendPush: VAPID não configurado ou par de chaves inválido')
    return
  }

  try {
    await webpush.sendNotification(sub, JSON.stringify({ title, body, data }))
    console.log(`Push enviado [${data.type || '?'}] → ${clientId.slice(0, 12)}…`)
  } catch (e: unknown) {
    const status = Number((e as { statusCode?: number }).statusCode || 0)
    const invalidSubscription = [400, 401, 403, 404, 410].includes(status)

    if (invalidSubscription) {
      pushSubscriptions.delete(clientId)
      try {
        await deletePersistedPushSubscription(clientId)
      } catch (deleteError) {
        console.warn(`Push: falha ao remover subscrição inválida de ${clientId.slice(0, 12)}…:`, String(deleteError).slice(0, 120))
      }

      // Se a página estiver aberta, força uma nova subscrição com a VAPID atual.
      io.to(clientId).emit('push_subscription_invalid', { status })
      console.warn(`Push subscription inválida (${status}) removida e renovação pedida: ${clientId.slice(0, 12)}…`)
      return
    }

    console.error(`sendPush error [${status || '?'}]: ${String(e).slice(0, 160)}`)
  }
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

/** Textos dos botões do painel Telegram. */
function buttonText(textKey: string): string {
  const buttons: Record<string, string> = {
    accept:   '✅ Aceitar',
    reject:   '❌ Recusar',
    arrived:  '📍 Cheguei',
    onway:    '🚗 A caminho',
    whatsapp: '📱 WhatsApp',
    waze:     '🚀 Waze',
    complete: '🏁 Concluir',
    close:    '🗑️ Fechar'
  }
  return buttons[textKey] || textKey
}

type BookingStatus = 'pending' | 'accepted' | 'onway' | 'arrived' | 'completed' | 'rejected' | 'cancelled'
const TERMINAL_BOOKING_STATUSES = new Set<BookingStatus>(['completed', 'rejected', 'cancelled'])
const BOOKING_TRANSITIONS: Record<BookingStatus, ReadonlySet<BookingStatus>> = {
  pending:   new Set(['accepted', 'rejected', 'cancelled']),
  accepted:  new Set(['onway', 'arrived', 'completed', 'cancelled']),
  onway:     new Set(['arrived', 'completed']),
  arrived:   new Set(['completed']),
  completed: new Set(),
  rejected:  new Set(),
  cancelled: new Set()
}

function normalizeBookingStatus(value: unknown): BookingStatus {
  const status = String(value || 'pending') as BookingStatus
  return Object.prototype.hasOwnProperty.call(BOOKING_TRANSITIONS, status) ? status : 'pending'
}

function canTransitionBooking(booking: Record<string, any>, next: BookingStatus): boolean {
  return BOOKING_TRANSITIONS[normalizeBookingStatus(booking.status)].has(next)
}

async function transitionBookingStatus(bookingId: string, next: BookingStatus): Promise<Record<string, any> | null> {
  const booking = activeBookings.get(bookingId)
  if (!booking || !canTransitionBooking(booking, next)) return null
  booking.status = next
  booking.updatedAt = new Date().toISOString()
  await persistBooking(booking)
  return booking
}

function scheduleTerminalCleanup(bookingId: string, clientId?: string): void {
  setTimeout(() => {
    activeBookings.delete(bookingId)
    if (clientId && clientBookings.get(clientId) === bookingId) clientBookings.delete(clientId)
    bookingMessages.delete(bookingId)
    void deletePersistedBooking(bookingId).catch(err => console.warn('Cleanup reserva:', String(err).slice(0, 120)))
  }, 5 * 60 * 1000)
}

/** Mensagens de status para o Telegram (sempre em português). */
function telegramStatusMsg(status: string): string {
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

/** Escapa caracteres especiais para HTML do Telegram. */
function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Constrói a mensagem rica em HTML para o Telegram. */
function buildMessage(b: Record<string, string>, statusLine = ''): string {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-PT', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon'
  })
  let dateStr = `${esc(b.data)} às ${esc(b.hora)}`
  try {
    const [year, month, day] = String(b.data).split('-').map(Number)
    if (year && month && day) {
      const dateLabel = new Intl.DateTimeFormat('pt-PT', {
        weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC'
      }).format(new Date(Date.UTC(year, month - 1, day)))
      dateStr = `${dateLabel} às ${esc(b.hora)}`
    }
  } catch { /* mantém fallback */ }

  const header = statusLine
    ? `<b>🚖 RESERVA — 691.PT</b>
<b>${statusLine}</b>`
    : `<b>🚖 NOVA RESERVA — 691.PT</b>`

  return (
    `${header}
` +
    `━━━━━━━━━━━━━━━━━━━━━
` +
    `<b>👤 Nome:</b> ${esc(b.nome)}
` +
    `<b>📞 Tel:</b> <a href="tel:${esc(b.telefone)}">${esc(b.telefone)}</a>
` +
    `━━━━━━━━━━━━━━━━━━━━━
` +
    `<b>📍 DE:</b>  ${esc(b.recolha)}
` +
    `<b>🏁 PARA:</b> ${esc(b.destino)}
` +
    `━━━━━━━━━━━━━━━━━━━━━
` +
    `<b>📅 Data/Hora:</b> ${dateStr}
` +
    `<b>🕐 Pedido às:</b> ${timeStr}
` +
    `<b>🔑 ID:</b> <code>${esc(b.bookingId)}</code>`
  )
}

function formatWhatsAppNumber(telefone: string): string {
  let digits = String(telefone || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  // Números nacionais portugueses introduzidos sem indicativo.
  if (digits.length === 9) digits = `351${digits}`
  return digits
}

function buildKeyboard(bookingId: string, recolha: string, destino: string, telefone?: string, status?: string) {
  const current = normalizeBookingStatus(status)
  if (TERMINAL_BOOKING_STATUSES.has(current)) return { inline_keyboard: [] as any[][] }

  const wazeAddress = current === 'arrived' ? destino : recolha
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(wazeAddress)}&navigate=yes`
  const whatsappUrl = telefone ? `https://wa.me/${formatWhatsAppNumber(telefone)}` : null
  const rows: any[][] = []

  if (current === 'pending') {
    rows.push([
      { text: buttonText('accept'), callback_data: `accept_${bookingId}` },
      { text: buttonText('reject'), callback_data: `reject_${bookingId}` }
    ])
  } else if (current === 'accepted') {
    rows.push([
      { text: buttonText('waze'), url: wazeUrl },
      { text: buttonText('onway'), callback_data: `onway_${bookingId}` }
    ])
    rows.push([
      { text: buttonText('arrived'), callback_data: `arrived_${bookingId}` },
      { text: buttonText('complete'), callback_data: `complete_${bookingId}` }
    ])
  } else if (current === 'onway') {
    rows.push([{ text: buttonText('waze'), url: wazeUrl }])
    rows.push([
      { text: buttonText('arrived'), callback_data: `arrived_${bookingId}` },
      { text: buttonText('complete'), callback_data: `complete_${bookingId}` }
    ])
  } else if (current === 'arrived') {
    rows.push([{ text: buttonText('waze'), url: wazeUrl }])
    rows.push([{ text: buttonText('complete'), callback_data: `complete_${bookingId}` }])
  }

  if (whatsappUrl) rows.push([{ text: buttonText('whatsapp'), url: whatsappUrl }])
  rows.push([{ text: buttonText('close'), callback_data: `close_${bookingId}` }])
  return { inline_keyboard: rows }
}

/** Edita a mensagem Telegram original com o estado e apenas as ações válidas. */
async function editMsg(bookingId: string, statusLine: string): Promise<void> {
  const booking = activeBookings.get(bookingId)
  const msgId = bookingMessages.get(bookingId) || Number(booking?._telegramMessageId || 0)
  if (!bot || !TELEGRAM_CHAT_ID || !msgId || !booking) return
  try {
    await bot.api.editMessageText(
      Number(TELEGRAM_CHAT_ID), msgId,
      buildMessage(booking, statusLine),
      { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, booking.recolha, booking.destino, booking.telefone, booking.status) }
    )
  } catch (e) {
    console.warn('editMessageText falhou (pode já ter sido editada):', String(e).slice(0, 80))
  }
}

// Fecho administrativo: remove imediatamente a reserva da memória e do Supabase.
async function closeBookingAdmin(bookingId: string): Promise<boolean> {
  const booking = activeBookings.get(bookingId)
  if (!booking) return false
  const clientId = clientIdForBooking(bookingId)

  // Primeiro remove da persistência; só depois altera o cache em memória.
  await deletePersistedBooking(bookingId)
  activeBookings.delete(bookingId)
  bookingMessages.delete(bookingId)

  // Se houver outra reserva ativa do mesmo cliente (por exemplo, testes antigos),
  // mantém o apontador para essa reserva em vez de o deixar sem sessão.
  if (clientId) {
    const remaining = Array.from(activeBookings.values()).find(b => String(b.clientId) === String(clientId))
    if (remaining) clientBookings.set(clientId, String(remaining.bookingId))
    else clientBookings.delete(clientId)
  }
  return true
}

function authorizedTelegramChat(ctx: any): boolean {
  if (!TELEGRAM_CHAT_ID) return false
  const chatId = ctx?.callbackQuery?.message?.chat?.id ?? ctx?.chat?.id
  return String(chatId ?? '') === String(TELEGRAM_CHAT_ID)
}

function validTelegramWebhookSecret(provided: string): boolean {
  if (!provided || !TELEGRAM_WEBHOOK_SECRET) return false
  const a = Buffer.from(provided, 'utf8')
  const b = Buffer.from(TELEGRAM_WEBHOOK_SECRET, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
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
        let webhookPath = '/telegram/webhook'
        try {
          const webhookUrl = new URL(TELEGRAM_WEBHOOK_URL)
          if (IS_PRODUCTION && webhookUrl.protocol !== 'https:') throw new Error('Webhook não HTTPS')
          webhookPath = webhookUrl.pathname || webhookPath
        } catch {
          throw new Error('TELEGRAM_WEBHOOK_URL inválido; em produção deve usar HTTPS.')
        }
        if (!webhookPath.startsWith('/') || webhookPath.includes('*')) {
          throw new Error('Caminho de TELEGRAM_WEBHOOK_URL inválido.')
        }

        // Regista primeiro o endpoint local para não existir uma janela de corrida
        // entre setWebhook() e a disponibilidade do handler.
        app.post(webhookPath, express.json({ limit: '256kb' }), async (req: Request, res: Response) => {
          const provided = String(req.get('X-Telegram-Bot-Api-Secret-Token') || '')
          if (!validTelegramWebhookSecret(provided)) return res.sendStatus(401)
          try {
            await bot!.handleUpdate(req.body)
            res.sendStatus(200)
          } catch (error) {
            console.error('Telegram webhook error:', String(error).slice(0, 160))
            res.sendStatus(500)
          }
        })

        await bot.api.setWebhook(TELEGRAM_WEBHOOK_URL, {
          secret_token: TELEGRAM_WEBHOOK_SECRET,
          drop_pending_updates: false,
          allowed_updates: ['message', 'callback_query']
        })
        console.log('Telegram: Webhook configurado')
        return
      }
      console.warn('Telegram: webhook não configurado; a usar polling (configure TELEGRAM_WEBHOOK_URL e TELEGRAM_WEBHOOK_SECRET para produção).')
      await bot.api.deleteWebhook({ drop_pending_updates: false }).catch(() => {})
      bot.start().catch((err) => console.error('Erro ao iniciar polling:', String(err).slice(0, 160)))
    }

    initBot().catch(err => console.error('Telegram init:', String(err).slice(0, 160)))

    // Comandos de texto — o bot administrativo responde apenas ao chat configurado.
    bot.on('message', async (ctx) => {
      if (!authorizedTelegramChat(ctx)) return
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
              .map(b => `• <code>${esc(b.bookingId)}</code> — ${esc(b.nome)} (${esc(b.recolha)})`)
              .join('\n')
        const statusRows = Array.from(activeBookings.values()).map(b => [
          { text: `🗑️ Fechar ${String(b.bookingId).slice(-8)}`, callback_data: `close_${b.bookingId}` }
        ])
        await ctx.reply(
          `<b>📊 Status 691.pt</b>\n\n` +
          `👥 Clientes online: <b>${connectedClients.size}</b>\n` +
          `🚕 Reservas ativas: <b>${activeBookings.size}</b>\n` +
          `🤖 Bot: ✅ Ativo\n\n${bookingList}`,
          { parse_mode: 'HTML', reply_markup: statusRows.length ? { inline_keyboard: statusRows } : undefined }
        )
      } else if (text === '/whatsapp') {
        if (activeBookings.size === 0) {
          await ctx.reply('<b>💬 WhatsApp Clientes</b>\n\n❌ Nenhuma reserva ativa para contactar.', { parse_mode: 'HTML' })
          return
        }
        const rows = Array.from(activeBookings.values()).map(booking => [{
          text: `💬 ${booking.nome} (${booking.telefone})`,
          url: `https://wa.me/${formatWhatsAppNumber(booking.telefone)}`
        }])
        await ctx.reply(
          '<b>💬 WhatsApp Clientes</b>\n\n' +
          `📱 <b>${activeBookings.size}</b> reserva(s) ativa(s):\n\n` +
          'Clique nos botões para abrir WhatsApp:',
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: rows } }
        )
      }
    })

    bot.on('callback_query', async (ctx) => {
      const data = ctx.callbackQuery.data || ''

      if (!authorizedTelegramChat(ctx)) {
        await ctx.answerCallbackQuery({ text: 'Não autorizado.', show_alert: true }).catch(() => {})
        return
      }

      if (data.startsWith('close_')) {
        const bookingId = data.slice(6)
        const booking = activeBookings.get(bookingId)
        if (!booking) {
          await ctx.answerCallbackQuery({ text: 'Reserva já fechada.', show_alert: false }).catch(() => {})
          return
        }
        await ctx.answerCallbackQuery({ text: 'A fechar reserva…' }).catch(() => {})
        const clientId = clientIdForBooking(bookingId)
        const lang = booking.lang || 'pt'
        const msgId = bookingMessages.get(bookingId) || Number(booking._telegramMessageId || 0)
        const closed = await closeBookingAdmin(bookingId)
        if (!closed) return
        if (bot && TELEGRAM_CHAT_ID && msgId) {
          try {
            await bot.api.editMessageText(
              Number(TELEGRAM_CHAT_ID), msgId,
              buildMessage(booking, '🗑️ Reserva Fechada pelo motorista'),
              { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
            )
          } catch (e) {
            console.warn('Não foi possível editar mensagem da reserva fechada:', String(e).slice(0, 100))
          }
        }
        if (clientId) {
          io.to(clientId).emit('booking_closed', { bookingId, message: statusMsg('cancelled', lang), timestamp: new Date().toISOString() })
        }
        console.log(`[Telegram] Reserva fechada administrativamente: ${bookingId}`)
        return
      }

      const actionMap: Array<{ prefix: string; next: BookingStatus }> = [
        { prefix: 'accept_', next: 'accepted' },
        { prefix: 'reject_', next: 'rejected' },
        { prefix: 'onway_', next: 'onway' },
        { prefix: 'arrived_', next: 'arrived' },
        { prefix: 'complete_', next: 'completed' }
      ]
      const action = actionMap.find(item => data.startsWith(item.prefix))
      if (!action) {
        await ctx.answerCallbackQuery({ text: 'Ação desconhecida.', show_alert: false }).catch(() => {})
        return
      }

      const bookingId = data.slice(action.prefix.length)
      const booking = activeBookings.get(bookingId)
      if (!booking) {
        await ctx.answerCallbackQuery({ text: 'Reserva já fechada.', show_alert: false }).catch(() => {})
        return
      }
      if (!canTransitionBooking(booking, action.next)) {
        await ctx.answerCallbackQuery({ text: 'Esta ação já não é válida para o estado atual.', show_alert: true }).catch(() => {})
        return
      }

      await ctx.answerCallbackQuery().catch(() => {})
      const updated = await transitionBookingStatus(bookingId, action.next)
      if (!updated) return

      const clientId = clientIdForBooking(bookingId)
      const lang = updated.lang || 'pt'
      const msg = statusMsg(action.next, lang)

      if (clientId) {
        if (action.next === 'accepted') {
          io.to(clientId).emit('booking_accepted', { bookingId, message: msg, timestamp: new Date().toISOString() })
          void sendPush(clientId, '691 Lisboa 🚕', msg, { bookingId, type: 'accepted' })
        } else if (action.next === 'rejected') {
          io.to(clientId).emit('booking_rejected', { bookingId, message: msg, timestamp: new Date().toISOString() })
          void sendPush(clientId, '691 Lisboa', msg, { bookingId, type: 'rejected' })
        } else if (action.next === 'onway') {
          io.to(clientId).emit('booking_status_update', { bookingId, status: 'onway', message: msg, timestamp: new Date().toISOString() })
          void sendPush(clientId, '691 Lisboa 🚕', msg, { bookingId, type: 'onway' })
        } else if (action.next === 'arrived') {
          io.to(clientId).emit('driver_arrived', { bookingId, message: msg, timestamp: new Date().toISOString() })
          void sendPush(clientId, '691 Lisboa 📍', msg, { bookingId, type: 'arrived' })
        } else if (action.next === 'completed') {
          io.to(clientId).emit('booking_completed', { bookingId, message: msg, timestamp: new Date().toISOString() })
          void sendPush(clientId, '691 Lisboa ✅', msg, { bookingId, type: 'completed' })
        }
      }

      await editMsg(bookingId, telegramStatusMsg(action.next))
      console.log(`[Telegram] Estado ${action.next}: ${bookingId}`)

      if (TERMINAL_BOOKING_STATUSES.has(action.next)) {
        bookingMessages.delete(bookingId)
        scheduleTerminalCleanup(bookingId, clientId)
      }
    })

    bot.catch((err) => {
      console.error('Erro no bot Telegram:', String(err).slice(0, 160))
    })

    console.log('Bot Telegram inicializado (grammy)')
  } catch (error: unknown) {
    console.error('Erro ao inicializar bot Telegram:', String(error).slice(0, 160))
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
    console.log(`Cliente registado: ${clientId.slice(0, 12)}… (push: ${pushSubscriptions.has(clientId) ? '✓' : '✗'})`)
  })

  socket.on('register_booking_view', (data: { bookingId: string; accessToken?: string }) => {
    const bookingId = sanitize(String(data?.bookingId || ''), 96)
    const accessToken = sanitize(String(data?.accessToken || ''), 128)
    if (!bookingId || !validBookingAccessToken(bookingId, accessToken)) {
      socket.emit('booking_view_error', { error: 'Acesso à reserva inválido.' })
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

    console.log(`Vista da reserva registada: ${bookingId} → ${clientId.slice(0, 12)}…`)
  })

  socket.on('restore_session', (data: { clientId: string; accessToken?: string }) => {
    const clientId = sanitize(data?.clientId, 64)
    const accessToken = sanitize(data?.accessToken, 128)
    if (!/^client-[A-Za-z0-9_-]{1,60}$/.test(clientId)) {
      socket.emit('session_not_found')
      return
    }

    const bookingId = clientBookings.get(clientId)
    const booking = bookingId ? activeBookings.get(bookingId) : undefined
    if (!bookingId || !booking || !validBookingAccessToken(bookingId, accessToken)) {
      socket.emit('session_not_found')
      return
    }

    socket.join(clientId)
    socket.data.clientId = clientId
    socket.emit('session_restored', {
      booking: publicBooking(booking),
      status: booking.status || 'pending'
    })
    console.log(`Sessão restaurada: ${clientId.slice(0, 12)}… → ${bookingId}`)
  })

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id)
    // Reserva mantida em memória — o cliente pode estar a fazer refresh
  })

  // Cliente cancela reserva
  socket.on('cancel_booking', async (data, acknowledge?: (result: { ok: boolean; error?: string }) => void) => {
    const bookingId = sanitize(data?.bookingId, 96)
    const socketClientId = sanitize(socket.data.clientId, 64)
    const payloadClientId = sanitize(data?.clientId, 64)
    const accessToken = sanitize(data?.accessToken, 128)

    const fail = (error: string) => {
      console.warn(`cancel_booking: ${error} (booking=${bookingId || 'undefined'}, socketClient=${socketClientId ? socketClientId.slice(0, 12) + '…' : 'undefined'})`)
      acknowledge?.({ ok: false, error })
    }

    if (!bookingId || !socketClientId || !validBookingAccessToken(bookingId, accessToken)) {
      fail('dados de cancelamento ou token inválidos')
      return
    }

    if (payloadClientId && payloadClientId !== socketClientId) {
      fail('clientId mismatch')
      return
    }

    const clientId = socketClientId
    const booking = activeBookings.get(bookingId)

    // A reserva é do cliente se o próprio registo da reserva contém este clientId.
    // Isto evita falhas por um apontador clientBookings desatualizado após refresh/deploy.
    if (!booking || String(booking.clientId) !== clientId) {
      fail('reserva não encontrada ou não pertence ao cliente')
      return
    }

    if (!canTransitionBooking(booking, 'cancelled')) {
      fail('reserva já terminada ou não cancelável')
      return
    }

    // Repara o apontador em memória caso tenha ficado desatualizado.
    if (clientBookings.get(clientId) !== bookingId) {
      clientBookings.set(clientId, bookingId)
      console.log(`cancel_booking: sessão reparada para ${clientId.slice(0, 12)}… → ${bookingId}`)
    }

    const lang = booking.lang || 'pt'
    const cancelMsg = statusMsg('cancelled', lang)

    // Atualizar primeiro o estado e persistir através da máquina de estados.
    let cancelledBooking: Record<string, any> | null = null
    try {
      cancelledBooking = await transitionBookingStatus(bookingId, 'cancelled')
    } catch (error) {
      console.error(`cancel_booking: falha de persistência (${bookingId}):`, String(error).slice(0, 120))
      fail('não foi possível guardar o cancelamento')
      return
    }
    if (!cancelledBooking) {
      fail('reserva já terminada ou não cancelável')
      return
    }

    // Atualiza a mensagem original no Telegram sem botões ativos.
    const msgId = bookingMessages.get(bookingId) || Number(booking._telegramMessageId || 0)
    if (bot && TELEGRAM_CHAT_ID && msgId) {
      try {
        await bot.api.editMessageText(
          Number(TELEGRAM_CHAT_ID),
          msgId,
          buildMessage(cancelledBooking, '🚫 RESERVA CANCELADA PELO CLIENTE'),
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
        )
      } catch (error) {
        console.warn('[Telegram] Não foi possível editar a reserva cancelada:', String(error).slice(0, 120))
      }
    }

    // Envia também uma NOVA mensagem para gerar notificação visível no Telegram.
    if (bot && TELEGRAM_CHAT_ID) {
      try {
        await bot.api.sendMessage(
          Number(TELEGRAM_CHAT_ID),
          buildMessage(cancelledBooking, '🚫 RESERVA CANCELADA PELO CLIENTE'),
          { parse_mode: 'HTML', reply_markup: { inline_keyboard: [] } }
        )
        console.log(`[Telegram] Cancelamento do cliente recebido: ${bookingId}`)
      } catch (error) {
        console.error('[Telegram] Falha ao enviar cancelamento do cliente:', String(error).slice(0, 160))
      }
    }

    bookingMessages.delete(bookingId)

    io.to(clientId).emit('booking_cancelled', {
      bookingId,
      message: cancelMsg,
      timestamp: new Date().toISOString()
    })

    acknowledge?.({ ok: true })
    scheduleTerminalCleanup(bookingId, clientId)
  })
})

function validPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false

    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
    if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) return false
    if (!hostname.includes('.') && hostname !== '::1') return false
    if (hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd') || hostname.startsWith('fe80:')) return false

    const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
    if (ipv4) {
      const octets = ipv4.slice(1).map(Number)
      if (octets.some(value => value < 0 || value > 255)) return false
      const [a, b] = octets
      if (
        a === 10 || a === 127 || a === 0 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127)
      ) return false
    }

    return endpoint.length <= 2048
  } catch {
    return false
  }
}

function validWebPushKey(value: string, expectedBytes: number): boolean {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return false
  try {
    return Buffer.from(value, 'base64url').length === expectedBytes
  } catch {
    return false
  }
}

// ── Web Push endpoints ────────────────────────────────────────────────────────
app.get('/api/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_READY ? VAPID_PUBLIC_KEY : null })
})

app.post('/api/subscribe', express.json({ limit: '20kb' }), async (req: Request, res: Response) => {
  const raw = req.body || {}
  const clientId = sanitize(String(raw.clientId || ''), 64)
  const supplied = raw.subscription as Record<string, any> | undefined
  const endpoint = String(supplied?.endpoint || '')
  const p256dh = String(supplied?.keys?.p256dh || '')
  const auth = String(supplied?.keys?.auth || '')

  const validClientId = /^client-[A-Za-z0-9_-]{1,60}$/.test(clientId)
  const validSubscription = Boolean(
    validPushEndpoint(endpoint) &&
    validWebPushKey(p256dh, 65) &&
    validWebPushKey(auth, 16)
  )
  if (!validClientId || !validSubscription) {
    return res.status(400).json({ ok: false })
  }

  const subscription: webpush.PushSubscription = {
    endpoint,
    expirationTime: typeof supplied?.expirationTime === 'number' ? supplied.expirationTime : null,
    keys: { p256dh, auth }
  }

  try {
    // Só atualiza o cache em memória depois de a persistência confirmar a escrita.
    await upsertPushSubscription(clientId, subscription)
    pushSubscriptions.set(clientId, subscription)
    console.log('[Push] Subscription saved for client:', clientId.slice(0, 12) + '…')
    return res.json({ ok: true })
  } catch (error) {
    console.error('[Push] Falha ao persistir subscrição:', String(error).slice(0, 140))
    return res.status(503).json({ ok: false, error: 'Push temporariamente indisponível.' })
  }
})

// ── Booking details page (tracking only) ─────────────────────────────────────
app.get('/reserva/:id', (req: Request, res: Response) => {
  const bookingId = sanitize(String(req.params.id || ''), 96)
  const accessToken = sanitize(String(req.query.token || ''), 128)

  if (!bookingId || !validBookingAccessToken(bookingId, accessToken)) {
    return res.status(404).send('Reserva não encontrada.')
  }

  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.sendFile(path.join(__dirname, '../public/reserva.html'))
})

// ── Ficheiros estáticos ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')))

// ── Proxy TomTom Search API ───────────────────────────────────────────────────
app.get('/api/search', async (req: Request, res: Response) => {
  const q = sanitize(String(req.query.q || ''), 120)
  if (!q || q.length < 2) return res.json([])

  const TOMTOM_KEY = process.env.TOMTOM_API_KEY
  if (!TOMTOM_KEY || TOMTOM_KEY === 'your_tomtom_api_key_here') return res.json([])

  try {
    const url =
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json` +
      `?key=${TOMTOM_KEY}&language=pt-PT&countrySet=PT&limit=8&typeahead=true` +
      `&lat=38.7169&lon=-9.1399&radius=60000`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    let r: Response
    try {
      r = await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(timeout)
    }
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
    console.error('TomTom search error:', String(err).slice(0, 140))
    return res.json([])
  }
})


// ── POST /api/reserva ─────────────────────────────────────────────────────────
app.post('/api/reserva', express.json({ limit: '10kb' }), async (req: Request, res: Response) => {
  const raw = req.body || {}
  const supportedLangs = new Set(['pt','en','fr','es','de','it','zh','ja','ru','nl','pl'])
  const requestedLang = sanitize(raw.lang || 'pt', 8).toLowerCase()
  const lang = supportedLangs.has(requestedLang) ? requestedLang : 'pt'
  
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
  const operationalMsgs: Record<string, { active: string; unavailable: string; delivery: string }> = {
    pt: { active: 'Já tem uma reserva ativa.', unavailable: 'Serviço temporariamente indisponível. Tente novamente.', delivery: 'Não foi possível confirmar a reserva neste momento. Tente novamente.' },
    en: { active: 'You already have an active booking.', unavailable: 'Service temporarily unavailable. Please try again.', delivery: 'The booking could not be confirmed at this time. Please try again.' },
    fr: { active: 'Vous avez déjà une réservation active.', unavailable: 'Service temporairement indisponible. Veuillez réessayer.', delivery: 'La réservation ne peut pas être confirmée pour le moment. Veuillez réessayer.' },
    es: { active: 'Ya tiene una reserva activa.', unavailable: 'Servicio temporalmente no disponible. Inténtelo de nuevo.', delivery: 'No se pudo confirmar la reserva en este momento. Inténtelo de nuevo.' },
    de: { active: 'Sie haben bereits eine aktive Buchung.', unavailable: 'Dienst vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut.', delivery: 'Die Buchung konnte derzeit nicht bestätigt werden. Bitte versuchen Sie es erneut.' },
    it: { active: 'Hai già una prenotazione attiva.', unavailable: 'Servizio temporaneamente non disponibile. Riprova.', delivery: 'Al momento non è stato possibile confermare la prenotazione. Riprova.' },
    zh: { active: '您已有一个当前预订。', unavailable: '服务暂时不可用，请重试。', delivery: '目前无法确认预订，请重试。' },
    ja: { active: 'すでに有効な予約があります。', unavailable: 'サービスは一時的に利用できません。もう一度お試しください。', delivery: '現在予約を確認できません。もう一度お試しください。' },
    ru: { active: 'У вас уже есть активное бронирование.', unavailable: 'Сервис временно недоступен. Попробуйте снова.', delivery: 'Сейчас не удалось подтвердить бронирование. Попробуйте снова.' },
    nl: { active: 'U heeft al een actieve reservering.', unavailable: 'Dienst tijdelijk niet beschikbaar. Probeer opnieuw.', delivery: 'De reservering kon op dit moment niet worden bevestigd. Probeer opnieuw.' },
    pl: { active: 'Masz już aktywną rezerwację.', unavailable: 'Usługa jest chwilowo niedostępna. Spróbuj ponownie.', delivery: 'Nie udało się teraz potwierdzić rezerwacji. Spróbuj ponownie.' }
  }
  const om = operationalMsgs[lang] || operationalMsgs.pt
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
  if (!/^client-[A-Za-z0-9_-]{1,60}$/.test(clientId))
    return res.status(400).json({ success: false, error: vm.missing })

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
  const nowLisbonTime = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
  if (data === todayLisbon && hora < nowLisbonTime) return res.status(400).json({ success: false, error: vm.missing })

  const existingBookingId = clientBookings.get(clientId)
  if (existingBookingId) {
    const existing = activeBookings.get(existingBookingId)
    if (existing && ['pending', 'accepted', 'onway', 'arrived'].includes(String(existing.status))) {
      return res.status(409).json({ success: false, error: om.active, bookingId: existingBookingId })
    }
  }

  const bookingId = `691-${crypto.randomBytes(12).toString('hex')}`
  const bookingData: Record<string, any> = {
    bookingId, nome, telefone, data, hora, recolha, destino, clientId, lang,
    status: 'pending', _ts: String(Date.now()),
  }

  activeBookings.set(bookingId, bookingData)
  clientBookings.set(clientId, bookingId)
  try {
    await persistBooking(bookingData)
  } catch (error) {
    activeBookings.delete(bookingId)
    if (clientBookings.get(clientId) === bookingId) clientBookings.delete(clientId)
    console.error(`Falha ao persistir nova reserva ${bookingId}:`, String(error).slice(0, 140))
    return res.status(503).json({ success: false, error: om.unavailable })
  }
  console.log('Nova reserva:', bookingId)

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


  // Telegram é o canal operacional da reserva. Em produção, não confirmamos
  // ao cliente uma reserva que não chegou ao painel do motorista.
  if (bot && TELEGRAM_CHAT_ID) {
    let sentMessageId = 0
    try {
      const sent = await bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        buildMessage(bookingData),
        { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, recolha, destino, bookingData.telefone, 'pending') }
      )
      sentMessageId = sent.message_id
    } catch (error: unknown) {
      console.error(`Falha ao entregar reserva ${bookingId} no Telegram:`, String(error).slice(0, 140))
      activeBookings.delete(bookingId)
      if (clientBookings.get(clientId) === bookingId) clientBookings.delete(clientId)
      await deletePersistedBooking(bookingId).catch(() => {})
      return res.status(503).json({ success: false, error: om.delivery })
    }

    bookingMessages.set(bookingId, sentMessageId)
    bookingData._telegramMessageId = sentMessageId
    try {
      await persistBooking(bookingData)
    } catch (error) {
      // A mensagem já foi entregue; manter a reserva ativa e não criar duplicados.
      console.warn(`Reserva ${bookingId}: mensagem Telegram entregue, mas message_id não foi persistido:`, String(error).slice(0, 120))
    }
  } else if (IS_PRODUCTION) {
    activeBookings.delete(bookingId)
    if (clientBookings.get(clientId) === bookingId) clientBookings.delete(clientId)
    await deletePersistedBooking(bookingId).catch(() => {})
    return res.status(503).json({ success: false, error: om.unavailable })
  } else {
    console.log('Telegram não configurado — reserva registada apenas no ambiente de desenvolvimento')
  }

  return res.json({ success: true, bookingId, accessToken: bookingAccessToken(bookingId) })
})

// Última barreira para erros síncronos encaminhados pelo Express.
app.use((error: unknown, _req: Request, res: Response, _next: unknown) => {
  console.error('Erro HTTP não tratado:', String(error).slice(0, 160))
  if (!res.headersSent) res.status(500).json({ ok: false, error: 'Erro interno.' })
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
