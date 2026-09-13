import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const read = p => fs.readFileSync(path.join(root, p), 'utf8')
const fail = msg => { throw new Error(msg) }

for (const file of ['server/index.ts', 'server/store.ts']) {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', '--check', path.join(root, file)], {
    encoding: 'utf8'
  })
  if (result.status !== 0) fail(`${file}: TypeScript syntax check failed\n${result.stderr || result.stdout}`)
}

for (const file of ['public/index.html','public/reserva.html','public/legal.html','public/offline.html']) {
  const html = read(file)
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1])
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) fail(`${file}: duplicate ids: ${[...new Set(dupes)].join(', ')}`)

  let i = 0
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] || ''
    const body = match[2] || ''
    if (/type=["']application\/ld\+json["']/i.test(attrs)) {
      try { JSON.parse(body) } catch (error) { fail(`${file}: invalid inline JSON-LD: ${error.message}`) }
      continue
    }
    new vm.Script(body, { filename: `${file}:inline-script-${++i}` })
  }
}

for (const file of ['public/app.js','public/push-map.js','public/reserva.js','public/legal.js','public/offline.js','public/sw.js','public/brand-fix.js']) {
  new vm.Script(read(file), { filename: file })
}

const server = read('server/index.ts')
const store = read('server/store.ts')
const index = read('public/index.html')
const sw = read('public/sw.js')
const appJs = read('public/app.js')
const pushMapJs = read('public/push-map.js')

const legalJs = read('public/legal.js')
const reservaJs = read('public/reserva.js')
const offlineJs = read('public/offline.js')
if (!index.includes('id="footer-legal"') || !index.includes('id="footer-privacy"') || !index.includes('id="footer-complaints"')) fail('translatable footer links missing')
if (!appJs.includes('footerTranslations') || !appJs.includes('/legal.html?lang=${encodedLang}')) fail('footer automatic translation/language propagation missing')
if (!legalJs.includes("const SUPPORTED = ['pt', 'en', 'fr', 'es', 'de', 'it', 'zh', 'ja', 'ru', 'nl', 'pl']")) fail('legal page language coverage incomplete')
for (const lang of ['pt','en','fr','es','de','it','zh','ja','ru','nl','pl']) {
  if (!legalJs.includes(`    ${lang}: {`)) fail(`legal translation missing: ${lang}`)
  if (!reservaJs.includes(`    ${lang}: {`)) fail(`booking tracking translation missing: ${lang}`)
  if (!offlineJs.includes(`    ${lang}: {`)) fail(`offline translation missing: ${lang}`)
}
if (!read('public/legal.html').includes('id="footer-license-label"')) fail('legal footer licence label is not translatable')
if (!legalJs.includes('TomTom Search API')) fail('legal provider disclosure does not mention address-search provider')
if (!read('public/legal.html').includes('<script src="/legal.js"></script>')) fail('legal translation script not loaded')
if (!sw.includes("'/legal.js'")) fail('legal translation script not pre-cached')

