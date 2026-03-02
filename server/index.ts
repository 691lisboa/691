import 'dotenv/config'
import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Bot } from 'grammy'
import webpush from 'web-push'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

app.get('/health', (_req: Request, res: Response) => res.send('OK'))

const PORT             = process.env.PORT || 5000
const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''
const VAPID_PUBLIC_KEY  = process.env.VAPID_PUBLIC_KEY  || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_EMAIL       = process.env.VAPID_EMAIL       || 'mailto:reservas@691.pt'
const WEBAPP_URL        = process.env.WEBAPP_URL        || ''

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  console.log('Web Push (VAPID) configurado')
} else {
  console.log('VAPID keys não configuradas — Web Push inativo')
}

// ── Estado em memória ────────────────────────────────────────────────────────
let bot: Bot | null = null
const connectedClients = new Set<string>()
const activeBookings   = new Map<string, Record<string, string>>()  // bookingId → dados
const clientBookings   = new Map<string, string>()                  // clientId  → bookingId
const bookingMessages  = new Map<string, number>()                  // bookingId → telegram messageId
const rateLimit           = new Map<string, { count: number; ts: number }>()  // IP → contador
const pushSubscriptions   = new Map<string, webpush.PushSubscription>()       // clientId → sub

// Limpar rate limit expirado a cada 15 min
setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000
  for (const [ip, entry] of Array.from(rateLimit.entries()))
    if (entry.ts < cutoff) rateLimit.delete(ip)
}, 15 * 60 * 1000)

// Limpar reservas expiradas (> 4h) a cada 30 min
setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000
  for (const [bookingId, booking] of Array.from(activeBookings.entries())) {
    if (Number(booking._ts || 0) < cutoff) {
      for (const [cid, bid] of Array.from(clientBookings.entries()))
        if (bid === bookingId) clientBookings.delete(cid)
      activeBookings.delete(bookingId)
      bookingMessages.delete(bookingId)
      console.log(`Reserva expirada removida: ${bookingId}`)
    }
  }
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
  if (!sub || !VAPID_PUBLIC_KEY) return
  try {
    await webpush.sendNotification(sub, JSON.stringify({ title, body, data }))
  } catch (e: unknown) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 410 || status === 404) {
      pushSubscriptions.delete(clientId)
      console.log(`Push subscription expirada removida: ${clientId}`)
    } else {
      console.warn('sendPush error:', String(e).slice(0, 80))
    }
  }
}

/** Tradução automática via MyMemory (gratuito, sem chave) */
async function translate(text: string, from: string, to: string): Promise<string> {
  if (from === to || !text.trim()) return text
  try {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), 4000)
    const res  = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${from}|${to}`,
      { signal: controller.signal }
    )
    clearTimeout(tid)
    const json = await res.json() as { responseStatus?: number; responseData?: { translatedText?: string } }
    if (json.responseStatus === 200 && json.responseData?.translatedText) {
      const t = json.responseData.translatedText
      if (t.toLowerCase() !== text.toLowerCase()) return t
    }
  } catch { /* timeout ou falha de rede — usa texto original */ }
  return text
}

/** Mensagens de estado localizadas */
function statusMsg(event: string, lang: string): string {
  const en: Record<string, string> = {
    accepted:  '✅ Booking accepted! Driver on the way.',
    rejected:  '❌ Booking rejected. Please try again.',
    arrived:   '📍 Driver arrived.',
    completed: '✅ Trip completed! Thank you. 🙏',
    cancelled: '❌ Booking cancelled.'
  }
  const pt: Record<string, string> = {
    accepted:  '✅ Reserva aceite! Motorista a caminho.',
    rejected:  '❌ Reserva recusada. Por favor tente novamente.',
    arrived:   '📍 O motorista chegou.',
    completed: '✅ Viagem concluída! Obrigado pela preferência. 🙏',
    cancelled: '❌ Reserva cancelada.'
  }
  return (lang === 'en' ? en[event] : pt[event]) ?? pt[event] ?? ''
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

/** Inline keyboard com 3 linhas de botões */
function buildKeyboard(bookingId: string, recolha: string) {
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(recolha)}&navigate=yes`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[][] = [
    [
      { text: '✅ Aceitar',   callback_data: `accept_${bookingId}`  },
      { text: '❌ Recusar',   callback_data: `reject_${bookingId}`  }
    ],
    [
      { text: '📍 Cheguei',  callback_data: `arrived_${bookingId}` },
      { text: '🚀 Waze',     url: wazeUrl                           }
    ]
  ]
  if (WEBAPP_URL) {
    rows.push([{ text: '🛰️ Tracking GPS', web_app: { url: `${WEBAPP_URL}/driver-track.html?bookingId=${bookingId}` } }])
  }
  rows.push([{ text: '🏁 Concluir', callback_data: `complete_${bookingId}` }])
  return { inline_keyboard: rows }
}

