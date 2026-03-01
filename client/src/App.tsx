import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import BookingForm from './components/BookingForm'
import MapContainer from './components/MapContainer'
import ChatWindow from './components/ChatWindow'
import NotificationSystem from './components/NotificationSystem'
import { Trip } from '@shared/schema'

function App() {
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
    const splash = document.getElementById('splash')
    if (splash) {
      splash.style.opacity = '0'
      splash.style.transition = 'opacity 0.3s ease-out'
      setTimeout(() => {
        if (splash) {
          splash.style.display = 'none'
        }
      }, 300)
    }
  }, [])

  const handleBookingComplete = (trip: Trip) => {
    setCurrentTrip(trip)
    setShowChat(true)
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Mapa de Fundo */}
      <MapContainer />
      
      {/* Sistema de Notificações */}
      <NotificationSystem notifications={notifications} />
      
      {/* Conteúdo Principal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {!currentTrip ? (
            <BookingForm onBookingComplete={handleBookingComplete} socket={socket} />
          ) : (
            <div className="glass-card text-center">
              <h2 className="text-2xl font-bold text-taxi-green mb-4">
                Reserva Confirmada
              </h2>
              <div className="space-y-2 text-white mb-6">
                <p>Estado: <span className="text-taxi-green">{currentTrip.status}</span></p>
                <p>Preço: <span className="text-taxi-green">€{currentTrip.price}</span></p>
              </div>
              <button
                onClick={() => setShowChat(!showChat)}
                className="glass-button w-full"
              >
                {showChat ? 'Ocultar Chat' : 'Abrir Chat'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Janela de Chat */}
      {showChat && currentTrip && (
        <ChatWindow 
          tripId={currentTrip.id} 
          socket={socket}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}

export default App
