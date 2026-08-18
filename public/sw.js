const CACHE = '691-v10'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html'
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
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then(cache => cache.put('/index.html', copy))
          }
          return response
        })
        .catch(() =>
          caches.match('/index.html').then(
            cached => cached || caches.match('/offline.html')
          )
        )
    )
    return
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request).then(response => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone()
          caches.open(CACHE).then(cache => cache.put(request, copy))
        }
        return response
      }))
      .catch(() => caches.match('/offline.html'))
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