/** Edita a mensagem Telegram original com o novo estado — mantém os botões visíveis */
async function editMsg(bookingId: string, statusLine: string): Promise<void> {
  const msgId   = bookingMessages.get(bookingId)
  const booking = activeBookings.get(bookingId)
  if (!bot || !TELEGRAM_CHAT_ID || !msgId || !booking) return
  try {
    await bot.api.editMessageText(
      Number(TELEGRAM_CHAT_ID), msgId,
      buildMessage(booking, statusLine),
      { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, booking.recolha) }
    )
  } catch (e) {
    console.warn('editMessageText falhou (pode já ter sido editada):', String(e).slice(0, 80))
  }
}

// ── Bot Telegram ─────────────────────────────────────────────────────────────
if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
  try {
    bot = new Bot(TELEGRAM_TOKEN)

    // Comandos de texto
    bot.on('message', async (ctx) => {
      const text = ctx.message.text || ''

      if (text === '/start') {
        await ctx.reply(
          '<b>🚕 691 Lisboa — Central de Comando</b>\n\n' +
          '/start — Este menu\n' +
          '/status — Reservas ativas\n' +
          '/r [ID] [msg] — Enviar mensagem ao cliente\n\n' +
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

      } else if (text.startsWith('/r ')) {
        const parts    = text.split(' ')
        if (parts.length >= 3) {
          const bookingId  = parts[1]
          const message    = parts.slice(2).join(' ')
          const clientId   = clientIdForBooking(bookingId)
          const clientLang = activeBookings.get(bookingId)?.lang || 'pt'
          if (clientId) {
            // Traduzir PT → EN se o cliente estiver em inglês
            let outMsg = message
            let note   = ''
            if (clientLang === 'en') {
              const translated = await translate(message, 'pt', 'en')
              if (translated !== message) {
                outMsg = translated
                note   = ` <i>(🇵🇹 original: "${esc(message)}")</i>`
              }
            }
            const driverName = clientLang === 'en' ? 'Driver 691' : 'Motorista 691'
            io.to(clientId).emit('message_from_driver', {
              bookingId, message: outMsg, driverName,
              timestamp: new Date().toISOString()
            })
            sendPush(clientId, driverName, outMsg, { bookingId, type: 'message' }).catch(() => {})
            await ctx.reply(`✅ Enviado a <code>${bookingId}</code>${note}`, { parse_mode: 'HTML' })
          } else {
            await ctx.reply(`❌ Cliente não encontrado para <code>${bookingId}</code>.`, { parse_mode: 'HTML' })
          }
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
        } else {
          console.warn(`accept_: clientId não encontrado para ${bookingId}`)
        }
        await editMsg(bookingId, '🚀 VIAGEM EM CURSO')

      // ── ❌ Recusar ─────────────────────────────────────────────────────────
      } else if (data.startsWith('reject_')) {
        const bookingId = data.slice(7)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'rejected'
        await editMsg(bookingId, '❌ RECUSADA')
        if (clientId) {
          const msg = statusMsg('rejected', lang)
          io.to(clientId).emit('booking_rejected', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa', msg, { bookingId, type: 'rejected' }).catch(() => {})
        }
        bookingMessages.delete(bookingId)
        // Manter em memória 5 min para que restore_session devolva o estado final ao cliente
        setTimeout(() => { activeBookings.delete(bookingId); if (clientId) clientBookings.delete(clientId) }, 5 * 60 * 1000)

      // ── 📍 Cheguei ─────────────────────────────────────────────────────────
      } else if (data.startsWith('arrived_')) {
        const bookingId = data.slice(8)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'arrived'
        if (clientId) {
          const msg = statusMsg('arrived', lang)
          io.to(clientId).emit('driver_arrived', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa 📍', msg, { bookingId, type: 'arrived' }).catch(() => {})
        } else {
          console.warn(`arrived_: clientId não encontrado para ${bookingId}`)
        }
        await editMsg(bookingId, '📍 MOTORISTA NO LOCAL')

      // ── 🏁 Concluir ────────────────────────────────────────────────────────
      } else if (data.startsWith('complete_')) {
        const bookingId = data.slice(9)
        const clientId  = clientIdForBooking(bookingId)
        const lang      = activeBookings.get(bookingId)?.lang || 'pt'
        const bk = activeBookings.get(bookingId)
        if (bk) bk.status = 'completed'
        await editMsg(bookingId, '🏁 VIAGEM CONCLUÍDA')
        if (clientId) {
          const msg = statusMsg('completed', lang)
          io.to(clientId).emit('booking_completed', { bookingId, message: msg, timestamp: new Date().toISOString() })
          sendPush(clientId, '691 Lisboa ✅', msg, { bookingId, type: 'completed' }).catch(() => {})
        }
        bookingMessages.delete(bookingId)
        // Manter em memória 5 min para que restore_session devolva o estado final ao cliente
        setTimeout(() => { activeBookings.delete(bookingId); if (clientId) clientBookings.delete(clientId) }, 5 * 60 * 1000)
      }
    })

    bot.catch((err) => {
      if (!String(err).includes('409'))
        console.error('Erro no bot Telegram:', err)
    })

    bot.start().catch((err) => console.error('Erro ao iniciar polling:', err))
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
    console.log(`Cliente registado: ${clientId}`)
  })

  socket.on('restore_session', (data: { clientId: string }) => {
    const clientId  = sanitize(data.clientId, 64)
    const bookingId = clientBookings.get(clientId)
    if (bookingId) {
      const booking = activeBookings.get(bookingId)
      if (booking) {
        socket.join(clientId)
        socket.data.clientId = clientId
        socket.emit('session_restored', { booking, status: booking.status || 'pending' })
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

  // Mensagem de chat do cliente para o motorista
  socket.on('message_to_driver', async (data) => {
    const clientId  = sanitize(data.clientId, 64)
    const bookingId = sanitize(data.bookingId, 20)
    const message   = sanitize(data.message, 500)
    const lang      = (data.lang === 'en') ? 'en' : 'pt'

    // Verificar que o socket é o dono desta reserva
    if (clientId !== socket.data.clientId) return
    const owned = clientBookings.get(clientId)
    if (!owned || owned !== bookingId) return
    if (!message) return

    // Guardar língua do cliente na reserva (para respostas futuras)
    const booking = activeBookings.get(bookingId)
    if (booking) booking.lang = lang

    if (bot && TELEGRAM_CHAT_ID) {
      // Traduzir EN → PT para o motorista se cliente estiver em inglês
      let telegramMsg = message
      let translationNote = ''
      if (lang === 'en') {
        const translated = await translate(message, 'en', 'pt')
        if (translated !== message) {
          telegramMsg = translated
          translationNote = `\n<i>🇬🇧 Original: "${esc(message)}"</i>`
        }
      }
      const langFlag = lang === 'en' ? ' 🇬🇧→🇵🇹' : ''
      bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        `<b>💬 Mensagem do cliente${langFlag}</b>\n` +
        `<b>ID:</b> <code>${esc(bookingId)}</code>\n` +
        `<b>👤</b> ${esc(data.name)} — <a href="tel:${esc(data.phone)}">${esc(data.phone)}</a>\n\n` +
        `${esc(telegramMsg)}${translationNote}\n\n` +
        `<i>Responder: /r ${esc(bookingId)} &lt;mensagem&gt;</i>`,
        { parse_mode: 'HTML' }
      ).catch(console.error)
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
      await editMsg(bookingId, '🚫 CANCELADA PELO CLIENTE').catch(() => {})
    }
    // Enviar SEMPRE uma nova mensagem — edições não geram notificação no Telegram
    if (bot && TELEGRAM_CHAT_ID) {
      await bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        `<b>🚫 RESERVA CANCELADA PELO CLIENTE</b>\n` +
        `<b>ID:</b> <code>${esc(bookingId)}</code>\n` +
        `<b>👤</b> ${esc(booking?.nome || data.name || '—')} — ` +
        `<a href="tel:${esc(booking?.telefone || data.phone || '')}">${esc(booking?.telefone || data.phone || '—')}</a>\n` +
        `<b>📍</b> ${esc(booking?.recolha || '—')}\n` +
        `<b>🎯</b> ${esc(booking?.destino || '—')}`,
        { parse_mode: 'HTML' }
      ).catch(console.error)
    }

    // Ler lang antes de apagar da memória
    const cancelledLang = activeBookings.get(bookingId)?.lang || 'pt'
    const cancelMsg     = statusMsg('cancelled', cancelledLang)

    // Cleanup após notificação enviada
    activeBookings.delete(bookingId)
    clientBookings.delete(clientId)
    bookingMessages.delete(bookingId)

    socket.emit('booking_cancelled', { bookingId, message: cancelMsg, timestamp: new Date().toISOString() })
  })
})

// ── Web Push endpoints ────────────────────────────────────────────────────────
app.get('/api/vapid-public-key', (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY || null })
})

