import { Server as SocketIOServer } from 'socket.io'
import TelegramBot from 'node-telegram-bot-api'
import { db } from './db'
import { trips, tripMessages } from '@shared/schema'
import { eq } from 'drizzle-orm'

let bot: TelegramBot | null = null
let io: SocketIOServer | null = null

// Função de tradução simples (mock)
function translateToPortuguese(text: string): string {
  const translations: Record<string, string> = {
    'hello': 'olá',
    'hi': 'olá',
    'thank you': 'obrigado',
    'thanks': 'obrigado',
    'yes': 'sim',
    'no': 'não',
    'please': 'por favor',
    'sorry': 'desculpe',
    'good': 'bom',
    'bad': 'mau',
    'ok': 'ok',
    'bye': 'adeus',
    'arriving': 'a chegar',
    'coming': 'a caminho',
    'ready': 'pronto',
    'waiting': 'à espera'
  }

  let translatedText = text.toLowerCase()
  Object.entries(translations).forEach(([en, pt]) => {
    translatedText = translatedText.replace(new RegExp(en, 'gi'), pt)
  })

  return translatedText
}

export function setupTelegramBot(socketIO: SocketIOServer) {
  io = socketIO

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('TELEGRAM_BOT_TOKEN não encontrado. Bot Telegram não será inicializado.')
    return
  }

  try {
    // Em produção, usar webhook ou polling com tratamento de erro
    const isProduction = process.env.NODE_ENV === 'production'
    
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
      polling: isProduction ? {
        interval: 1000,
        autoStart: true,
        params: {
          timeout: 10
        }
      } : true
    })

    bot.on('polling_error', (error) => {
      console.error('Telegram polling error:', error.message)
      // Ignorar conflitos de polling em produção
      if (error.message.includes('ETELEGRAM: 409')) {
        console.log('Bot já está rodando em outra instância - ignorando conflito')
      }
    })

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id
      const text = msg.text

      console.log(`Mensagem recebida do Telegram: ${text}`)

      // Comandos do bot
      if (text?.startsWith('/')) {
        await handleCommand(chatId, text)
      }
    })

    // Callback queries para botões inline
    bot.on('callback_query', async (callbackQuery) => {
      const msg = callbackQuery.message!
      const chatId = msg.chat.id
      const data = callbackQuery.data

      if (!data) return

      console.log(`Callback recebido: ${data}`)

      await handleCallback(chatId, data, msg)
    })

    console.log('Bot Telegram inicializado com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar bot Telegram:', error)
  }
}

async function handleCommand(chatId: number, command: string) {
  if (!bot) return

  switch (command) {
    case '/start':
      await bot.sendMessage(chatId, 
        '🚕 *Bem-vindo ao 691 Taxi Bot*\n\n' +
        'Use os botões abaixo para gerir as reservas:\n\n' +
        '📋 *Comandos disponíveis:*\n' +
        '/reservas - Ver reservas ativas\n' +
        '/ajuda - Mostrar ajuda',
        { parse_mode: 'Markdown' }
      )
      break

    case '/reservas':
      await showActiveTrips(chatId)
      break

    case '/ajuda':
      await bot.sendMessage(chatId,
        '🤖 *Ajuda - 691 Taxi*\n\n' +
        '📱 *Botões de Ação:*\n' +
        '✅ *Confirmar* - Confirma reserva\n' +
        '📍 *Cheguei* - Notifica cliente da chegada\n' +
        '🚀 *Waze* - Abre rota no Waze\n' +
        '🏁 *Concluir* - Finaliza viagem\n' +
        '💬 *Chat* - Envia mensagem para cliente\n\n' +
        '📋 *Comandos:*\n' +
        '/reservas - Ver reservas ativas\n' +
        '/start - Menu inicial',
        { parse_mode: 'Markdown' }
      )
      break

    default:
      await bot.sendMessage(chatId, 'Comando não reconhecido. Use /ajuda para ver os comandos disponíveis.')
  }
}

async function showActiveTrips(chatId: number) {
  if (!bot) return

  try {
    const activeTrips = await db.select()
      .from(trips)
      .where(eq(trips.status, 'pending'))
      .limit(10)

    if (activeTrips.length === 0) {
      await bot.sendMessage(chatId, '📭 *Sem reservas ativas*', { parse_mode: 'Markdown' })
      return
    }

    for (const trip of activeTrips) {
      const message = `🚕 *RESERVA #${trip.id}*\n\n` +
        `👤 *Cliente:* ${trip.customerName}\n` +
        `📞 *Telefone:* ${trip.customerPhone}\n` +
        `📍 *Recolha:* ${trip.pickupLocation}\n` +
        `🎯 *Destino:* ${trip.dropoffLocation}\n` +
        `⏰ *Hora:* ${new Date(trip.pickupTime).toLocaleString('pt-PT')}\n` +
        `💰 *Preço:* €${trip.price}\n` +
        `📊 *Status:* ${trip.status}`

      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Confirmar', callback_data: `confirm_${trip.id}` },
            { text: '📍 Cheguei', callback_data: `arrived_${trip.id}` }
          ],
          [
            { text: '🚀 Waze', callback_data: `waze_${trip.id}` },
            { text: '🏁 Concluir', callback_data: `complete_${trip.id}` }
          ],
          [
            { text: '💬 Chat', callback_data: `chat_${trip.id}` }
          ]
        ]
      }

      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      })
    }

  } catch (error) {
    console.error('Erro ao buscar reservas ativas:', error)
    await bot.sendMessage(chatId, '❌ Erro ao buscar reservas ativas')
  }
}

