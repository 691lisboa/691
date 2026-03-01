import express, { Request, Response } from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api'
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

// Bot Telegram
let bot: TelegramBot | null = null
let connectedClients = new Set()
let activeBookings = new Map() // bookingId -> booking data
let clientBookings = new Map() // clientId -> bookingId

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
  try {
    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true })
    
    bot.on('polling_error', (error: Error) => {
      if (error.message.includes('ETELEGRAM: 409')) {
        console.log('Bot já está rodando em outra instância - ignorando conflito')
      }
    })

    bot.on('message', async (msg: Message) => {
      const chatId = msg.chat.id
      const text = msg.text

      console.log(`Mensagem recebida: ${text}`)

      if (text === '/start') {
        bot?.sendMessage(chatId, 
          '🚕 *691 Lisboa - Motorista*\n\n' +
          'Comandos:\n' +
          '/start - Este menu\n' +
          '/status - Ver status\n\n' +
          'Aguarde novas reservas para aceitar/recusar.',
          { parse_mode: 'Markdown' }
        )
      } else if (text === '/status') {
        bot?.sendMessage(chatId, 
          `📊 *Status*\n\n` +
          `👥 Clientes: ${connectedClients.size}\n` +
          `🚕 Reservas: ${activeBookings.size}\n` +
          `🤖 Bot: ✅ Ativo`,
          { parse_mode: 'Markdown' }
        )
      } else if (text?.startsWith('/r ')) {
        // Resposta rápida: /r ID mensagem
        const parts = text.split(' ')
        if (parts.length >= 3) {
          const bookingId = parts[1]
          const message = parts.slice(2).join(' ')
          
          // Enviar apenas para o cliente específico
          const clientId = Array.from(clientBookings.entries())
            .find(([_, bid]) => bid === bookingId)?.[0]
          
          if (clientId) {
            io.to(clientId).emit('message_from_driver', {
              bookingId: bookingId,
              message: message,
              driverName: 'Motorista 691',
              timestamp: new Date().toISOString()
            })
          }

          bot?.sendMessage(chatId, `✅ Mensagem enviada para ${bookingId}`)
        }
      } else if (text?.startsWith('/complete ')) {
        // Completar viagem: /complete ID
        const bookingId = text?.replace('/complete ', '').trim()
        
        // Enviar apenas para o cliente específico
        const clientId = Array.from(clientBookings.entries())
          .find(([_, bid]) => bid === bookingId)?.[0]
        
        if (clientId) {
          io.to(clientId).emit('booking_completed', {
            bookingId: bookingId,
            message: '✅ Viagem concluída! Obrigado pela preferência.',
            timestamp: new Date().toISOString()
          })
          
          // Limpar reservas
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }

        bot?.sendMessage(chatId, `✅ ${bookingId} - VIAGEM CONCLUÍDA`)
      }
    })

    // Callbacks simplificados
    bot.on('callback_query', async (callbackQuery: CallbackQuery) => {
      const msg = callbackQuery.message!
      const chatId = msg.chat.id
      const data = callbackQuery.data

      if (data?.startsWith('accept_')) {
        const bookingId = data.replace('accept_', '')
        
        // Enviar apenas para o cliente específico
        const clientId = Array.from(clientBookings.entries())
          .find(([_, bid]) => bid === bookingId)?.[0]
        
        if (clientId) {
          io.to(clientId).emit('booking_accepted', {
            bookingId: bookingId,
            message: '✅ Reserva aceita!',
            timestamp: new Date().toISOString()
          })
        }

        bot?.answerCallbackQuery(callbackQuery.id)
        bot?.sendMessage(chatId, `✅ ${bookingId} - ACEITA`)
        
      } else if (data?.startsWith('reject_')) {
        const bookingId = data.replace('reject_', '')
        
        // Enviar apenas para o cliente específico
        const clientId = Array.from(clientBookings.entries())
          .find(([_, bid]) => bid === bookingId)?.[0]
        
        if (clientId) {
          io.to(clientId).emit('booking_rejected', {
            bookingId: bookingId,
            message: '❌ Reserva recusada. Tente novamente.',
            timestamp: new Date().toISOString()
          })
          
          // Limpar reservas
          activeBookings.delete(bookingId)
          clientBookings.delete(clientId)
        }

        bot?.answerCallbackQuery(callbackQuery.id)
        bot?.sendMessage(chatId, `❌ ${bookingId} - RECUSADA`)
      }
    })

    console.log('Bot Telegram inicializado com sucesso')
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
  
  // Associar clientId ao socket para roteamento correto
  socket.on('register_client', (data) => {
    const { clientId } = data
    console.log(`Cliente ${socket.id} registrado com clientId: ${clientId}`)
    socket.join(clientId)
  })

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`)
    connectedClients.delete(socket.id)
    
    // Limpar reservas do cliente desconectado
    const bookingId = clientBookings.get(socket.id)
    if (bookingId) {
      activeBookings.delete(bookingId)
      clientBookings.delete(socket.id)
    }
  })

  // Cliente envia mensagem para o motorista
  socket.on('message_to_driver', (data) => {
    console.log('Mensagem para motorista:', data)
    
    if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
      const quickReply = `/r ${data.bookingId} Sua resposta aqui`
      
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID || 'default',
        `💬 *${data.bookingId}*\n\n` +
        `👤 ${data.name}\n` +
        `📞 ${data.phone}\n` +
        `💭 ${data.message}\n\n` +
        `_Responda: ${quickReply}_`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '📍 5 min', callback_data: `reply_${data.bookingId}_5min` },
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
    
    if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID || 'default',
        `❌ *${data.bookingId} - CANCELADA*\n\n` +
        `👤 ${data.name}\n` +
        `📞 ${data.phone}`,
        { parse_mode: 'Markdown' }
      ).catch(console.error)
    }
    
    // Enviar apenas para o cliente específico
    socket.emit('booking_cancelled', {
      bookingId: data.bookingId,
      message: `❌ Reserva ${data.bookingId} cancelada`,
      timestamp: new Date().toISOString()
    })
  })
})

// Respostas rápidas do motorista
if (bot) {
  bot.on('callback_query', async (callbackQuery: CallbackQuery) => {
    const msg = callbackQuery.message!
    const chatId = msg.chat.id
    const data = callbackQuery.data

    if (data?.startsWith('reply_')) {
      const parts = data.split('_')
      const bookingId = parts[1]
      const replyType = parts[2]
      
      let message = ''
      switch(replyType) {
        case '5min':
          message = 'Estou a 5 minutos de distância'
          break
        case '10min':
          message = 'Estou a 10 minutos de distância'
          break
        case 'cheguei':
          message = 'Acabei de chegar! Por favor, saia.'
          break
      }
      
      if (message) {
        // Enviar apenas para o cliente específico
        const clientId = Array.from(clientBookings.entries())
          .find(([_, bid]) => bid === bookingId)?.[0]
        
        if (clientId) {
          io.to(clientId).emit('message_from_driver', {
            bookingId: bookingId,
            message: message,
            driverName: 'Motorista 691',
            timestamp: new Date().toISOString()
          })
        }

        bot?.answerCallbackQuery(callbackQuery.id)
        bot?.sendMessage(chatId, `✅ Enviado para ${bookingId}: "${message}"`)
      }
    } else if (data?.startsWith('complete_')) {
      const bookingId = data.replace('complete_', '')
      
      // Enviar apenas para o cliente específico
      const clientId = Array.from(clientBookings.entries())
        .find(([_, bid]) => bid === bookingId)?.[0]
      
      if (clientId) {
        io.to(clientId).emit('booking_completed', {
          bookingId: bookingId,
          message: '✅ Viagem concluída! Obrigado pela preferência.',
          timestamp: new Date().toISOString()
        })
        
        // Limpar reservas
        activeBookings.delete(bookingId)
        clientBookings.delete(clientId)
      }

      bot?.answerCallbackQuery(callbackQuery.id)
      bot?.sendMessage(chatId, `✅ ${bookingId} - VIAGEM CONCLUÍDA`)
    }
  })
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')))

// Rota API para receber reservas
app.post('/api/reserva', express.json(), (req: Request, res: Response) => {
  const { nome, telefone, data, hora, recolha, destino, clientId } = req.body
  
  // Gerar ID único para reserva
  const bookingId = '691-' + Date.now().toString().slice(-6)
  const bookingData = { 
    bookingId, 
    nome, 
    telefone, 
    data, 
    hora, 
    recolha, 
    destino, 
    clientId 
  }
  
  console.log('Nova reserva:', bookingData)
  
  // Adicionar às reservas ativas
  activeBookings.set(bookingId, bookingData)
  clientBookings.set(clientId, bookingId)
  
  // Notificar apenas o cliente específico sobre nova reserva
  io.to(clientId).emit('new_booking', {
    ...bookingData,
    message: `🚕 Nova reserva de ${nome}!`,
    timestamp: new Date().toISOString()
  })
  
  // Enviar para Telegram se configurado
  if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
    bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID || 'default',
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
    ).catch((error: Error) => {
      console.error('Erro ao enviar para Telegram:', error)
    })
  } else {
    console.log('Telegram não configurado - reserva apenas no sistema')
  }
  
  res.json({ 
    success: true, 
    message: 'Reserva recebida com sucesso!',
    bookingId: bookingId,
    clientsConnected: connectedClients.size
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Site: http://localhost:${PORT}`)
  console.log(`Bot Telegram: ${bot ? 'Ativo' : 'Inativo'}`)
})
