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
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// Variáveis de ambiente
const PORT = process.env.PORT || 5000
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || ''

// Estado em memória
let bot: Bot | null = null
const connectedClients = new Set<string>()
const activeBookings = new Map<string, Record<string, string>>()
const clientBookings = new Map<string, string>() // clientId → bookingId

// Limpar reservas abandonadas com mais de 4 horas
setInterval(() => {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000
  for (const [bookingId, booking] of activeBookings) {
    if (Number(booking._ts || 0) < cutoff) {
      for (const [cid, bid] of clientBookings) {
        if (bid === bookingId) clientBookings.delete(cid)
      }
      activeBookings.delete(bookingId)
      console.log(`Reserva expirada removida: ${bookingId}`)
    }
  }
}, 30 * 60 * 1000)

// Helper para encontrar clientId de uma reserva
function clientIdForBooking(bookingId: string): string | undefined {
  return Array.from(clientBookings.entries()).find(([, bid]) => bid === bookingId)?.[0]
}

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
  try {
    bot = new Bot(TELEGRAM_TOKEN)

    // Mensagens de texto
    bot.on('message', async (ctx) => {
      const chatId = ctx.chat.id
      const text = ctx.message.text

      console.log(`Mensagem recebida: ${text}`)

      if (text === '/start') {
        await ctx.reply(
          '🚕 *691 Lisboa - Motorista*\n\n' +
          'Comandos:\n' +
          '/start - Este menu\n' +
          '/status - Ver status\n\n' +
          'Aguarde novas reservas para aceitar/recusar.',
          { parse_mode: 'Markdown' }
        )
      } else if (text === '/status') {
        await ctx.reply(
          `📊 *Status*\n\n` +
          `👥 Clientes: ${connectedClients.size}\n` +
          `🚕 Reservas: ${activeBookings.size}\n` +
          `🤖 Bot: ✅ Ativo`,
          { parse_mode: 'Markdown' }
        )
      } else if (text?.startsWith('/r ')) {
        // Resposta rápida: /r BOOKING_ID mensagem
        const parts = text.split(' ')
        if (parts.length >= 3) {
          const bookingId = parts[1]
          const message = parts.slice(2).join(' ')
          const clientId = clientIdForBooking(bookingId)
          if (clientId) {
            io.to(clientId).emit('message_from_driver', {
              bookingId,
              message,
              driverName: 'Motorista 691',
              timestamp: new Date().toISOString()
            })
          }
          await ctx.reply(`✅ Mensagem enviada para ${bookingId}`)
        }
      } else if (text?.startsWith('/complete ')) {
        // Completar viagem: /complete BOOKING_ID
        const bookingId = text.replace('/complete ', '').trim()
        const clientId = clientIdForBooking(bookingId)
        if (clientId) {
          io.to(clientId).emit('booking_completed', {
            bookingId,
            message: '✅ Viagem concluída! Obrigado pela preferência.',
            timestamp: new Date().toISOString()
          })
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }
        await ctx.reply(`✅ ${bookingId} - VIAGEM CONCLUÍDA`)
      }
    })

    // Callback queries (botões inline) - handler único consolidado
    bot.on('callback_query', async (ctx) => {
      const chatId = ctx.callbackQuery.message?.chat.id
      const data = ctx.callbackQuery.data

      if (data?.startsWith('accept_')) {
        const bookingId = data.replace('accept_', '')
        const clientId = clientIdForBooking(bookingId)
        if (clientId) {
          io.to(clientId).emit('booking_accepted', {
            bookingId,
            message: '✅ Reserva aceite!',
            timestamp: new Date().toISOString()
          })
        }
        await ctx.answerCallbackQuery()
        if (chatId) await bot!.api.sendMessage(chatId, `✅ ${bookingId} - ACEITA`)

      } else if (data?.startsWith('reject_')) {
        const bookingId = data.replace('reject_', '')
        const clientId = clientIdForBooking(bookingId)
        if (clientId) {
          io.to(clientId).emit('booking_rejected', {
            bookingId,
            message: '❌ Reserva recusada. Tente novamente.',
            timestamp: new Date().toISOString()
          })
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }
        await ctx.answerCallbackQuery()
        if (chatId) await bot!.api.sendMessage(chatId, `❌ ${bookingId} - RECUSADA`)

      } else if (data?.startsWith('reply_')) {
        const parts = data.split('_')
        const bookingId = parts[1]
        const replyType = parts[2]
        const messages: Record<string, string> = {
          '5min':    'Estou a 5 minutos de distância',
          '10min':   'Estou a 10 minutos de distância',
          'cheguei': 'Acabei de chegar! Por favor, saia.'
        }
        const message = messages[replyType]
        if (message) {
          const clientId = clientIdForBooking(bookingId)
          if (clientId) {
            io.to(clientId).emit('message_from_driver', {
              bookingId,
              message,
              driverName: 'Motorista 691',
              timestamp: new Date().toISOString()
            })
          }
          await ctx.answerCallbackQuery()
          if (chatId) await bot!.api.sendMessage(chatId, `✅ Enviado para ${bookingId}: "${message}"`)
        }

      } else if (data?.startsWith('complete_')) {
        const bookingId = data.replace('complete_', '')
        const clientId = clientIdForBooking(bookingId)
        if (clientId) {
          io.to(clientId).emit('booking_completed', {
            bookingId,
            message: '✅ Viagem concluída! Obrigado pela preferência.',
            timestamp: new Date().toISOString()
          })
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }
        await ctx.answerCallbackQuery()
        if (chatId) await bot!.api.sendMessage(chatId, `✅ ${bookingId} - VIAGEM CONCLUÍDA`)
      }
    })

    bot.catch((err) => {
      const msg = String(err)
      if (msg.includes('409')) {
        console.log('Bot já está rodando em outra instância - ignorando conflito')
      } else {
        console.error('Erro no bot Telegram:', err)
      }
    })

    // Iniciar polling em background (não bloqueia o servidor)
    bot.start().catch((err) => {
      console.error('Erro ao iniciar polling:', err)
    })

    console.log('Bot Telegram inicializado com sucesso (grammy)')
  } catch (error: unknown) {
    console.error('Erro ao inicializar bot Telegram:', error)
  }
} else {
  console.log('TELEGRAM_BOT_TOKEN não configurado - bot não estará ativo')
}

