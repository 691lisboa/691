const CACHE = '691-final-20260913-home-destinations-photos-3'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/premium.css',
  '/brand-fix.css',
  '/brand-fix.js',
  '/app.js',
  '/push-map.js',
  '/marketing.js',
  '/addresses.js',
  '/assets/taxi-691.webp',
  '/assets/destinations/lisboa.webp',
  '/assets/destinations/sintra.webp',
  '/assets/destinations/fatima.webp',
  '/assets/destinations/evora.webp',
  '/offline.html',
  '/offline.css',
  '/offline.js',
  '/legal.html',
  '/legal.css',
  '/legal.js',
  '/reserva.css',
  '/reserva.js',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE)
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    throw new Error('network-and-cache-miss')
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    url.pathname.startsWith('/reserva/')
  ) {
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await networkFirst(request)
      } catch {
        if (url.pathname === '/' || url.pathname === '/index.html') {
          const home = await caches.match('/index.html')
          if (home) return home
        }
        return (await caches.match('/offline.html')) || Response.error()
      }
    })())
    return
  }

  // Local assets are network-first so a new deploy is visible immediately.
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request).catch(() => Response.error()))
    return
  }

  // Versioned third-party UI/font assets are safe to cache-first.
  const runtimeCacheOrigins = new Set([
    'https://unpkg.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ])

  if (runtimeCacheOrigins.has(url.origin)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          void caches.open(CACHE).then((cache) => cache.put(request, copy))
        }
        return response
      })).catch(() => Response.error())
    )
  }
})

// Web Push notifications
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = {}
    try {
      payload = event.data ? event.data.json() : {}
    } catch {
      payload = { title: '691 Lisboa', body: event.data ? event.data.text() : '' }
    }

    const title = payload.title || '691 Lisboa'
    const body = payload.body || ''
    const data = payload.data || {}

    await self.registration.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: data.bookingId ? `691-${data.bookingId}` : '691-status',
      renotify: true,
      data
    })

    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    for (const client of windows) {
      client.postMessage({ type: 'PUSH_STATUS', data })
    }
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    for (const client of windows) {
      if ('focus' in client) {
        await client.focus()
        return
      }
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow('/')
    }
  })())
})