async function handleCallback(chatId: number, data: string, msg: any) {
  if (!bot || !io) return

  const [action, tripIdStr] = data.split('_')
  const tripId = parseInt(tripIdStr)

  if (isNaN(tripId)) {
    await bot.answerCallbackQuery(callbackQuery.id, 'ID da reserva inválido')
    return
  }

  try {
    switch (action) {
      case 'confirm':
        await updateTripStatus(tripId, 'confirmed', '✅ Reserva confirmada pelo motorista')
        await bot.answerCallbackQuery(callbackQuery.id, 'Reserva confirmada!')
        break

      case 'arrived':
        await updateTripStatus(tripId, 'driver_arrived', '📍 O motorista chegou ao local de recolha')
        
        // Emitir alerta sonoro para o cliente
        io.emit('trip-status', {
          tripId,
          status: 'driver_arrived',
          message: '📍 O motorista chegou! Por favor, aguarde.'
        })
        
        await bot.answerCallbackQuery(callbackQuery.id, 'Notificação enviada ao cliente!')
        break

      case 'waze':
        await openWazeRoute(tripId, chatId)
        await bot.answerCallbackQuery(callbackQuery.id, 'Abrindo Waze...')
        break

      case 'complete':
        await updateTripStatus(tripId, 'completed', '🏁 Viagem concluída')
        await bot.answerCallbackQuery(callbackQuery.id, 'Viagem concluída!')
        break

      case 'chat':
        await initiateChat(tripId, chatId)
        await bot.answerCallbackQuery(callbackQuery.id, 'Modo chat ativado')
        break

      default:
        await bot.answerCallbackQuery(callbackQuery.id, 'Ação não reconhecida')
    }

  } catch (error) {
    console.error('Erro ao processar callback:', error)
    await bot.answerCallbackQuery(callbackQuery.id, 'Erro ao processar ação')
  }
}

async function updateTripStatus(tripId: number, status: string, message: string) {
  if (!io) return

  try {
    const [updatedTrip] = await db.update(trips)
      .set({ status })
      .where(eq(trips.id, tripId))
      .returning()

    // Notificar todos os clientes conectados
    io.emit('trip-status', {
      tripId,
      status,
      message
    })

    io.emit('trip-update', updatedTrip)

    console.log(`Status da reserva ${tripId} atualizado para: ${status}`)

  } catch (error) {
    console.error('Erro ao atualizar status:', error)
  }
}

async function openWazeRoute(tripId: number, chatId: number) {
  if (!bot) return

  try {
    const [trip] = await db.select()
      .from(trips)
      .where(eq(trips.id, tripId))
      .limit(1)

    if (!trip) {
      await bot.sendMessage(chatId, '❌ Reserva não encontrada')
      return
    }

    // Criar URL do Waze (simplificado)
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(trip.pickupLocation)}`
    
    await bot.sendMessage(chatId, 
      `🚀 *Abrindo rota no Waze*\n\n` +
      `📍 *Destino:* ${trip.pickupLocation}\n` +
      `🔗 [Abrir no Waze](${wazeUrl})`,
      { parse_mode: 'Markdown' }
    )

  } catch (error) {
    console.error('Erro ao abrir rota Waze:', error)
    await bot.sendMessage(chatId, '❌ Erro ao abrir rota no Waze')
  }
}

async function initiateChat(tripId: number, chatId: number) {
  if (!bot) return

  try {
    // Enviar mensagem para o cliente via Socket.io
    if (io) {
      io.emit('chat-message', {
        tripId,
        sender: 'driver',
        contentOriginal: 'Olá! Sou o motorista. Posso ajudar?',
        contentTranslated: 'Olá! Sou o motorista. Posso ajudar?',
        createdAt: new Date(),
        id: Date.now()
      })
    }

    await bot.sendMessage(chatId, 
      '💬 *Chat ativado*\n\n' +
      'Envie sua mensagem e ela será entregue ao cliente.\n' +
      'O cliente pode responder diretamente pelo aplicativo.',
      { parse_mode: 'Markdown' }
    )

  } catch (error) {
    console.error('Erro ao iniciar chat:', error)
    await bot.sendMessage(chatId, '❌ Erro ao iniciar chat')
  }
}

// Função para enviar mensagens do Telegram
export async function sendTelegramMessage(message: string, chatId?: number) {
  if (!bot) return

  const targetChatId = chatId || parseInt(process.env.TELEGRAM_CHAT_ID || '0')
  
  if (targetChatId === 0) {
    console.log('TELEGRAM_CHAT_ID não configurado')
    return
  }

  try {
    await bot.sendMessage(targetChatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  } catch (error) {
    console.error('Erro ao enviar mensagem Telegram:', error)
  }
}

// Função para processar mensagens de chat do Telegram
export async function processTelegramChatMessage(msg: any) {
  if (!bot || !io) return

  const chatId = msg.chat.id
  const text = msg.text
  const tripId = extractTripIdFromContext(msg) // Implementar lógica para extrair ID

  if (!tripId || !text) return

  try {
    // Traduzir mensagem para português se necessário
    const translatedText = translateToPortuguese(text)

    // Enviar para o cliente via Socket.io
    io.emit('chat-message', {
      tripId,
      sender: 'driver',
      contentOriginal: text,
      contentTranslated: translatedText,
      createdAt: new Date(),
      id: Date.now()
    })

    // Salvar no banco de dados
    await db.insert(tripMessages).values({
      tripId,
      sender: 'driver',
      contentOriginal: text,
      contentTranslated: translatedText,
      createdAt: new Date()
    })

  } catch (error) {
    console.error('Erro ao processar mensagem de chat:', error)
  }
}

function extractTripIdFromContext(msg: any): number | null {
  // Implementar lógica para extrair ID da reserva do contexto
  // Por enquanto, retorna null
  return null
}