// Socket.io
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)
  connectedClients.add(socket.id)

  socket.on('register_client', (data: { clientId: string }) => {
    console.log(`Cliente ${socket.id} registrado: ${data.clientId}`)
    socket.join(data.clientId)
  })

  // Restaurar sessão após refresh — reenvia dados da reserva ativa se existir
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
    console.log(`Cliente desconectado: ${socket.id}`)
    connectedClients.delete(socket.id)
    // Não apagar reserva: cliente pode estar a fazer refresh
    // As reservas são limpas pelo intervalo de expiração (4h)
  })

  // Cliente envia mensagem para o motorista
  socket.on('message_to_driver', (data) => {
    console.log('Mensagem para motorista:', data)
    if (bot && TELEGRAM_CHAT_ID) {
      bot.api.sendMessage(
        TELEGRAM_CHAT_ID,
        `💬 *${data.bookingId}*\n\n` +
        `👤 ${data.name}\n` +
        `📞 ${data.phone}\n` +
        `💭 ${data.message}\n\n` +
        `_Responda: /r ${data.bookingId} <mensagem>_`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📍 5 min',  callback_data: `reply_${data.bookingId}_5min` },
              { text: '📍 10 min', callback_data: `reply_${data.bookingId}_10min` }
            ], [
              { text: '📍 Cheguei', callback_data: `reply_${data.bookingId}_cheguei` },
              { text: '✅ Concluir', callback_data: `complete_${data.bookingId}` }
            ], [
              { text: '❌ Cancelar', callback_data: `reject_${data.bookingId}` }
            ]]
          }
        }
      ).catch(console.error)
    }
  })

  // Cliente cancela reserva
  socket.on('cancel_booking', (data) => {
    console.log('Reserva cancelada:', data)
    activeBookings.delete(data.bookingId)
    clientBookings.delete(data.clientId)
    if (bot && TELEGRAM_CHAT_ID) {
      bot.api.sendMessage(
        TELEGRAM_CHAT_ID,
        `❌ *${data.bookingId} - CANCELADA*\n\n` +
        `👤 ${data.name}\n` +
        `📞 ${data.phone}`,
        { parse_mode: 'Markdown' }
      ).catch(console.error)
    }
    socket.emit('booking_cancelled', {
      bookingId: data.bookingId,
      message: `❌ Reserva ${data.bookingId} cancelada`,
      timestamp: new Date().toISOString()
    })
  })
})

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')))

