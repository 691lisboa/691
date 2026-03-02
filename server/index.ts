import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { Bot } from 'grammy'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

const PORT          = process.env.PORT || 5000
const TELEGRAM_TOKEN  = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

// ── Estado em memória ────────────────────────────────────────────────────────
let bot: Bot | null = null
const connectedClients = new Set<string>()
const activeBookings   = new Map<string, Record<string, string>>()  // bookingId → dados
const clientBookings   = new Map<string, string>()                  // clientId  → bookingId
const bookingMessages  = new Map<string, number>()                  // bookingId → telegram messageId

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
  return {
    inline_keyboard: [
      [
        { text: '✅ Aceitar',   callback_data: `accept_${bookingId}`  },
        { text: '❌ Recusar',   callback_data: `reject_${bookingId}`  }
      ],
      [
        { text: '📍 Cheguei',  callback_data: `arrived_${bookingId}` },
        { text: '🚀 Waze',     url: wazeUrl                           }
      ],
      [
        { text: '🏁 Concluir', callback_data: `complete_${bookingId}` }
      ]
    ]
  }
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
        const parts = text.split(' ')
        if (parts.length >= 3) {
          const bookingId = parts[1]
          const message   = parts.slice(2).join(' ')
          const clientId  = clientIdForBooking(bookingId)
          if (clientId) {
            io.to(clientId).emit('message_from_driver', {
              bookingId, message,
              driverName: 'Motorista 691',
              timestamp: new Date().toISOString()
            })
            await ctx.reply(`✅ Mensagem enviada ao cliente <code>${bookingId}</code>.`, { parse_mode: 'HTML' })
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
        if (clientId) {
          io.to(clientId).emit('booking_accepted', {
            bookingId,
            message: '✅ Reserva aceite! Motorista a caminho.',
            timestamp: new Date().toISOString()
          })
        } else {
          console.warn(`accept_: clientId não encontrado para ${bookingId}`)
        }
        await editMsg(bookingId, '🚀 VIAGEM EM CURSO')

      // ── ❌ Recusar ─────────────────────────────────────────────────────────
      } else if (data.startsWith('reject_')) {
        const bookingId = data.slice(7)
        const clientId  = clientIdForBooking(bookingId)
        await editMsg(bookingId, '❌ RECUSADA')
        if (clientId) {
          io.to(clientId).emit('booking_rejected', {
            bookingId,
            message: '❌ Reserva recusada. Por favor tente novamente.',
            timestamp: new Date().toISOString()
          })
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }
        bookingMessages.delete(bookingId)

      // ── 📍 Cheguei ─────────────────────────────────────────────────────────
      } else if (data.startsWith('arrived_')) {
        const bookingId = data.slice(8)
        const clientId  = clientIdForBooking(bookingId)
        if (clientId) {
          io.to(clientId).emit('driver_arrived', {
            bookingId,
            message: '📍 O motorista chegou! Por favor, aguarde.',
            timestamp: new Date().toISOString()
          })
        } else {
          console.warn(`arrived_: clientId não encontrado para ${bookingId}`)
        }
        await editMsg(bookingId, '📍 MOTORISTA NO LOCAL')

      // ── 🏁 Concluir ────────────────────────────────────────────────────────
      } else if (data.startsWith('complete_')) {
        const bookingId = data.slice(9)
        const clientId  = clientIdForBooking(bookingId)
        await editMsg(bookingId, '🏁 VIAGEM CONCLUÍDA')
        if (clientId) {
          io.to(clientId).emit('booking_completed', {
            bookingId,
            message: '✅ Viagem concluída! Obrigado pela preferência. 🙏',
            timestamp: new Date().toISOString()
          })
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }
        bookingMessages.delete(bookingId)
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
    socket.join(data.clientId)
    console.log(`Cliente registado: ${data.clientId}`)
  })

  socket.on('restore_session', (data: { clientId: string }) => {
    const bookingId = clientBookings.get(data.clientId)
    if (bookingId) {
      const booking = activeBookings.get(bookingId)
      if (booking) {
        socket.join(data.clientId)
        socket.emit('session_restored', { booking })
        console.log(`Sessão restaurada: ${data.clientId} → ${bookingId}`)
        return
      }
    }
    socket.emit('session_not_found')
  })

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id)
    // Reserva mantida em memória — o cliente pode estar a fazer refresh
  })

  // Mensagem de chat do cliente para o motorista
  socket.on('message_to_driver', (data) => {
    if (bot && TELEGRAM_CHAT_ID) {
      bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        `<b>💬 Mensagem do cliente</b>\n` +
        `<b>ID:</b> <code>${esc(data.bookingId)}</code>\n` +
        `<b>👤</b> ${esc(data.name)} — <a href="tel:${esc(data.phone)}">${esc(data.phone)}</a>\n\n` +
        `${esc(data.message)}\n\n` +
        `<i>Responder: /r ${esc(data.bookingId)} &lt;mensagem&gt;</i>`,
        { parse_mode: 'HTML' }
      ).catch(console.error)
    }
  })

  // Cliente cancela reserva
  socket.on('cancel_booking', async (data) => {
    const booking = activeBookings.get(data.bookingId)
    const hasMsgId = bookingMessages.has(data.bookingId)

    // Notificar Telegram ANTES de apagar da memória
    if (booking && hasMsgId) {
      await editMsg(data.bookingId, '🚫 CANCELADA PELO CLIENTE').catch(() => {})
    } else if (bot && TELEGRAM_CHAT_ID) {
      // Fallback: sem messageId guardado → envia nova mensagem
      await bot.api.sendMessage(
        Number(TELEGRAM_CHAT_ID),
        `<b>🚫 RESERVA CANCELADA PELO CLIENTE</b>\n` +
        `<b>ID:</b> <code>${esc(data.bookingId)}</code>\n` +
        `<b>👤</b> ${esc(data.name || '—')} — <a href="tel:${esc(data.phone || '')}">${esc(data.phone || '—')}</a>`,
        { parse_mode: 'HTML' }
      ).catch(console.error)
    }

    // Cleanup após notificação enviada
    activeBookings.delete(data.bookingId)
    clientBookings.delete(data.clientId)
    bookingMessages.delete(data.bookingId)

    socket.emit('booking_cancelled', {
      bookingId: data.bookingId,
      message: `❌ Reserva ${data.bookingId} cancelada.`,
      timestamp: new Date().toISOString()
    })
  })
})

// ── Ficheiros estáticos ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')))

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
app.post('/api/reserva', express.json(), async (req: Request, res: Response) => {
  const { nome, telefone, data, hora, recolha, destino, clientId } = req.body
  const bookingId  = '691-' + Date.now().toString().slice(-6)
  const bookingData: Record<string, string> = {
    bookingId, nome, telefone, data, hora, recolha, destino, clientId,
    _ts: String(Date.now())
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
