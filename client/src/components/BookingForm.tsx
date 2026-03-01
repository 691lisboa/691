import { useState } from 'react'
import { Socket } from 'socket.io-client'
import { InsertTrip } from '@shared/schema'
import { useLanguage } from '../contexts/LanguageContext'
import AddressAutocomplete from './AddressAutocomplete'
import { MapPin, Calculator, Clock, User, Phone, Car } from 'lucide-react'

interface BookingFormProps {
  onBookingComplete: (trip: InsertTrip) => void
  socket: Socket | null
}

export default function BookingForm({ onBookingComplete, socket }: BookingFormProps) {
  const { t, language } = useLanguage()
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickupLocation: '',
    dropoffLocation: '',
    pickupTime: '',
    customerLanguage: language
  })
  const [isLoading, setIsLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [price, setPrice] = useState<number | null>(null)

  const handleGPSLocation = async () => {
    if (!navigator.geolocation) {
      alert(t('gps.error'))
      return
    }

    setIsLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Simular reverse geocoding (implementar API real)
          const mockAddress = `Localização atual (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`
          
          setFormData(prev => ({
            ...prev,
            pickupLocation: mockAddress
          }))

          // Calcular preço se destino estiver preenchido
          if (formData.dropoffLocation) {
            calculatePrice()
          }
        } catch (error) {
          console.error('Erro ao obter localização:', error)
          alert(t('gps.error'))
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        console.error('Erro de geolocalização:', error)
        alert(t('gps.error'))
        setIsLoading(false)
      }
    )
  }

  const calculatePrice = async () => {
    if (!formData.pickupLocation || !formData.dropoffLocation) return

    setPriceLoading(true)
    
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
        const mockDistance = Math.random() * 20 + 5
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
      setPriceLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validação
    if (!formData.customerName || !formData.customerPhone || !formData.pickupLocation || !formData.dropoffLocation) {
      alert(t('booking.fill_fields'))
      return
    }

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
        dropoffLng: 0,
        customerLanguage: language
      }

      // Enviar via HTTP API (não Socket.io)
      const response = await fetch('/api/trips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData)
      })

      if (!response.ok) {
        throw new Error('Erro ao criar reserva')
      }

      const savedTrip = await response.json()

      // Notificar sucesso
      alert(t('booking.success'))
      onBookingComplete(savedTrip)

      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        dropoffLocation: '',
        pickupTime: '',
        customerLanguage: language
      })
      setPrice(null)

    } catch (error) {
      console.error('Erro ao criar reserva:', error)
      alert(t('booking.error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (socket) {
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
      customerLanguage: language
    })
    setPrice(null)
  }

  // Recalcular preço quando endereços mudam
  React.useEffect(() => {
    if (formData.pickupLocation && formData.dropoffLocation) {
      calculatePrice()
    }
  }, [formData.pickupLocation, formData.dropoffLocation])

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-black/40 backdrop-blur-2xl border border-green-500/30 rounded-3xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-3">
          <Car className="w-8 h-8 text-green-500 mr-3" />
          <h1 className="text-3xl font-bold text-white">{t('booking.title')}</h1>
        </div>
        <p className="text-green-400/80 text-sm">{t('app.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-green-400" />
          </div>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            placeholder={t('booking.name')}
            className="w-full pl-10 pr-4 py-4 bg-black/30 border border-green-500/30 rounded-2xl text-white placeholder-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-xl transition-all duration-300"
            required
          />
        </div>

        {/* Telefone */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-green-400" />
          </div>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            placeholder={t('booking.phone')}
            className="w-full pl-10 pr-4 py-4 bg-black/30 border border-green-500/30 rounded-2xl text-white placeholder-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-xl transition-all duration-300"
            required
          />
        </div>

        {/* Local de Recolha com GPS */}
        <div>
          <AddressAutocomplete
            value={formData.pickupLocation}
            onChange={(value) => setFormData(prev => ({ ...prev, pickupLocation: value }))}
            placeholder={t('booking.pickup')}
            showGPS={true}
            onGPSClick={handleGPSLocation}
            isLoading={isLoading}
          />
        </div>

        {/* Destino (sem GPS) */}
        <div>
          <AddressAutocomplete
            value={formData.dropoffLocation}
            onChange={(value) => setFormData(prev => ({ ...prev, dropoffLocation: value }))}
            placeholder={t('booking.destination')}
            showGPS={false}
          />
        </div>

        {/* Hora */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Clock className="h-5 w-5 text-green-400" />
          </div>
          <input
            type="datetime-local"
            value={formData.pickupTime}
            onChange={(e) => setFormData(prev => ({ ...prev, pickupTime: e.target.value }))}
            className="w-full pl-10 pr-4 py-4 bg-black/30 border border-green-500/30 rounded-2xl text-white placeholder-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-xl transition-all duration-300"
          />
        </div>

        {/* Preço */}
        {price !== null && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calculator className="w-5 h-5 text-green-400 mr-3" />
                <span className="text-green-400 font-medium">{t('booking.price')}</span>
              </div>
              <span className="text-2xl font-bold text-white">€{price.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading || priceLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-500/30 text-black font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/25"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                {language === 'pt' ? 'A processar...' : 'Processing...'}
              </span>
            ) : (
              t('booking.book')
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold py-4 px-6 rounded-2xl transition-all duration-300 border border-red-500/30"
          >
            {t('booking.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
