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
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    new vm.Script(match[1], { filename: `${file}:inline-script-${++i}` })
  }
}

for (const file of ['public/app.js','public/push-map.js','public/reserva.js','public/legal.js','public/offline.js','public/sw.js']) {
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
if (!sw.includes("const CACHE = '691-v15'")) fail('service worker cache version not bumped')
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

console.log('691 static audit: OK')
