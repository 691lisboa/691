interface RouteRequest {
  pickup: string
  dropoff: string
}

interface RouteResponse {
  distance: number
  duration: number
  price: number
  coordinates: {
    pickup: { lat: number; lng: number }
    dropoff: { lat: number; lng: number }
  }
}

class RoutingService {
  private readonly BASE_PRICE = 3.25 // €3.25 base
  private readonly PRICE_PER_KM = 0.90 // €0.90 por km
  private readonly TOMTOM_API_KEY = process.env.VITE_TOMTOM_API_KEY

  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    try {
      // Se não tiver API key, usar mock
      if (!this.TOMTOM_API_KEY || this.TOMTOM_API_KEY === 'demo') {
        return this.mockRouteCalculation(request)
      }

      // Geocoding para obter coordenadas
      const pickupCoords = await this.geocodeAddress(request.pickup)
      const dropoffCoords = await this.geocodeAddress(request.dropoff)

      // Calcular rota com TomTom
      const routeData = await this.getTomTomRoute(pickupCoords, dropoffCoords)

      // Calcular preço
      const price = this.calculatePrice(routeData.distanceInMeters)

      return {
        distance: routeData.distanceInMeters / 1000, // Converter para km
        duration: routeData.travelTimeInSeconds,
        price,
        coordinates: {
          pickup: pickupCoords,
          dropoff: dropoffCoords
        }
      }

    } catch (error) {
      console.error('Erro ao calcular rota:', error)
      return this.mockRouteCalculation(request)
    }
  }

  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(address)}.json?key=${this.TOMTOM_API_KEY}&limit=1`
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()
      const result = data.results[0]

      if (!result) {
        throw new Error('Address not found')
      }

      return {
        lat: result.position.lat,
        lng: result.position.lon
      }

    } catch (error) {
      console.error('Erro no geocoding:', error)
      // Retornar coordenadas de Lisboa como fallback
      return { lat: 38.722252, lng: -9.139337 }
    }
  }

  private async getTomTomRoute(
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number }
  ): Promise<{ distanceInMeters: number; travelTimeInSeconds: number }> {
    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${pickup.lat},${pickup.lng}:${dropoff.lat},${dropoff.lng}/json?key=${this.TOMTOM_API_KEY}&traffic=true`
      )

      if (!response.ok) {
        throw new Error('Route calculation failed')
      }

      const data = await response.json()
      const route = data.routes[0]

      if (!route) {
        throw new Error('No route found')
      }

      return {
        distanceInMeters: route.summary.lengthInMeters,
        travelTimeInSeconds: route.summary.travelTimeInSeconds
      }

    } catch (error) {
      console.error('Erro ao calcular rota TomTom:', error)
      throw error
    }
  }

  private calculatePrice(distanceInMeters: number): number {
    const distanceInKm = distanceInMeters / 1000
    const calculatedPrice = this.BASE_PRICE + (distanceInKm * this.PRICE_PER_KM)
    
    // Arredondar para 2 casas decimais
    return Math.round(calculatedPrice * 100) / 100
  }

  private mockRouteCalculation(request: RouteRequest): RouteResponse {
    // Simulação de cálculo de rota para desenvolvimento/teste
    const mockDistance = Math.random() * 20 + 5 // 5-25 km
    const mockDuration = mockDistance * 3 * 60 // 3 minutos por km em média
    const mockPrice = this.calculatePrice(mockDistance * 1000)

    // Coordenadas simuladas em Lisboa
    const pickupCoords = {
      lat: 38.722252 + (Math.random() - 0.5) * 0.1,
      lng: -9.139337 + (Math.random() - 0.5) * 0.1
    }

    const dropoffCoords = {
      lat: 38.722252 + (Math.random() - 0.5) * 0.1,
      lng: -9.139337 + (Math.random() - 0.5) * 0.1
    }

    return {
      distance: mockDistance,
      duration: mockDuration,
      price: mockPrice,
      coordinates: {
        pickup: pickupCoords,
        dropoff: dropoffCoords
      }
    }
  }

  // Método para estimar preço sem coordenadas exatas
  async estimatePrice(pickup: string, dropoff: string): Promise<number> {
    const route = await this.calculateRoute({ pickup, dropoff })
    return route.price
  }

  // Método para obter sugestões de autocomplete
  async getAddressSuggestions(query: string): Promise<string[]> {
    if (!this.TOMTOM_API_KEY || this.TOMTOM_API_KEY === 'demo') {
      return this.mockAddressSuggestions(query)
    }

    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${this.TOMTOM_API_KEY}&limit=5&typeahead=true`
      )

      if (!response.ok) {
        throw new Error('Address suggestions failed')
      }

      const data = await response.json()
      return data.results.map((result: any) => result.address.freeformAddress)

    } catch (error) {
      console.error('Erro ao obter sugestões:', error)
      return this.mockAddressSuggestions(query)
    }
  }

  private mockAddressSuggestions(query: string): string[] {
    // Sugestões simuladas para Lisboa
    const mockSuggestions = [
      'Avenida da Liberdade, Lisboa',
      'Praça do Comércio, Lisboa',
      'Rua Augusta, Lisboa',
      'Chiado, Lisboa',
      'Bairro Alto, Lisboa',
      'Alfama, Lisboa',
      'Belém, Lisboa',
      'Parque das Nações, Lisboa',
      'Cais do Sodré, Lisboa',
      'Marquês de Pombal, Lisboa'
    ]

    return mockSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
  }
}

export const routingService = new RoutingService()
export default routingService
