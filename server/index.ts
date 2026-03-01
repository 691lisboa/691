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
          'Clique no botão abaixo para simular chegada:\n\n',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '🚗 Motorista Chegou', callback_data: 'driver_arrived' },
                { text: '📱 Enviar Notificação', callback_data: 'send_notification' }
              ]]
            }
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
          `🤖 Bot: Online\n` +
          `🌐 Servidor: Rodando\n` +
          `📡 Socket.io: Funcionando`,
          { parse_mode: 'Markdown' }
        )
      }
    })

    bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message!
      const chatId = msg.chat.id
      const data = callbackQuery.data

      if (data === 'driver_arrived') {
        // Notificar todos os clientes conectados
        io.emit('driver_arrived', {
          message: '📍 O motorista chegou! Por favor, aguarde.',
          timestamp: new Date().toISOString()
        })

        await bot.answerCallbackQuery(callbackQuery.id)
        await bot.sendMessage(chatId, '✅ Notificação de motorista enviada para o site!')
        
      } else if (data === 'send_notification') {
        // Enviar notificação genérica
        io.emit('custom_notification', {
          message: '🔔 Nova mensagem do 691 Taxi!',
          timestamp: new Date().toISOString()
        })

        await bot.answerCallbackQuery(callbackQuery.id)
        await bot.sendMessage(chatId, '✅ Notificação personalizada enviada!')
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

  // Notificar todos sobre nova conexão
  socket.broadcast.emit('user_connected', {
    message: `👥 Novo cliente conectado (${connectedClients.size} total)`,
    timestamp: new Date().toISOString()
  })

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`)
    connectedClients.delete(socket.id)
  })

  socket.on('chat_message', (data) => {
    console.log('Mensagem do chat:', data)
    
    // Broadcast para todos os clientes
    io.emit('chat_message', {
      ...data,
      timestamp: new Date().toISOString()
    })

    // Enviar para Telegram se configurado
    if (bot) {
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID || 'default',
        `💬 *Mensagem do Cliente*\n\n` +
        `👤 Nome: ${data.name}\n` +
        `📞 Telefone: ${data.phone}\n` +
        `💭 Mensagem: ${data.message}`,
        { parse_mode: 'Markdown' }
      ).catch(console.error)
    }
  })
})

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')))

// Rota API para receber reservas
app.post('/api/reserva', express.json(), (req, res) => {
  const { nome, telefone, recolha, destino } = req.body
  
  console.log('Nova reserva:', { nome, telefone, recolha, destino })
  
  // Notificar todos os clientes conectados sobre nova reserva
  io.emit('new_booking', {
    message: `🚕 Nova reserva de ${nome}!`,
    booking: { nome, telefone, recolha, destino },
    timestamp: new Date().toISOString()
  })
  
  // Enviar para Telegram se configurado
  if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
    bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID || 'default',
      `🚕 *Nova Reserva 691*\n\n` +
      `👤 Nome: ${nome}\n` +
      `📞 Telefone: ${telefone}\n` +
      `📍 Recolha: ${recolha}\n` +
      `🎯 Destino: ${destino}`,
      { parse_mode: 'Markdown' }
    ).catch(error => {
      console.error('Erro ao enviar para Telegram:', error)
    })
  } else {
    console.log('Telegram não configurado - reserva apenas no sistema')
  }
  
  res.json({ 
    success: true, 
    message: 'Reserva recebida com sucesso!',
    clientsConnected: connectedClients.size
  })
})

// Rota API para chat
app.post('/api/chat', express.json(), (req, res) => {
  const { name, phone, message } = req.body
  
  console.log('Mensagem do chat:', { name, phone, message })
  
  // Broadcast para todos os clientes
  io.emit('chat_message', {
    name,
    phone,
    message,
    timestamp: new Date().toISOString()
  })
  
  // Enviar para Telegram se configurado
  if (bot && TELEGRAM_TOKEN !== 'your_telegram_bot_token_here') {
    bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID || 'default',
      `💬 *Mensagem do Chat*\n\n` +
      `👤 Nome: ${name}\n` +
      `📞 Telefone: ${phone}\n` +
      `💭 Mensagem: ${message}`,
      { parse_mode: 'Markdown' }
    ).catch(console.error)
  }
  
  res.json({ success: true, message: 'Mensagem enviada!' })
})

// Start server
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Site: http://localhost:${PORT}`)
  console.log(`Bot Telegram: ${bot ? 'Ativo' : 'Inativo'}`)
})
