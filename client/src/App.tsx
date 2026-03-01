import { useState, useEffect } from 'react'

function App() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Esconder splash screen
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
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-green-950/20 to-black"></div>
      
      {/* Conteúdo Principal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-green-500/30 rounded-3xl shadow-2xl p-6">
          <h1 className="text-3xl font-bold text-white text-center mb-6">🚕 691 Taxi</h1>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome"
              className="w-full px-4 py-3 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-green-400/50"
            />
            <input
              type="tel"
              placeholder="Telefone"
              className="w-full px-4 py-3 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-green-400/50"
            />
            <input
              type="text"
              placeholder="Local de recolha"
              className="w-full px-4 py-3 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-green-400/50"
            />
            <input
              type="text"
              placeholder="Destino"
              className="w-full px-4 py-3 bg-black/30 border border-green-500/30 rounded-xl text-white placeholder-green-400/50"
            />
            
            <button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-xl transition-colors">
              Reservar Taxi
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <button className="text-green-400 text-sm">PT</button>
            <span className="text-green-400/50 mx-2">|</span>
            <button className="text-green-400/50 text-sm">EN</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
