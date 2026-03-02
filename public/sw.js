const CACHE = '691-v2'
const OFFLINE = '/offline.html'

const PRECACHE = [
  '/',
  '/index.html',
  '/addresses.js',
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
