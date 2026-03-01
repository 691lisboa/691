import React, { createContext, useContext, useState, ReactNode } from 'react'

type Language = 'pt' | 'en'

interface Translations {
  [key: string]: {
    pt: string
    en: string
  }
}

const translations: Translations = {
  // Header
  'app.title': { pt: '691 Taxi', en: '691 Taxi' },
  'app.subtitle': { pt: 'Serviço Premium', en: 'Premium Service' },
  
  // Booking Form
  'booking.title': { pt: 'Reserva o Seu Taxi', en: 'Book Your Taxi' },
  'booking.name': { pt: 'Nome', en: 'Name' },
  'booking.phone': { pt: 'Telefone', en: 'Phone' },
  'booking.pickup': { pt: 'Local de Recolha', en: 'Pickup Location' },
  'booking.destination': { pt: 'Destino', en: 'Destination' },
  'booking.time': { pt: 'Hora da Recolha', en: 'Pickup Time' },
  'booking.now': { pt: 'Agora', en: 'Now' },
  'booking.price': { pt: 'Preço Estimado', en: 'Estimated Price' },
  'booking.book': { pt: 'Reservar Taxi', en: 'Book Taxi' },
  'booking.cancel': { pt: 'Cancelar', en: 'Cancel' },
  
  // Messages
  'booking.success': { pt: 'Reserva criada com sucesso!', en: 'Booking created successfully!' },
  'booking.error': { pt: 'Erro ao criar reserva. Tente novamente.', en: 'Error creating booking. Please try again.' },
  'booking.fill_fields': { pt: 'Por favor, preencha todos os campos obrigatórios.', en: 'Please fill all required fields.' },
  
  // GPS
  'gps.get_location': { pt: 'Usar Minha Localização', en: 'Use My Location' },
  'gps.getting': { pt: 'A obter localização...', en: 'Getting location...' },
  'gps.error': { pt: 'Erro ao obter localização', en: 'Error getting location' },
  
  // Chat
  'chat.title': { pt: 'Chat com Motorista', en: 'Chat with Driver' },
  'chat.placeholder': { pt: 'Digite sua mensagem...', en: 'Type your message...' },
  'chat.send': { pt: 'Enviar', en: 'Send' },
  'chat.driver': { pt: 'Motorista', en: 'Driver' },
  'chat.you': { pt: 'Você', en: 'You' },
  
  // Notifications
  'notification.driver_arrived': { pt: '📍 O motorista chegou! Por favor, aguarde.', en: '📍 The driver has arrived! Please wait.' },
  'notification.trip_confirmed': { pt: '✅ Sua reserva foi confirmada!', en: '✅ Your booking has been confirmed!' },
  'notification.trip_completed': { pt: '🏁 Viagem concluída. Obrigado!', en: '🏁 Trip completed. Thank you!' },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Detectar idioma do navegador ou usar localStorage
    const saved = localStorage.getItem('691-language') as Language
    if (saved) return saved
    
    const browserLang = navigator.language.split('-')[0] as Language
    return browserLang === 'en' ? 'en' : 'pt'
  })

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('691-language', lang)
  }

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
