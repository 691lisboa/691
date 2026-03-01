import { useState } from 'react'
import { Socket } from 'socket.io-client'
import { InsertTrip } from '@shared/schema'

interface BookingFormProps {
  onBookingComplete: (trip: InsertTrip) => void
  socket: Socket | null
}

export default function BookingForm({ onBookingComplete, socket }: BookingFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    customerLanguage: 'pt'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [price, setPrice] = useState<number | null>(null)

  const handleLocationInput = async (type: 'pickup' | 'dropoff') => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo seu navegador')
      return
    }

    setIsLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Simular reverse geocoding (implementar API real)
          const mockAddress = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          
          setFormData(prev => ({
            ...prev,
            [`${type}Location`]: mockAddress
          }))

          // Calcular preço se ambos os campos estiverem preenchidos
          if (type === 'dropoff' && formData.pickupLocation || 
              type === 'pickup' && formData.dropoffLocation) {
            calculatePrice()
          }
        } catch (error) {
          console.error('Erro ao obter localização:', error)
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error)
        setIsLoading(false)
      }
    )
  }

  const calculatePrice = async () => {
    if (!formData.pickupLocation || !formData.dropoffLocation) return

    setIsLoading(true)
    
    try {
      // Chamar API de preços
      const response = await fetch('/api/routing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pickup: formData.pickupLocation,
          dropoff: formData.dropoffLocation
        })
      })

      if (response.ok) {
        const routeData = await response.json()
        setPrice(routeData.price)
      } else {
        // Fallback para cálculo mock
        const mockDistance = Math.random() * 20 + 5 // 5-25 km
        const calculatedPrice = 3.25 + (mockDistance * 0.90)
        setPrice(Math.round(calculatedPrice * 100) / 100)
      }
    } catch (error) {
      console.error('Erro ao calcular preço:', error)
      // Fallback para cálculo mock
      const mockDistance = Math.random() * 20 + 5
      const calculatedPrice = 3.25 + (mockDistance * 0.90)
      setPrice(Math.round(calculatedPrice * 100) / 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!socket) return

    setIsLoading(true)

    try {
      const tripData: InsertTrip = {
        ...formData,
        pickupTime: formData.pickupTime || new Date().toISOString(),
        price: price || 0,
        distanceKm: 0, // Calcular via API
        pickupLat: 0, // Obter da geocoding
        pickupLng: 0,
        dropoffLat: 0,
        dropoffLng: 0
      }

      // Enviar para o servidor
      socket.emit('create-trip', tripData)

      // Simular resposta do servidor
      setTimeout(() => {
        onBookingComplete({
          ...tripData,
          id: Date.now(),
          status: 'pending',
          createdAt: new Date()
        } as any)
        setIsLoading(false)
      }, 1000)

    } catch (error) {
      console.error('Erro ao criar reserva:', error)
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (socket && formData.customerName) {
      socket.emit('cancel-trip', {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone
      })
    }
    
    // Reset form
    setFormData({
      customerName: '',
      customerPhone: '',
      pickupLocation: '',
      dropoffLocation: '',
      pickupTime: '',
      customerLanguage: 'pt'
    })
    setPrice(null)
  }

  return (
    <div className="glass-card animate-fadeInUp">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-taxi-green mb-2">691</h1>
        <p className="text-green-600/70 text-sm">Serviço de Taxi Premium</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <input
            type="text"
            placeholder="Nome completo"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            className="glass-input"
            required
          />
        </div>

        {/* Telefone */}
        <div>
          <input
            type="tel"
            placeholder="Telemóvel"
            value={formData.customerPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            className="glass-input"
            required
          />
        </div>

        {/* Local de Recolha */}
        <div className="relative">
          <input
            type="text"
            placeholder="Local de recolha"
            value={formData.pickupLocation}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, pickupLocation: e.target.value }))
              if (e.target.value && formData.dropoffLocation) calculatePrice()
            }}
            className="glass-input pr-12"
            required
          />
          <button
            type="button"
            onClick={() => handleLocationInput('pickup')}
            className="gps-button"
            disabled={isLoading}
          >
            📍
          </button>
        </div>

        {/* Destino */}
        <div className="relative">
          <input
            type="text"
            placeholder="Destino"
            value={formData.dropoffLocation}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, dropoffLocation: e.target.value }))
              if (e.target.value && formData.pickupLocation) calculatePrice()
            }}
            className="glass-input pr-12"
            required
          />
          <button
            type="button"
            onClick={() => handleLocationInput('dropoff')}
            className="gps-button"
            disabled={isLoading}
          >
            📍
          </button>
        </div>

        {/* Hora de Recolha */}
        <div>
          <input
            type="datetime-local"
            value={formData.pickupTime}
            onChange={(e) => setFormData(prev => ({ ...prev, pickupTime: e.target.value }))}
            className="glass-input"
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {/* Preço Calculado */}
        {price && (
          <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-700/30">
            <p className="text-green-400 text-sm">Preço Estimado</p>
            <p className="text-2xl font-bold text-taxi-green">€{price}</p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !price}
            className="glass-button flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <span className="spinner mr-2" /> : null}
            {isLoading ? 'A processar...' : 'Reservar Taxi'}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="glass-button bg-red-900/20 border-red-700/50 text-red-400 hover:bg-red-800/30"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