// Proxy TomTom Search API (mantém a chave no servidor)
app.get('/api/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim()
  if (!q || q.length < 2) return res.json([])

  const TOMTOM_KEY = process.env.TOMTOM_API_KEY
  if (!TOMTOM_KEY || TOMTOM_KEY === 'your_tomtom_api_key_here') {
    return res.json([]) // sem chave → cliente usa fallback local
  }

  try {
    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json` +
      `?key=${TOMTOM_KEY}&language=pt-PT&countrySet=PT&limit=8&typeahead=true` +
      `&lat=38.7169&lon=-9.1399&radius=60000`
    const r = await fetch(url)
    if (!r.ok) return res.json([])
    const data = await r.json() as { results?: Array<Record<string, unknown>> }
    const results = (data.results || []).map((item: Record<string, unknown>) => {
      const a = (item.address || {}) as Record<string, string>
      const poi = (item.poi as Record<string, string> | undefined)?.name
      const street = a.streetName || ''
      const num    = a.streetNumber ? ` ${a.streetNumber}` : ''
      const city   = a.municipality || a.municipalitySubdivision || ''
      if (poi) return `${poi}${street ? ' – ' + street + num : ''}${city ? ', ' + city : ''}`
      if (street) return `${street}${num}${city ? ', ' + city : ''}`
      return a.freeformAddress || ''
    }).filter(Boolean)
    return res.json([...new Set(results)])
  } catch (err) {
    console.error('TomTom search error:', err)
    return res.json([])
  }
})

// Rota API para receber reservas
app.post('/api/reserva', express.json(), (req: Request, res: Response) => {
  const { nome, telefone, data, hora, recolha, destino, clientId } = req.body
  const bookingId = '691-' + Date.now().toString().slice(-6)
  const bookingData = { bookingId, nome, telefone, data, hora, recolha, destino, clientId, _ts: String(Date.now()) }

  console.log('Nova reserva:', bookingData)
  activeBookings.set(bookingId, bookingData)
  clientBookings.set(clientId, bookingId)

  io.to(clientId).emit('new_booking', {
    ...bookingData,
    message: `🚕 Nova reserva de ${nome}!`,
    timestamp: new Date().toISOString()
  })

  if (bot && TELEGRAM_CHAT_ID) {
    bot.api.sendMessage(
      TELEGRAM_CHAT_ID,
      `🚕 *NOVA RESERVA - ${bookingId}*\n\n` +
      `👤 ${nome}\n` +
      `📞 ${telefone}\n` +
      `📅 ${data} às ${hora}\n` +
      `📍 ${recolha}\n` +
      `🎯 ${destino}`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ ACEITAR', callback_data: `accept_${bookingId}` },
            { text: '❌ RECUSAR', callback_data: `reject_${bookingId}` }
          ]]
        }
      }
    ).catch((error: unknown) => {
      console.error('Erro ao enviar para Telegram:', error)
    })
  } else {
    console.log('Telegram não configurado - reserva apenas no sistema')
  }

  res.json({
    success: true,
    message: 'Reserva recebida com sucesso!',
    bookingId,
    clientsConnected: connectedClients.size
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Site: http://localhost:${PORT}`)
  console.log(`Bot Telegram: ${bot ? 'Ativo (grammy)' : 'Inativo'}`)
})
