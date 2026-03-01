const CACHE_NAME = '691-taxi-v1'
const STATIC_CACHE_NAME = '691-taxi-static-v1'
const DYNAMIC_CACHE_NAME = '691-taxi-dynamic-v1'

// URLs para cache estático
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Adicionar outros recursos estáticos conforme necessário
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Estratégia: Cache First para recursos estáticos
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.url.includes('/icons/')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response
          }
          
          // Se não está no cache, buscar da rede e cachear
          return fetch(request)
            .then((response) => {
              // Verificar se resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response
              }
              
              // Clonar resposta para cachear
              const responseToCache = response.clone()
              
              caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache)
                })
              
              return response
            })
        })
    )
    return
  }
  
  // Estratégia: Network First para API e requisições dinâmicas
  if (request.url.includes('/api/') || request.url.includes('/socket.io/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Se sucesso, cachear resposta
          if (response.ok) {
            const responseToCache = response.clone()
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache)
              })
          }
          return response
        })
        .catch(() => {
          // Se falhar rede, tentar cache
          return caches.match(request)
        })
    )
    return
  }
  
  // Estratégia: Network First para navegação
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear páginas navegadas
          const responseToCache = response.clone()
          caches.open(DYNAMIC_CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache)
            })
          return response
        })
        .catch(() => {
          // Se offline, servir página do cache ou fallback
          return caches.match(request)
            .then((response) => {
              return response || caches.match('/')
            })
        })
    )
    return
  }
  
  // Para outras requisições, tentar cache primeiro
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request)
      })
  )
})

// Background Sync para mensagens offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Implementar sincronização de mensagens offline
  console.log('Background sync for messages')
  
  // Obter mensagens offline do IndexedDB
  // Enviar para servidor quando online
  // Limpar mensagens enviadas
}

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização da 691 Taxi',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/xmark.png'
      }
    ],
    silent: false,
    requireInteraction: true,
    tag: '691-taxi-notification'
  }
  
  event.waitUntil(
    self.registration.showNotification('691 Taxi', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    // Abrir app na página relevante
    event.waitUntil(
      clients.openWindow('/?trip=latest')
    )
  } else if (event.action === 'close') {
    // Apenas fechar notificação
    return
  } else {
    // Ação padrão: abrir app
    event.waitUntil(
      clients.matchAll()
        .then((clientList) => {
          // Se já há uma janela aberta, focar nela
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus()
            }
          }
          // Senão, abrir nova janela
          if (clients.openWindow) {
            return clients.openWindow('/')
          }
        })
    )
  }
})

// Message handling (para comunicação com o app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Notificar app sobre atualização de cache
    event.ports[0].postMessage({ type: 'CACHE_UPDATED' })
  }
})

// Cleanup de cache antigo
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
    )
  }
})
