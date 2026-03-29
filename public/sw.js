const CACHE = '691-v7'
const OFFLINE = '/offline.html'

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
  OFFLINE
]

// Install: pre-cache shell assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

// Activate: remove old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

// Fetch strategy:
//  - socket.io / api  → network only (never cache)
//  - navigation       → network first → cache → offline.html
//  - assets           → cache first → network
self.addEventListener('fetch', (e) => {
  const url = e.request.url

  // Skip non-GET and cross-origin
  if (e.request.method !== 'GET') return
  if (!url.startsWith(self.location.origin)) return

  // Never cache socket.io or API calls
  if (url.includes('/socket.io/') || url.includes('/api/')) return

  if (e.request.mode === 'navigate') {
    // Avoid caching tracking page navigations to prevent stale versions
    try {
      const p = new URL(url).pathname
      if (p.startsWith('/reserva/')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)))
        return
      }
    } catch { /* ignore */ }
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
          return res
        })
        .catch(() =>
          caches.match(e.request)
            .then(cached => cached || caches.match(OFFLINE))
        )
    )
    return
  }

  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, clone))
        }
        return res
      }).catch(() => caches.match(OFFLINE))
    })
  )
})

// SKIP_WAITING message from app
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// ── Web Push ──────────────────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
  let payload = {}
  try { payload = e.data?.json() ?? {} } catch { payload = { title: '691 Lisboa', body: e.data?.text() || '' } }
  const title = payload.title || '691 Lisboa'
  const type  = payload.data?.type || ''
  
  // Base notification options - make them persistent and visual
  const options = {
    body:               payload.body || '',
    icon:               '/icon.svg',
    badge:              '/icon.svg',
    data:               payload.data || {},
    vibrate:            [200, 100, 200, 100, 200],
    requireInteraction: true, // Notification stays until user interacts
    tag:                payload.data?.bookingId || '691',
    silent:             false,
    // Make notification persistent on mobile
    sticky:             true,  // Firefox
    priority:           1      // High priority
  }
  
  // Add action buttons based on notification type
  if (type === 'onway') {
    options.actions = [
      { action: 'open', title: '🚕 Ver Reserva' }
    ]
  } else if (type === 'accepted') {
    options.actions = [
      { action: 'open', title: '🚕 Ver Reserva' }
    ]
  } else if (type === 'arrived') {
    options.actions = [
      { action: 'open', title: '📍 Ver Localização' }
    ]
  } else if (type === 'completed') {
    options.actions = [
      { action: 'open', title: '✅ Nova Reserva' }
    ]
  }
  
  e.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (e) => {
  const pushData = e.notification.data || {}
  const action = e.action
  e.notification.close()
  
  // Handle action button clicks
  if (action === 'open' || action === '') {
    e.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
        const existing = list.find(c => c.url.startsWith(self.location.origin))
        if (existing && 'focus' in existing) {
          existing.focus()
          existing.postMessage({ type: 'PUSH_STATUS', data: pushData })
          return
        }
        return clients.openWindow('/').then(w => {
          // Window just opened — postMessage after a brief delay for app to initialise
          if (w) setTimeout(() => w.postMessage({ type: 'PUSH_STATUS', data: pushData }), 1500)
        })
      })
    )
  }
})
