import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import BookingForm from './components/BookingForm'
import MapContainer from './components/MapContainer'
import ChatWindow from './components/ChatWindow'
import NotificationSystem from './components/NotificationSystem'
import LanguageSelector from './components/LanguageSelector'
import { LanguageProvider } from './contexts/LanguageContext'
import { Trip } from '@shared/schema'

function AppContent() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    const newSocket = io()
    setSocket(newSocket)

    newSocket.on('trip-status', (data: { status: string, message: string }) => {
      setNotifications(prev => [...prev, data.message])
      
      // Alerta sonoro para motorista chegou
      if (data.status === 'driver_arrived') {
        const audio = new Audio('/ping.mp3')
        audio.play().catch(() => {})
      }
    })

    return () => newSocket.close()
  }, [])

  // Esconder splash screen quando App montar
  useEffect(() => {
    const hideSplash = () => {
      const splash = document.getElementById('splash')
      if (splash) {
        splash.style.opacity = '0'
        splash.style.transition = 'opacity 0.2s ease-out'
        setTimeout(() => {
          if (splash) {
            splash.style.display = 'none'
          }
        }, 200)
      }
    }

    hideSplash()
  }, [])

  const handleBookingComplete = (trip: Trip) => {
    setCurrentTrip(trip)
    setShowChat(true)
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Language Selector */}
      <LanguageSelector />
      
      {/* Mapa de Fundo */}
      <MapContainer />
      
      {/* Conteúdo Principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Formulário de Reserva */}
          <BookingForm 
            onBookingComplete={handleBookingComplete}
            socket={socket}
          />
          
          {/* Janela de Chat */}
          {showChat && currentTrip && (
            <div className="mt-6">
              <ChatWindow 
                tripId={currentTrip.id}
                onClose={() => setShowChat(false)}
                socket={socket}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sistema de Notificações */}
      <NotificationSystem notifications={notifications} />
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