app.post('/api/subscribe', express.json({ limit: '4kb' }), (req: Request, res: Response) => {
  const { clientId, subscription } = req.body || {}
  if (!clientId || !subscription?.endpoint) {
    return res.status(400).json({ success: false, error: 'Subscription inválida' })
  }
  pushSubscriptions.set(sanitize(clientId, 64), subscription as webpush.PushSubscription)
  console.log(`Push subscription registada: ${clientId}`)
  return res.json({ success: true })
})

// ── Ficheiros estáticos ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')))

// ── Geocode (endereço → coordenadas) ─────────────────────────────────────────
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
  if (!TOMTOM_KEY || TOMTOM_KEY === 'your_tomtom_api_key_here') return res.json(null)
  try {
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/${encodeURIComponent(from)}:${encodeURIComponent(to)}/json` +
      `?key=${TOMTOM_KEY}&traffic=true&travelMode=car`
    const r = await fetch(url)
    if (!r.ok) return res.json(null)
    const body = await r.json() as {
      routes?: Array<{ summary: { lengthInMeters: number; travelTimeInSeconds: number; trafficDelayInSeconds: number } }>
    }
    const s = body.routes?.[0]?.summary
    if (!s) return res.json(null)
    return res.json({
      distanceKm:      (s.lengthInMeters / 1000).toFixed(1),
      etaMin:          Math.max(1, Math.ceil(s.travelTimeInSeconds / 60)),
      trafficDelaySec: s.trafficDelayInSeconds ?? 0
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

// ── Health check ────────────────────────────────────────────────────────────
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
  const lang     = (raw.lang === 'en') ? 'en' : 'pt'

  if (nome.length < 2)
    return res.status(400).json({ success: false, error: 'Nome inválido' })
  if (!/^[+\d\s()\-]{7,30}$/.test(telefone))
    return res.status(400).json({ success: false, error: 'Telefone inválido' })
  if (recolha.length < 3 || destino.length < 3)
    return res.status(400).json({ success: false, error: 'Moradas inválidas' })

  const bookingId  = '691-' + Date.now().toString().slice(-6)
  const bookingData: Record<string, string> = {
    bookingId, nome, telefone, data, hora, recolha, destino, clientId, lang,
    status: 'pending', _ts: String(Date.now())
  }

  activeBookings.set(bookingId, bookingData)
  clientBookings.set(clientId, bookingId)
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
        { parse_mode: 'HTML', reply_markup: buildKeyboard(bookingId, recolha) }
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
