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

if (TELEGRAM_TOKEN) {
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
          'Clique no botão abaixo para simular uma chegada:\n\n',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '🚗 Motorista Chegou', callback_data: 'driver_arrived' }
              ]]
            }
          }
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
        await bot.sendMessage(chatId, '✅ Notificação enviada para o site!')
      }
    })

    console.log('Bot Telegram inicializado com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar bot Telegram:', error)
  }
} else {
  console.log('TELEGRAM_BOT_TOKEN não encontrado')
}

// Socket.io
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`)
  })
})

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')))

// Rota API para receber reservas
app.post('/api/reserva', express.json(), (req, res) => {
  const { nome, telefone, recolha, destino } = req.body
  
  console.log('Nova reserva:', { nome, telefone, recolha, destino })
  
  // Enviar para Telegram se configurado
  if (bot) {
    bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID || chatId,
      `🚕 *Nova Reserva 691*\n\n` +
      `👤 Nome: ${nome}\n` +
      `📞 Telefone: ${telefone}\n` +
      `📍 Recolha: ${recolha}\n` +
      `🎯 Destino: ${destino}`,
      { parse_mode: 'Markdown' }
    ).catch(console.error)
  }
  
  res.json({ success: true, message: 'Reserva recebida!' })
})

// Start server
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
  console.log(`Site: http://localhost:${PORT}`)
})
