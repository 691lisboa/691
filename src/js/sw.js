/* Service worker 691.pt — gerado por scripts/build.mjs (não editar a versão à mão) */
const VERSION = '__VERSION__'
const CORE = __CORE__
const PAGES = `pages-${VERSION}`
const ASSETS = `assets-${VERSION}`

self.addEventListener('install', event => {
  event.waitUntil(caches.open(ASSETS).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== PAGES && k !== ASSETS).map(k => caches.delete(k)))
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
    await self.clients.claim()
  })())
})

const offlineFor = url => (new URL(url).pathname.startsWith('/en/') ? '/en/offline.html' : '/offline.html')

async function pageStrategy(event) {
  const { request } = event
  try {
    const preload = await event.preloadResponse
    const response = preload || await fetch(request)
    if (response && response.ok) {
      const copy = response.clone()
      event.waitUntil(caches.open(PAGES).then(c => c.put(request, copy)))
    }
    return response
  } catch {
    return (await caches.match(request)) || (await caches.match(offlineFor(request.url))) || Response.error()
  }
}

async function assetStrategy(event) {
  const { request } = event
  const cached = await caches.match(request)
  const network = fetch(request).then(response => {
    if (response && response.ok && response.type === 'basic') {
      const copy = response.clone()
      event.waitUntil(caches.open(ASSETS).then(c => c.put(request, copy)))
    }
    return response
  }).catch(() => null)
  if (cached) { event.waitUntil(network); return cached }
  return (await network) || Response.error()
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname === '/sw.js' || url.pathname === '/health') return
  if (request.mode === 'navigate') { event.respondWith(pageStrategy(event)); return }
  event.respondWith(assetStrategy(event))
})
