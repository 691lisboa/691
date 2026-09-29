import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const fail = msg => { throw new Error(msg) }

const serverCheck = spawnSync(process.execPath, ['--check', path.join(root, 'server/index.js')], { encoding: 'utf8' })
if (serverCheck.status !== 0) fail(`server/index.js: syntax check failed\n${serverCheck.stderr || serverCheck.stdout}`)

for (const file of ['public/index.html', 'public/legal.html', 'public/offline.html']) {
  const html = read(file)
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1])
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length) fail(`${file}: duplicate ids: ${[...new Set(dupes)].join(', ')}`)
  let i = 0
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] || ''
    const body = match[2] || ''
    if (/type=["']application\/ld\+json["']/i.test(attrs)) {
      try { JSON.parse(body) } catch (error) { fail(`${file}: invalid JSON-LD: ${error.message}`) }
    } else {
      try { new vm.Script(body, { filename: `${file}:inline-${++i}` }) } catch (error) { fail(`${file}: inline script failed\n${error.message}`) }
    }
  }
}

for (const file of ['public/legal.js','public/offline.js','public/sw.js','public/brand-fix.js','public/marketing.js','public/landing-auto.js','public/destination-page.js']) {
  try { new vm.Script(read(file), { filename: file }) } catch (error) { fail(`${file}: JavaScript syntax check failed\n${error.message}`) }
}

const index = read('public/index.html')
const server = read('server/index.js')
const sw = read('public/sw.js')
const packageJson = JSON.parse(read('package.json'))

if (!index.includes('id="footer-legal"') || !index.includes('id="footer-privacy"') || !index.includes('id="footer-complaints"')) fail('footer legal links missing')
if (!index.includes('data-whatsapp-cta="hero"') || !index.includes('Reservar pelo WhatsApp')) fail('WhatsApp hero CTA missing')
if (index.includes('/app.js') || index.includes('/socket.io/socket.io.js')) fail('obsolete runtime script remains on homepage')
if (index.includes('booking-window') || index.includes('submit-btn') || index.includes('form-group')) fail('online booking form remains on homepage')
if (index.includes('#reservar') || index.includes('Reservar Táxi')) fail('legacy reservation CTA remains on homepage')
if (index.includes('/push-map.js') || index.includes('leaflet@1.9.4')) fail('obsolete map assets remain')
if (server.includes('telegram') || server.includes('supabase') || server.includes('socket.io') || server.includes('web-push')) fail('legacy backend integration remains')
if (server.includes('BOOKING_ACCESS_SECRET') || server.includes('VAPID') || server.includes('booking')) fail('legacy booking backend logic remains')
if (!server.includes('http.createServer')) fail('static site server missing')
if (!server.includes("pathname === '/health'")) fail('health endpoint missing')
if (!sw.includes("const CACHE = '691-whatsapp-final-20260929-3'")) fail('service worker cache version missing')
if (sw.includes('push') || sw.includes('notification') || sw.includes('/api/') || sw.includes('/socket.io/')) fail('service worker contains obsolete backend/push logic')
if (!sw.includes('networkFirst')) fail('service worker network-first strategy missing')
if (packageJson.dependencies && Object.keys(packageJson.dependencies).length) fail('runtime dependencies remain')
if (packageJson.scripts.start !== 'node server/index.js') fail('start command is not the minimal static server')
for (const obsolete of ['server/store.ts','supabase_schema.sql','supabase_migration_2026-08-17.sql','supabase_migration_2026-08-18_hardening.sql','supabase_migration_2026-09-12_route_coords.sql']) {
  if (fs.existsSync(path.join(root, obsolete))) fail(`obsolete file remains: ${obsolete}`)
}

console.log('691 WhatsApp-only audit: OK')
