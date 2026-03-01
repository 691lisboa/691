import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import TelegramBot from 'node-telegram-bot-api'
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

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
  try {
    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true })
    
    bot.on('polling_error', (error) => {
      if (error.message.includes('ETELEGRAM: 409')) {
        console.log('Bot já está rodando em outra instância - ignorando conflito')
      }
    })

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id
      const text = msg.text

      console.log(`Mensagem recebida: ${text}`)

      if (text === '/start') {
        await bot.sendMessage(chatId, 
          '🚕 *691 Taxi Bot*\n\n' +
          'Comandos disponíveis:\n' +
          '/start - Mostrar este menu\n' +
          '/motorista - Simular motorista chegou\n' +
          '/status - Ver status das conexões\n\n' +
          'Aguarde novas reservas para aceitar/recusar.',
          {
            parse_mode: 'Markdown'
          }
        )
      } else if (text === '/motorista') {
        // Notificar todos os clientes conectados
        io.emit('driver_arrived', {
          message: '📍 O motorista chegou! Por favor, aguarde.',
          timestamp: new Date().toISOString()
        })

        await bot.sendMessage(chatId, '✅ Notificação de motorista enviada para o site!')
      } else if (text === '/status') {
        await bot.sendMessage(chatId, 
          `📊 *Status do Sistema*\n\n` +
          `👥 Clientes conectados: ${connectedClients.size}\n` +
          `🚕 Reservas ativas: ${activeBookings.size}\n` +
          `🤖 Bot: Online\n` +
          `🌐 Servidor: Rodando\n` +
          `📡 Socket.io: Funcionando`,
          { parse_mode: 'Markdown' }
        )
      }
    })

    console.log('Bot Telegram inicializado com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar bot Telegram:', error)
  }
} else {
  console.log('TELEGRAM_BOT_TOKEN não configurado - bot não estará ativo')
}

// Socket.io
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)
  connectedClients.add(socket.id)

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`)
    connectedClients.delete(socket.id)
  })

  // Cliente envia mensagem para o motorista
  socket.on('message_to_driver', (data) => {
    console.log('Mensagem para motorista:', data)
    
    // Enviar para Telegram se configurado
    if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID || 'default',
        `💬 *Mensagem do Cliente*\n\n` +
        `👤 Nome: ${data.name}\n` +
        `📞 Telefone: ${data.phone}\n` +
        `🚕 Reserva: ${data.bookingId}\n` +
        `💭 Mensagem: ${data.message}`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '💬 Responder', callback_data: `reply_${data.bookingId}` }
            ]]
          }
        }
      ).catch(console.error)
    }
  })

  // Cliente cancela reserva
  socket.on('cancel_booking', (data) => {
    console.log('Reserva cancelada:', data)
    
    // Remover das reservas ativas
    activeBookings.delete(data.bookingId)
    
    // Notificar Telegram
    if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID || 'default',
        `❌ *Reserva Cancelada*\n\n` +
        `� Nome: ${data.name}\n` +
        `📞 Telefone: ${data.phone}\n` +
        `🚕 ID: ${data.bookingId}`,
        { parse_mode: 'Markdown' }
      ).catch(console.error)
    }
    
    // Broadcast para todos os clientes
    io.emit('booking_cancelled', {
      bookingId: data.bookingId,
      message: `❌ Reserva ${data.bookingId} cancelada`,
      timestamp: new Date().toISOString()
    })
  })
})

// Callbacks do Telegram
if (bot) {
  bot.on('callback_query', async (callbackQuery) => {
    const msg = callbackQuery.message!
    const chatId = msg.chat.id
    const data = callbackQuery.data

    if (data.startsWith('accept_')) {
      const bookingId = data.replace('accept_', '')
      
      // Notificar cliente que reserva foi aceita
      io.emit('booking_accepted', {
        bookingId: bookingId,
        message: '✅ Reserva aceita! Motorista a caminho.',
        timestamp: new Date().toISOString()
      })

      await bot.answerCallbackQuery(callbackQuery.id)
      await bot.sendMessage(chatId, `✅ Reserva ${bookingId} aceita!`)
      
    } else if (data.startsWith('reject_')) {
      const bookingId = data.replace('reject_', '')
      
      // Notificar cliente que reserva foi recusada
      io.emit('booking_rejected', {
        bookingId: bookingId,
        message: '❌ Reserva recusada. Tente novamente.',
        timestamp: new Date().toISOString()
      })

      // Remover das reservas ativas
      activeBookings.delete(bookingId)

      await bot.answerCallbackQuery(callbackQuery.id)
      await bot.sendMessage(chatId, `❌ Reserva ${bookingId} recusada!`)
      
    } else if (data.startsWith('reply_')) {
      const bookingId = data.replace('reply_', '')
      
      await bot.answerCallbackQuery(callbackQuery.id)
      await bot.sendMessage(chatId, 
        `💬 Para responder ao cliente da reserva ${bookingId},\n` +
        `use o formato:\n` +
        `/reply_${bookingId} Sua mensagem aqui`
      )
      
    } else if (data === 'driver_arrived') {
      // Notificar todos os clientes conectados
      io.emit('driver_arrived', {
        message: '� O motorista chegou! Por favor, aguarde.',
        timestamp: new Date().toISOString()
      })

      await bot.answerCallbackQuery(callbackQuery.id)
      await bot.sendMessage(chatId, '✅ Notificação de motorista enviada para o site!')
    }
  })

  // Motorista envia mensagem para cliente
  bot.on('message', async (msg) => {
    const text = msg.text
    const chatId = msg.chat.id

    if (text.startsWith('/reply_')) {
      const parts = text.split(' ')
      const bookingId = parts[0].replace('/reply_', '')
      const message = parts.slice(1).join(' ')

      if (message) {
        // Enviar para cliente específico
        io.emit('message_from_driver', {
          bookingId: bookingId,
          message: message,
          driverName: 'Motorista 691',
          timestamp: new Date().toISOString()
        })

        await bot.sendMessage(chatId, `✅ Mensagem enviada para o cliente da reserva ${bookingId}`)
      }
    }
  })
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')))

// Rota API para receber reservas
app.post('/api/reserva', express.json(), (req, res) => {
  const { nome, telefone, recolha, destino } = req.body
  
  // Gerar ID único para reserva
  const bookingId = '691-' + Date.now().toString().slice(-6)
  const bookingData = { bookingId, nome, telefone, recolha, destino }
  
  console.log('Nova reserva:', bookingData)
  
  // Adicionar às reservas ativas
  activeBookings.set(bookingId, bookingData)
  
  // Notificar todos os clientes conectados sobre nova reserva
  io.emit('new_booking', {
    ...bookingData,
    message: `🚕 Nova reserva de ${nome}!`,
    timestamp: new Date().toISOString()
  })
  
  // Enviar para Telegram se configurado
  if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
    bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID || 'default',
      `🚕 *Nova Reserva 691*\n\n` +
      `🆔 ID: ${bookingId}\n` +
      `👤 Nome: ${nome}\n` +
      `📞 Telefone: ${telefone}\n` +
      `📍 Recolha: ${recolha}\n` +
      `🎯 Destino: ${destino}\n\n` +
      `*Ações:*`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Aceitar', callback_data: `accept_${bookingId}` },
            { text: '❌ Recusar', callback_data: `reject_${bookingId}` }
          ]]
        }
      }
    ).catch(error => {
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
