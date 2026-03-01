import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import BookingForm from './components/BookingForm'
import LanguageSelector from './components/LanguageSelector'
import { LanguageProvider } from './contexts/LanguageContext'
import { Trip } from '@shared/schema'

function AppContent() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    const newSocket = io()
    setSocket(newSocket)

    newSocket.on('trip-status', (data: { status: string, message: string }) => {
      console.log('Trip status:', data)
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
      {/* Background simples sem mapa por enquanto */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-green-950/20 to-black"></div>
      
      {/* Language Selector */}
      <LanguageSelector />
      
      {/* Conteúdo Principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg">
          {/* Formulário de Reserva */}
          <BookingForm 
            onBookingComplete={handleBookingComplete}
            socket={socket}
          />
        </div>
      </div>
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
