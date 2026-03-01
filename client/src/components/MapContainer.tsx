import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    tomtom: any
  }
}

interface MapContainerProps {
  pickupLocation?: { lat: number; lng: number }
  dropoffLocation?: { lat: number; lng: number }
}

export default function MapContainer({ pickupLocation, dropoffLocation }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadTomTomMap = async () => {
      if (!mapRef.current || window.tomtom) return

      try {
        // Carregar SDK do TomTom
        const script = document.createElement('script')
        script.src = 'https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js'
        script.async = true
        
        script.onload = () => {
          if (window.tomtom && mapRef.current) {
            const map = window.tomtom.map({
              key: import.meta.env.VITE_TOMTOM_API_KEY || 'demo',
              container: mapRef.current,
              style: 'night',
              center: [-9.139337, 38.722252], // Lisboa
              zoom: 12
            })

            mapInstanceRef.current = map

            // Adicionar controles
            map.addControl(new window.tomtom.NavigationControl())
            map.addControl(new window.tomtom.ScaleControl())
          }
        }

        document.head.appendChild(script)
      } catch (error) {
        console.error('Erro ao carregar mapa TomTom:', error)
      }
    }

    loadTomTomMap()

    return () => {
      // Cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [])

  // Atualizar marcadores quando as localizações mudam
  useEffect(() => {
    if (!mapInstanceRef.current || !window.tomtom) return

    // Limpar marcadores existentes
    // (implementar lógica de marcadores aqui)

    if (pickupLocation) {
      new window.tomtom.Marker()
        .setLngLat([pickupLocation.lng, pickupLocation.lat])
        .addTo(mapInstanceRef.current)
    }

    if (dropoffLocation) {
      new window.tomtom.Marker()
        .setLngLat([dropoffLocation.lng, dropoffLocation.lat])
        .addTo(mapInstanceRef.current)
    }
  }, [pickupLocation, dropoffLocation])

  return (
    <div className="map-container">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ background: '#000' }}
      />
    </div>
  )
}
