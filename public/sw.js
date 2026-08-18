const CACHE = '691-v16'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/offline.html',
  '/offline.css',
  '/legal.html',
  '/legal.css',
  '/legal.js',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  '/app.js',
  '/reserva.js',
  '/reserva.css',
  '/push-map.js',
  '/offline.js'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  )
})

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
        const response = await fetch(request)
        if (response.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE)
          await cache.put(request, response.clone())
          if (url.pathname === '/' || url.pathname === '/index.html') {
            await cache.put('/index.html', response.clone())
          }
        }
        return response
      } catch {
        const exact = await caches.match(request)
        if (exact) return exact
        if (url.pathname === '/' || url.pathname === '/index.html') {
          const home = await caches.match('/index.html')
          if (home) return home
        }
        return (await caches.match('/offline.html')) || Response.error()
      }
    })())
    return
  }

  const runtimeCacheOrigins = new Set([
    self.location.origin,
    'https://unpkg.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ])

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        if (response.ok && runtimeCacheOrigins.has(url.origin)) {
          const copy = response.clone()
          void caches.open(CACHE).then(cache => cache.put(request, copy))
        }
        return response
      }))
      // Offline HTML is only valid for navigation requests. Returning it for a
      // failed JS/CSS/font request would produce MIME/syntax errors.
      .catch(() => Response.error())
  )
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

    // Update an already-open client immediately as well.
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
