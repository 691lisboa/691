import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '..', 'public')
const PORT = Number(process.env.PORT || 5000)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
}
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.txt', '.svg'])

// Redirecionamentos permanentes de URLs antigas
const REDIRECTS = new Map([
  ['/lisbon-airport-taxi', '/en/lisbon-airport-taxi/'],
  ['/manifest.json', '/manifest.webmanifest'],
  ['/index.html', '/'],
  ['/legal', '/legal.html'],
  ['/en/legal', '/en/legal.html']
])

const CSP = [
  "default-src 'self'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'", "object-src 'none'",
  "script-src 'self'", "script-src-attr 'none'", "style-src 'self'", "img-src 'self' data:", "font-src 'self'",
  "connect-src 'self'", "worker-src 'self'", "manifest-src 'self'", 'upgrade-insecure-requests'
].join('; ')

function baseHeaders(ext) {
  const h = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': ['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext) ? 'cross-origin' : 'same-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Vary': 'Accept-Encoding'
  }
  if (ext === '.html') h['Content-Security-Policy'] = CSP
  return h
}

function cacheControl(ext, pathname, search) {
  if (ext === '.html') return 'public, max-age=0, must-revalidate'
  if (pathname === '/sw.js') return 'no-cache'
  if (pathname === '/manifest.webmanifest' || pathname === '/sitemap.xml' || pathname === '/robots.txt') return 'public, max-age=3600'
  if (ext === '.woff2' || /[?&]v=[0-9a-f]+/.test(search)) return 'public, max-age=31536000, immutable'
  if (['.webp', '.jpg', '.jpeg', '.png', '.svg'].includes(ext)) return 'public, max-age=86400, stale-while-revalidate=604800'
  return 'public, max-age=3600'
}

// Cache em memória (o site é pequeno): conteúdo, ETag e variantes comprimidas
const cache = new Map()
function load(file) {
  const stat = fs.statSync(file)
  const hit = cache.get(file)
  if (hit && hit.mtime === stat.mtimeMs) return hit
  const body = fs.readFileSync(file)
  const ext = path.extname(file).toLowerCase()
  const entry = { mtime: stat.mtimeMs, body, etag: `"${crypto.createHash('sha1').update(body).digest('base64url').slice(0, 20)}"`, ext }
  if (COMPRESSIBLE.has(ext) && body.length > 512) {
    entry.br = zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } })
    entry.gz = zlib.gzipSync(body, { level: 9 })
  }
  cache.set(file, entry)
  return entry
}

function safePath(urlPath) {
  let decoded
  try { decoded = decodeURIComponent(urlPath) } catch { return null }
  if (decoded.includes('\0')) return null
  const target = path.resolve(publicDir, '.' + decoded.replace(/\\/g, '/'))
  if (target !== publicDir && !target.startsWith(publicDir + path.sep)) return null
  return target
}

function resolveFile(pathname) {
  const target = safePath(pathname)
  if (!target) return null
  try {
    const st = fs.statSync(target)
    if (st.isFile()) return target
    if (st.isDirectory()) {
      const index = path.join(target, 'index.html')
      if (fs.existsSync(index)) return index
    }
  } catch { /* ignora */ }
  return null
}

function send(req, res, status, file, { pathname = '', search = '' } = {}) {
  let entry
  try { entry = load(file) } catch { res.writeHead(500); return res.end('Internal error') }
  const headers = baseHeaders(entry.ext)
  headers['Cache-Control'] = status === 200 ? cacheControl(entry.ext, pathname, search) : 'no-cache'
  if (status === 200) headers.ETag = entry.etag
  if (status === 200 && req.headers['if-none-match'] === entry.etag) { res.writeHead(304, headers); return res.end() }
  let body = entry.body
  const accept = String(req.headers['accept-encoding'] || '')
  if (entry.br && /\bbr\b/.test(accept)) { body = entry.br; headers['Content-Encoding'] = 'br' }
  else if (entry.gz && /\bgzip\b/.test(accept)) { body = entry.gz; headers['Content-Encoding'] = 'gzip' }
  headers['Content-Length'] = body.length
  res.writeHead(status, headers)
  res.end(req.method === 'HEAD' ? undefined : body)
}

function notFound(req, res, pathname) {
  const file = path.join(publicDir, pathname.startsWith('/en/') ? 'en/404.html' : '404.html')
  if (fs.existsSync(file)) return send(req, res, 404, file)
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Not found')
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('Method Not Allowed')
  }
  const u = new URL(req.url || '/', 'http://localhost')
  const pathname = u.pathname

  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
    return res.end(req.method === 'HEAD' ? undefined : '{"ok":true}')
  }

  const trimmed = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  const redirect = REDIRECTS.get(trimmed)
  if (redirect) { res.writeHead(301, { Location: redirect + u.search, 'Cache-Control': 'public, max-age=86400' }); return res.end() }

  const file = resolveFile(pathname)
  if (!file) return notFound(req, res, pathname)

  // Diretórios sem barra final → com barra (mantém URLs canónicos)
  if (!pathname.endsWith('/') && path.basename(file) === 'index.html' && !path.extname(pathname)) {
    res.writeHead(301, { Location: pathname + '/' + u.search, 'Cache-Control': 'public, max-age=86400' })
    return res.end()
  }
  // 404.html e offline.html nunca devem ser servidos como páginas normais indexáveis (mantêm noindex), mas são acessíveis
  send(req, res, 200, file, { pathname, search: u.search })
})

server.listen(PORT, '0.0.0.0', () => console.log(`691.pt a correr na porta ${PORT}`))
