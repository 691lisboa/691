import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { TripMessage } from '@shared/schema'

interface ChatWindowProps {
  tripId: number
  socket: Socket | null
  onClose: () => void
}

export default function ChatWindow({ tripId, socket, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<TripMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [userLanguage, setUserLanguage] = useState('pt')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socket) return

    // Escutar mensagens do chat
    socket.on('chat-message', (message: TripMessage) => {
      setMessages(prev => [...prev, message])
    })

    // Detectar idioma do usuário (simplificado)
    const detectedLang = navigator.language.split('-')[0]
    setUserLanguage(detectedLang === 'pt' ? 'pt' : 'en')

    return () => {
      socket.off('chat-message')
    }
  }, [socket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const translateMessage = async (text: string, targetLang: string): Promise<string> => {
    setIsTranslating(true)
    
    try {
      // Simular tradução (implementar API real como Google Translate ou OpenAI)
      if (targetLang === 'pt' && !text.toLowerCase().includes('olá') && !text.toLowerCase().includes('obrigado')) {
        // Mock tradução para português
        const translations: Record<string, string> = {
          'hello': 'olá',
          'thank you': 'obrigado',
          'thank': 'obrigado',
          'thanks': 'obrigado',
          'yes': 'sim',
          'no': 'não',
          'please': 'por favor',
          'sorry': 'desculpe',
          'good': 'bom',
          'bad': 'mau',
          'ok': 'ok',
          'hi': 'olá',
          'bye': 'adeus'
        }
        
        let translatedText = text.toLowerCase()
        Object.entries(translations).forEach(([en, pt]) => {
          translatedText = translatedText.replace(new RegExp(en, 'gi'), pt)
        })
        
        return translatedText
      }
      
      return text
    } catch (error) {
      console.error('Erro na tradução:', error)
      return text
    } finally {
      setIsTranslating(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !socket) return

    const messageData = {
      tripId,
      sender: 'customer',
      contentOriginal: newMessage,
      contentTranslated: userLanguage === 'pt' ? newMessage : await translateMessage(newMessage, 'pt')
    }

    socket.emit('send-chat-message', messageData)
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatMessage = (message: TripMessage) => {
    const isCustomer = message.sender === 'customer'
    const displayText = userLanguage === 'pt' || message.sender === 'customer' 
      ? message.contentOriginal 
      : message.contentTranslated

    return (
      <div
        key={message.id}
        className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} mb-3 animate-fadeInUp`}
      >
        <div
          className={`max-w-xs px-4 py-2 rounded-2xl ${
            isCustomer
              ? 'bg-green-600 text-white rounded-br-none'
              : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
          }`}
        >
          <p className="text-sm">{displayText}</p>
          <p className="text-xs opacity-70 mt-1">
            {new Date(message.createdAt).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass-card w-full max-w-md h-96 flex flex-col animate-fadeInUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-900/30">
          <h3 className="text-lg font-semibold text-taxi-green">Chat com Motorista</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Indicador de idioma */}
        <div className="flex items-center gap-2 mb-3 text-xs text-green-600">
          <span>Idioma: {userLanguage === 'pt' ? 'Português' : 'English'}</span>
          {isTranslating && <span className="spinner" />}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <p>🚗</p>
              <p>Sem mensagens ainda</p>
              <p className="text-xs mt-2">O motorista irá responder brevemente</p>
            </div>
          ) : (
            messages.map(formatMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="glass-input flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isTranslating}
            className="glass-button px-4 py-2 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  )
}
