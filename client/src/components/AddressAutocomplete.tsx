import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { Search, MapPin, Loader2 } from 'lucide-react'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showGPS?: boolean
  onGPSClick?: () => void
  isLoading?: boolean
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  showGPS = true,
  onGPSClick,
  isLoading = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Buscar sugestões da API
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Tentar API de sugestões primeiro
      const response = await fetch(`/api/routing/suggestions?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data)
      } else {
        // Fallback para sugestões mock
        const mockSuggestions = getMockSuggestions(query)
        setSuggestions(mockSuggestions)
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      // Fallback para sugestões mock
      const mockSuggestions = getMockSuggestions(query)
      setSuggestions(mockSuggestions)
    } finally {
      setLoading(false)
    }
  }

  // Sugestões mock para Portugal
  const getMockSuggestions = (query: string): string[] => {
    const portugalAddresses = [
      'Avenida da Liberdade, Lisboa',
      'Praça do Comércio, Lisboa',
      'Rua Augusta, Lisboa',
      'Chiado, Lisboa',
      'Bairro Alto, Lisboa',
      'Alfama, Lisboa',
      'Belém, Lisboa',
      'Parque das Nações, Lisboa',
      'Cais do Sodré, Lisboa',
      'Marquês de Pombal, Lisboa',
      'Aeroporto Humberto Delgado, Lisboa',
      'Estação de Santa Apolónia, Lisboa',
      'Rossio, Lisboa',
      'Restauradores, Lisboa',
      'Saldanha, Lisboa',
      'Campo Pequeno, Lisboa',
      'El Corte Inglés, Lisboa',
      'Colombo Shopping Centre, Lisboa',
      'Vasco da Gama Shopping, Lisboa',
      'Centro Comercial das Amoreiras, Lisboa',
      'Rua de O Século, Lisboa',
      'Largo do Chiado, Lisboa',
      'Praça Luís de Camões, Lisboa',
      'Miradouro de Santa Luzia, Lisboa',
      'Castelo de São Jorge, Lisboa',
      'Sé de Lisboa, Lisboa',
      'Time Out Market, Lisboa',
      'Mercado da Ribeira, Lisboa',
      'Ponte 25 de Abril, Lisboa',
      'Ponte Vasco da Gama, Lisboa',
      'Torre de Belém, Lisboa',
      'Mosteiro dos Jerónimos, Lisboa',
      'Centro Cultural de Belém, Lisboa',
      'MAAT - Museu de Arte, Arquitetura e Tecnologia, Lisboa',
      'LX Factory, Lisboa',
      'Docas de Santo Amaro, Lisboa',
      'Doca de Alcântara, Lisboa',
      'Jardim da Estrela, Lisboa',
      'Jardim Botânico, Lisboa',
      'Jardim Zoológico, Lisboa',
      'Pavilhão do Conhecimento, Lisboa',
      'Oceanário de Lisboa, Lisboa',
      'Gare do Oriente, Lisboa',
      'Estação do Oriente, Lisboa',
      'Fil, Lisboa',
      'Altice Arena, Lisboa',
      'Camel Palace, Lisboa',
      'Hotels Collection Lisboa, Lisboa',
      'Myriad by Sana Hotels, Lisboa',
      'Tivoli Oriente Hotel, Lisboa',
      'Meliá Lisboa Aeroporto Hotel, Lisboa',
      'Hotel Real Palácio, Lisboa',
      'Hotel Avenida Palace, Lisboa',
      'Tivoli Lisboa, Lisboa',
      'Hotel Britannia, Lisboa',
      'Hotel Lisboa Plaza, Lisboa',
      'Hotel Real Parque, Lisboa',
      'Hotel Turim, Lisboa',
      'Hotel Alif, Lisboa',
      'Hotel Real Oeiras, Oeiras',
      'Cascais, Cascais',
      'Estoril, Estoril',
      'Sintra, Sintra',
      'Queluz, Queluz',
      'Cacilhas, Cacilhas',
      'Almada, Almada',
      'Costa da Caparica, Costa da Caparica',
      'Setúbal, Setúbal',
      'Sesimbra, Sesimbra',
      'Palmela, Palmela',
      'Montijo, Montijo',
      'Barreiro, Barreiro',
      'Seixal, Seixal',
      'Alcochete, Alcochete',
      'Ponta Delgada, Ponta Delgada',
      'Funchal, Funchal',
      'Porto, Porto',
      'Gaia, Gaia',
      'Matosinhos, Matosinhos',
      'Maia, Maia',
      'Braga, Braga',
      'Coimbra, Coimbra',
      'Faro, Faro',
      'Évora, Évora'
    ]

    return portugalAddresses.filter(addr =>
      addr.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8)
  }

  // Debounce para buscar sugestões
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value) {
        fetchSuggestions(value)
      } else {
        setSuggestions([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [value])

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleInputFocus = () => {
    if (value) {
      setShowSuggestions(true)
    }
  }

  return (
    <div className="relative" ref={suggestionsRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-green-400" />
          ) : (
            <MapPin className="h-5 w-5 text-green-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder || t('booking.pickup')}
          className="w-full pl-10 pr-20 py-4 bg-black/30 border border-green-500/30 rounded-2xl text-white placeholder-green-400/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 backdrop-blur-xl transition-all duration-300"
        />
        
        {showGPS && (
          <button
            type="button"
            onClick={onGPSClick}
            disabled={isLoading}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <div className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors duration-200 disabled:opacity-50">
              <Search className="h-4 w-4 text-green-400" />
            </div>
          </button>
        )}
      </div>

      {/* Sugestões */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-2 bg-black/90 border border-green-500/30 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-4 text-center text-green-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <p className="text-sm">A procurar...</p>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-green-500/10 transition-colors duration-200 border-b border-green-500/10 last:border-b-0"
                >
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
