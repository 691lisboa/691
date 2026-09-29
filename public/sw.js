const CACHE = '691-whatsapp-final-20260929-2'

const STATIC_ASSETS = [
  '/', '/index.html', '/site.css', '/brand-fix.js', '/marketing.js',
  '/landing-site.css', '/landing-auto.js', '/destination-page.js',
  '/taxi-lisboa/', '/taxi-aeroporto-lisboa/', '/lisbon-airport-taxi/',
  '/viagens-portugal/', '/viagens-portugal/sintra/', '/viagens-portugal/fatima/',
  '/viagens-portugal/nazare/', '/viagens-portugal/porto/', '/viagens-portugal/evora/',
  '/assets/taxi-691.webp', '/assets/taxi-691-mobile.webp',
  '/assets/destinations/lisboa.webp', '/assets/destinations/lisboa-mobile.webp',
  '/assets/destinations/sintra.webp', '/assets/destinations/sintra-mobile.webp',
  '/assets/destinations/fatima.webp', '/assets/destinations/fatima-mobile.webp',
  '/assets/destinations/nazare.webp', '/assets/destinations/nazare-mobile.webp',
  '/assets/destinations/porto.webp', '/assets/destinations/porto-mobile.webp',
  '/assets/destinations/evora.webp', '/assets/destinations/evora-mobile.webp',
  '/offline.html', '/offline.css', '/offline.js', '/legal.html', '/legal.css',
  '/legal.js', '/manifest.json', '/favicon.svg', '/icon.svg', '/icon-192.png',
  '/icon-512.png', '/apple-touch-icon.png'
]

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()))
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

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await networkFirst(request) }
      catch { return (await caches.match('/index.html')) || (await caches.match('/offline.html')) || Response.error() }
    })())
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request).catch(() => Response.error()))
    return
  }

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) void caches.open(CACHE).then(cache => cache.put(request, response.clone()))
      return response
    })).catch(() => Response.error()))
  }
})