if (fs.existsSync(path.join(root, 'public/driver-track.html'))) fail('GPS driver page must not exist')
for (const forbidden of ['driver_location_update', 'check_booking_status', 'driverTokenHash', 'roomForDriver']) {
  if (server.includes(forbidden)) fail(`unused GPS code remains: ${forbidden}`)
}
if ((server.match(/X-Frame-Options/g) || []).length !== 1) fail('security headers are duplicated')
if (!server.includes("Referrer-Policy', 'no-referrer")) fail('private booking URLs are not protected by no-referrer policy')
if (!server.includes("if (!authorizedTelegramChat(ctx)) return")) fail('Telegram message authorization missing')
if (!server.includes("if (!authorizedTelegramChat(ctx)) {")) fail('Telegram callback authorization missing')
if (!server.includes('BOOKING_TRANSITIONS')) fail('booking state machine missing')
if (server.includes("process.env.SUPABASE_SERVICE_ROLE_KEY ||\n  process.env.VAPID_PRIVATE_KEY")) fail('booking secret reuses unrelated secrets')
if (appJs.includes('item.innerHTML')) fail('unsafe autocomplete innerHTML remains')
if (appJs.includes("console.log('Enviando reserva")) fail('PII browser debug log remains')
if (appJs.includes('[Push] Sync on connect failed')) fail('push subscription is redundantly re-synced on every socket reconnect')
if (pushMapJs.includes('SKIP_WAITING')) fail('obsolete service-worker skip-waiting message remains')
if (!appJs.includes('accessToken: result.accessToken')) fail('booking access token is not persisted by client')
if (!appJs.includes("accessToken: currentBooking.accessToken")) fail('cancel action is not token-protected')
if ((sw.match(/addEventListener\('fetch'/g) || []).length !== 1) fail('service worker must have exactly one fetch handler')
if (sw.includes("cache.put('/index.html', copy)")) fail('service worker navigation cache regression')
if (!sw.includes("const CACHE = '691-final-20260913-home-destinations-photos-3'")) fail('final service worker cache version missing')
if (sw.includes("const CACHE = '691-v16'")) fail('obsolete service worker cache version remains')
if (!sw.includes('if (url.origin === self.location.origin)') || !sw.includes('networkFirst(request)')) fail('same-origin assets are not refreshed network-first')
if (sw.includes(".catch(() => caches.match('/offline.html'))")) fail('service worker returns HTML for failed non-navigation assets')
if (!sw.includes("'https://unpkg.com'") || !sw.includes("'https://fonts.googleapis.com'")) fail('safe runtime caching for external UI assets missing')
if (!index.includes('integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="')) fail('Leaflet CSS SRI missing')
if (!pushMapJs.includes("attribution: '&copy; OpenStreetMap contributors &copy; CARTO'")) fail('map attribution missing')

if (server.includes("process.env.PERSISTENCE_MODE")) fail('obsolete filesystem persistence mode remains')
if ((server.match(/authorizedTelegramChat\(ctx\)/g) || []).length < 2) fail('Telegram authorization coverage is incomplete')
if (!server.includes('validTelegramWebhookSecret')) fail('constant-time Telegram webhook verification missing')
if (server.includes("new Date(`${b.data}T${b.hora}:00Z`)")) fail('booking time is still being shifted as UTC')
if (!server.includes("if (digits.length === 9) digits = `351${digits}`")) fail('Portuguese WhatsApp normalization missing')
if (!server.includes('terminalBookingsToDelete')) fail('terminal bookings can resurrect after restart')
if (!server.includes("throw new Error('Persistência não configurada. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.')")) fail('persistence is not fail-fast')
if (!server.includes("if (IS_PRODUCTION && !VAPID_READY)")) fail('production VAPID is not fail-fast')
if (!server.includes("return res.status(503).json({ success: false, error: om.delivery })")) fail('Telegram delivery failure is not fail-safe')
if (appJs.includes('name: currentBooking.nome') || appJs.includes('phone: currentBooking.telefone')) fail('cancel request still sends unnecessary PII')
if (!appJs.includes('currentBooking.status = status')) fail('client status is not persisted consistently')
if (!appJs.includes("socket.on('booking_closed'")) fail('booking_closed is not handled on homepage')
if (!appJs.includes('function syncCurrentBooking()')) fail('mobile resume booking sync missing')
if (!reservaJs.includes("socket.on('booking_closed'")) fail('booking_closed is not handled on tracking page')
if (fs.existsSync(path.join(root, 'public/chat.html'))) fail('obsolete chat redirect remains')
if (!index.includes('>Informação Legal</a>')) fail('footer capitalization regressed')
if (server.includes("script-src 'self' 'unsafe-inline'")) fail('CSP still allows inline JavaScript')
if (!server.includes("script-src-attr 'none'")) fail('inline event handlers are not forbidden')
for (const file of ['public/index.html','public/reserva.html','public/legal.html','public/offline.html']) {
  if (/\son[a-z]+=/i.test(read(file))) fail(`${file}: inline event handler remains`)
}
for (const file of ['public/index.html','public/reserva.html','public/legal.html']) {
  const html = read(file)
  for (const match of html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    if (!/\brel=["'][^"']*\bnoopener\b[^"']*["']/i.test(match[0])) fail(`${file}: target=_blank without noopener`)
  }
}
const indexCss = read('public/index.css')
if (indexCss.includes('-webkit-mask-image') || indexCss.includes('mask-image: radial-gradient')) fail('cancel button mask workaround remains')
if (!indexCss.includes('-webkit-appearance: none;') || !indexCss.includes('background-clip: padding-box;')) fail('cancel button native appearance reset missing')
if (!/\.cancel-btn\s*\{[\s\S]*?border:\s*none;/m.test(indexCss)) fail('cancel button still uses a visible border')

for (const file of ['public/index.html','public/reserva.html','public/legal.html','public/offline.html']) {
  const html = read(file)
  if (/<style[\s>]/i.test(html)) fail(`${file}: inline style block remains`)
  if (/\sstyle=["']/i.test(html)) fail(`${file}: inline style attribute remains`)
}
if (server.includes("style-src 'self' 'unsafe-inline'")) fail('CSP still allows inline CSS')
if (!server.includes("style-src-attr 'unsafe-inline'")) fail('Leaflet-compatible runtime style policy missing')

if (!server.includes("Permissions-Policy', 'geolocation=(), notifications=(self), camera=(), microphone=()")) fail('geolocation permission is still enabled')
if (!server.includes("const BOOKING_ACCESS_SECRET = String(process.env.BOOKING_ACCESS_SECRET || '')")) fail('dedicated booking access secret is not mandatory')
if (!server.includes("BOOKING_ACCESS_SECRET.length < 32")) fail('booking access secret minimum length missing')
if (!server.includes("const ALLOWED_ORIGINS = new Set(['https://691.pt', 'https://www.691.pt'")) fail('691 Socket.IO origin policy regressed')
if (server.includes('reverse-geocode') || server.includes('nominatim') || appJs.includes('navigator.geolocation') || appJs.includes('setupGpsButton')) fail('unused GPS/reverse-geocoding functionality remains')
if (server.includes("console.log('Nova reserva:', bookingId, nome") || server.includes('nome, recolha, destino')) fail('PII may be present in booking logs')
if (!server.includes("pending:   new Set(['accepted', 'rejected', 'cancelled'])")) fail('pending transition set regressed')
if (!server.includes("onway:     new Set(['arrived', 'completed'])") || !server.includes("arrived:   new Set(['completed'])")) fail('client cancellation remains possible after driver departure')
if (!server.includes("completed: new Set()") || !server.includes("rejected:  new Set()") || !server.includes("cancelled: new Set()")) fail('terminal booking states are not terminal')
if (!appJs.includes("socket.timeout(10000).emit('cancel_booking'")) fail('client cancellation acknowledgement missing')
if (!server.includes('validBookingAccessToken(bookingId, accessToken)')) fail('booking access token verification missing')
if (!server.includes("Cache-Control', 'no-store, max-age=0")) fail('private booking page can be cached')
if (server.includes('clientsConnected: connectedClients.size')) fail('reservation API exposes unnecessary connection count')
if (!server.includes('validPushEndpoint(endpoint)') || !server.includes('validWebPushKey(p256dh, 65)') || !server.includes('validWebPushKey(auth, 16)')) fail('push subscription endpoint/key validation missing')
if (!appJs.includes("footerComplaints.href = `https://www.livroreclamacoes.pt/Inicio/?lang=${lang === 'pt' ? 'PT' : 'EN'}`")) fail('official complaints link language routing missing')
if (!store.includes('Supabase stale push endpoint cleanup')) fail('push endpoint uniqueness recovery missing')
for (const css of ['public/index.css','public/reserva.css','public/legal.css','public/offline.css']) {
  if (!fs.existsSync(path.join(root, css)) || !read(css).trim()) fail(`${css}: missing or empty`)
}
for (const asset of ["'/index.css'", "'/reserva.css'", "'/legal.css'", "'/offline.css'"]) {
  if (!sw.includes(asset)) fail(`service worker does not pre-cache ${asset}`)
}


// Final-release checks: SEO semantics, Waze deep links and coordinate persistence.
if (index.includes('src="/schema.json" type="application/ld+json"')) fail('JSON-LD is still loaded as an external script')
const jsonLdMatch = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
if (!jsonLdMatch) fail('inline JSON-LD missing from homepage')
try {
  const schema = JSON.parse(jsonLdMatch[1])
  if (schema['@type'] !== 'TaxiService' || schema.url !== 'https://691.pt/') fail('homepage TaxiService JSON-LD incomplete')
} catch (error) {
  fail(`homepage JSON-LD invalid: ${error.message}`)
}
if (!index.includes('class="seo-hero-title"')) fail('accessible semantic homepage H1 missing')
if ((index.match(/<h1\b/gi) || []).length !== 1) fail('homepage must expose exactly one H1')
if (!server.includes('https://waze.com/ul?ll=') || !server.includes('&navigate=yes&utm_source=691.pt')) fail('official Waze coordinate deep-link format missing')
if (server.includes('ll=${encodeURIComponent(`${directPosition.lat.toFixed(6)},${directPosition.lon.toFixed(6)}`)}&q=')) fail('Waze coordinate link still mixes q with ll')
const routeMigration = 'supabase_migration_2026-09-12_route_coords.sql'
if (!fs.existsSync(path.join(root, routeMigration))) fail('final Supabase route-coordinate migration missing')
const routeSql = read(routeMigration)
for (const col of ['recolha_lat','recolha_lon','destino_lat','destino_lon']) {
  if (!routeSql.includes(col)) fail(`route-coordinate migration missing ${col}`)
  if (!store.includes(col)) fail(`Supabase store does not persist ${col}`)
}
if (!store.includes('bookingCoordinatesSupported') || !store.includes('colunas de coordenadas ainda não disponíveis')) fail('coordinate migration backward-compatibility fallback missing')
const lock = JSON.parse(read('package-lock.json'))
const lockedVersions = {
  express: lock.packages?.['node_modules/express']?.version || '',
  qs: lock.packages?.['node_modules/qs']?.version || '',
  socketIo: lock.packages?.['node_modules/socket.io']?.version || '',
  socketParser: lock.packages?.['node_modules/socket.io-parser']?.version || '',
  engineIo: lock.packages?.['node_modules/engine.io']?.version || '',
  ws: lock.packages?.['node_modules/ws']?.version || ''
}
const expectedLockedVersions = {
  express: '4.22.2',
  qs: '6.16.0',
  socketIo: '4.8.3',
  socketParser: '4.2.7',
  engineIo: '6.6.9',
  ws: '8.21.3'
}
for (const [name, expected] of Object.entries(expectedLockedVersions)) {
  if (lockedVersions[name] !== expected) fail(`unexpected ${name} version in lockfile: ${lockedVersions[name] || 'missing'} (expected ${expected})`)
}
if (!server.includes('maxHttpBufferSize: 64 * 1024') || !server.includes('perMessageDeflate: false')) fail('Socket.IO resource limits missing')
if (!index.includes('/apple-touch-icon.png') || !read('public/manifest.json').includes('/icon-512.png')) fail('production PWA PNG icon set missing')
if (!index.includes('aria-label="Ligar +351 928 158 158"') || !index.includes('aria-label="WhatsApp +351 928 158 158"')) fail('icon-only contact links need accessible labels')
if (!appJs.includes("input.setAttribute('role', 'combobox')") || !appJs.includes("autocompleteContainer.setAttribute('role', 'listbox')")) fail('autocomplete ARIA combobox/listbox semantics missing')
if (index.includes('id="recolha-autocomplete"') || index.includes('id="destino-autocomplete"')) fail('obsolete empty autocomplete containers remain')

for (const file of ['public/index.html','public/reserva.html','public/legal.html','public/offline.html','public/taxi-lisboa/index.html','public/taxi-aeroporto-lisboa/index.html','public/lisbon-airport-taxi/index.html','public/viagens-portugal/index.html']) {
  const html = read(file)
  if (!html.includes('/brand-fix.css') || !html.includes('/brand-fix.js')) fail(`${file}: global 691.pt optical brand fix missing`)
}
const brandFixCss = read('public/brand-fix.css')
const brandFixJs = read('public/brand-fix.js')
if (!brandFixCss.includes('.brand-optical-suffix') || !brandFixCss.includes('margin-left: -0.07em')) fail('global 691.pt optical kerning CSS missing')
if (!brandFixJs.includes('const BRAND_RE = /691\\s*\\.pt/g')) fail('global 691.pt text normalization missing')
if (!sw.includes("'/brand-fix.css'") || !sw.includes("'/brand-fix.js'")) fail('service worker does not pre-cache brand optical fix assets')

console.log('691 static audit: OK')

for (const file of ['public/robots.txt','public/sitemap.xml','public/schema.json','public/landing.css']) {
  if (!fs.existsSync(path.join(root, file)) || !read(file).trim()) fail(`${file}: SEO asset missing or empty`)
}
for (const dir of ['taxi-lisboa','taxi-aeroporto-lisboa','lisbon-airport-taxi','viagens-portugal']) {
  const file = `public/${dir}/index.html`
  const html = read(file)
  if (!/<title>[^<]+<\/title>/.test(html) || !html.includes('name="description"') || !html.includes('rel="canonical"')) fail(`${file}: SEO metadata incomplete`)
}
if (!index.includes('691 Táxi Lisboa | Reserva Direta Online')) fail('homepage SEO title missing')
if (!appJs.includes("get('src')") || !server.includes("const source   = sanitize(raw.source || 'direct', 80)")) fail('booking source attribution missing')
