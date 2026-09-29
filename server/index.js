import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, '..', 'public')
const PORT = Number(process.env.PORT || 5000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
}

function headers(res, contentType) {
  res.setHeader('Content-Type', contentType)
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), notifications=(), camera=(), microphone=()')
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' https://fonts.googleapis.com",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'"
  ].join('; '))
}

function safePath(urlPath) {
  let decoded
  try { decoded = decodeURIComponent(urlPath) } catch { return null }
  const clean = decoded.split('?')[0].replace(/\\/g, '/')
  const target = path.resolve(publicDir, `.${clean}`)
  if (target !== publicDir && !target.startsWith(`${publicDir}${path.sep}`)) return null
  return target
}

function sendFile(res, filePath) {
  fs.stat(filePath, (error, stat) => {
    if (error || !stat.isFile()) return send404(res)
    const ext = path.extname(filePath).toLowerCase()
    headers(res, MIME[ext] || 'application/octet-stream')
    res.setHeader('Cache-Control', ext === '.html' ? 'public, max-age=300' : 'public, max-age=3600')
    fs.createReadStream(filePath).pipe(res)
  })
}

function send404(res) {
  const offline = path.join(publicDir, 'offline.html')
  fs.readFile(offline, (error, data) => {
    res.statusCode = 404
    headers(res, 'text/html; charset=utf-8')
    if (error) return res.end('Not found')
    res.end(data)
  })
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    return res.end('Method Not Allowed')
  }

  const pathname = new URL(req.url || '/', 'http://localhost').pathname
  if (pathname === '/health') {
    headers(res, 'application/json; charset=utf-8')
    return res.end(JSON.stringify({ ok: true }))
  }

  let target = safePath(pathname)
  if (!target) return send404(res)

  fs.stat(target, (error, stat) => {
    if (!error && stat.isDirectory()) target = path.join(target, 'index.html')
    if (error && pathname.endsWith('/')) target = path.join(target, 'index.html')
    if (req.method === 'HEAD') {
      fs.stat(target, (headError, headStat) => {
        if (headError || !headStat.isFile()) return send404(res)
        headers(res, MIME[path.extname(target).toLowerCase()] || 'application/octet-stream')
        res.setHeader('Content-Length', headStat.size)
        res.end()
      })
      return
    }
    sendFile(res, target)
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`691.pt WhatsApp site running on port ${PORT}`)
})
