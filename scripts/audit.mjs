#!/usr/bin/env node
// Auditoria estática do site gerado (public/). Falha (exit 1) se encontrar qualquer problema.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SITE, ROUTES, DEST_KEYS } from '../content/site.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUB = path.join(ROOT, 'public')
const errors = []
const fail = (file, msg) => errors.push(`${file}: ${msg}`)
const read = f => fs.readFileSync(path.join(PUB, f), 'utf8')

const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
const files = walk(PUB).map(f => path.relative(PUB, f).replace(/\\/g, '/'))
const htmlFiles = files.filter(f => f.endsWith('.html'))

// ficheiros de destino de um URL interno
const exists = href => {
  const p = href.split('#')[0].split('?')[0]
  if (!p) return true
  const rel = p.replace(/^\//, '')
  if (!rel) return files.includes('index.html')
  if (p.endsWith('/')) return files.includes(rel + 'index.html')
  return files.includes(rel)
}

// sintaxe do servidor e JS
for (const f of ['server/index.js', 'scripts/build.mjs']) {
  const r = spawnSync(process.execPath, ['--check', path.join(ROOT, f)], { encoding: 'utf8' })
  if (r.status !== 0) fail(f, 'erro de sintaxe\n' + r.stderr)
}
for (const f of ['site.js', 'sw.js']) { try { new vm.Script(read(f), { filename: f }) } catch (e) { fail(f, 'JS inválido: ' + e.message) } }
if (/__VERSION__|__CORE__/.test(read('sw.js'))) fail('sw.js', 'placeholders por substituir')
if (/!important/.test(read('site.css'))) fail('site.css', 'contém !important')
if (read('site.css').length > 30000) fail('site.css', 'CSS demasiado grande (>30 KB)')

// manifest, robots, sitemap
let manifest
try { manifest = JSON.parse(read('manifest.webmanifest')) } catch (e) { fail('manifest.webmanifest', e.message) }
for (const i of manifest?.icons || []) if (!exists(i.src)) fail('manifest.webmanifest', `ícone em falta ${i.src}`)
const sitemap = read('sitemap.xml')
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
const expected = ['pt', 'en'].flatMap(l => ['home', 'airport', 'lisbon', 'portugal', ...DEST_KEYS].map(k => SITE.origin + ROUTES[l][k]))
for (const u of expected) if (!locs.includes(u)) fail('sitemap.xml', `falta ${u}`)
for (const u of locs) if (!exists(u.replace(SITE.origin, ''))) fail('sitemap.xml', `URL sem ficheiro ${u}`)
if (!read('robots.txt').includes('Sitemap: ' + SITE.origin + '/sitemap.xml')) fail('robots.txt', 'sem sitemap')

const titles = new Map(), descs = new Map()
for (const f of htmlFiles) {
  const html = read(f)
  const lang = (html.match(/<html lang="([^"]+)"/) || [])[1]
  if (!lang) fail(f, 'sem lang')
  if (!/<meta name="viewport"/.test(html)) fail(f, 'sem viewport')
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1]
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1]
  if (!title) fail(f, 'sem <title>')
  if (!desc) fail(f, 'sem description')
  const indexable = !/noindex/.test(html)
  if (indexable) {
    if (title.length > 75) fail(f, `title longo (${title.length})`)
    if (desc.length < 70 || desc.length > 170) fail(f, `description com ${desc.length} caracteres`)
    if (titles.has(title)) fail(f, `title duplicado de ${titles.get(title)}`); titles.set(title, f)
    if (descs.has(desc)) fail(f, `description duplicada de ${descs.get(desc)}`); descs.set(desc, f)
    if (!/<link rel="canonical" href="https:\/\/691\.pt\//.test(html)) fail(f, 'canonical em falta')
    if (!/hreflang="pt-PT"/.test(html) || !/hreflang="en"/.test(html) || !/hreflang="x-default"/.test(html)) fail(f, 'hreflang incompleto')
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:locale']) if (!html.includes(`property="${p}"`)) fail(f, `falta ${p}`)
    if (!html.includes('name="twitter:card" content="summary_large_image"')) fail(f, 'twitter:card')
    const og = (html.match(/property="og:image" content="([^"]+)"/) || [])[1]
    if (og && !exists(og.replace(SITE.origin, ''))) fail(f, `og:image inexistente ${og}`)
  }
  // estrutura
  const h1 = html.match(/<h1[\s>]/g) || []
  if (h1.length !== 1) fail(f, `${h1.length} <h1>`)
  let last = 0
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) { const n = +m[1]; if (last && n > last + 1) fail(f, `salto de títulos h${last}→h${n}`); last = n }
  if (!html.includes('id="main"')) fail(f, 'sem #main')
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dup.length) fail(f, `ids duplicados: ${[...new Set(dup)].join(', ')}`)
  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]) } catch (e) { fail(f, 'JSON-LD inválido: ' + e.message) } }
  // CSP-friendly
  if (/\sstyle="/.test(html)) fail(f, 'style inline')
  if (/\son[a-z]+="/.test(html)) fail(f, 'handler inline')
  if (/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>/.test(html)) fail(f, 'script inline')
  if (/fonts\.googleapis|fonts\.gstatic|cdn\./.test(html)) fail(f, 'recurso externo')
  // imagens
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0]
    if (!/\salt="/.test(tag)) fail(f, 'img sem alt')
    if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) fail(f, 'img sem width/height')
    for (const s of tag.matchAll(/(?:src|srcset)="([^"]+)"/g)) for (const part of s[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u && !exists(u)) fail(f, `imagem em falta ${u}`) }
  }
  // botões/links com nome acessível
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const attrs = m[1], inner = m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim()
    if (!inner && !/aria-label="[^"]+"/.test(attrs)) fail(f, `link sem nome acessível: ${attrs.slice(0, 80)}`)
    const href = (attrs.match(/href="([^"]+)"/) || [])[1]
    if (!href) { fail(f, 'link sem href'); continue }
    if (href.startsWith('/') && !exists(href)) fail(f, `link interno partido ${href}`)
    if (/target="_blank"/.test(attrs) && !/rel="[^"]*noopener/.test(attrs)) fail(f, `target=_blank sem noopener ${href}`)
  }
  // ligações externas essenciais
  if (indexable && !html.includes('https://wa.me/351928158158')) fail(f, 'sem ligação WhatsApp')
  if (indexable && !html.includes('tel:+351928158158')) fail(f, 'sem ligação telefone')
  // hreflang aponta para ficheiros existentes
  for (const m of html.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)) if (!exists(m[1].replace(SITE.origin, ''))) fail(f, `hreflang quebrado ${m[1]}`)
}

// paridade PT/EN
for (const k of ['home', 'airport', 'lisbon', 'portugal', ...DEST_KEYS, 'legal']) {
  for (const l of ['pt', 'en']) if (!exists(ROUTES[l][k])) fail('rotas', `falta página ${l}/${k}`)
}

// regressões específicas do 691.pt: navegação, CTA, idioma e cabeçalho
for (const f of htmlFiles) {
  const html = read(f)
  if (html.includes('lang-switch') || html.includes('class="menu"') || html.includes('mobile-bar') || html.includes('data-bar')) fail(f, 'restos de seletor de idioma/menu/barra móvel')
  if (/Ligar agora|Call now|Abrir conversa no WhatsApp|Open WhatsApp chat/.test(html)) fail(f, 'CTA antigo de chamada/WhatsApp')
  if (html.includes('class="tool-phone"') && !/^((?:en\/)?)?$/.test('')) { /* marcador sem efeito; validação abaixo por rota */ }
  if (f !== 'index.html' && f !== 'en/index.html') {
    if (html.includes('class="tool-phone"')) fail(f, 'telefone visível no cabeçalho de página secundária')
    if (html.includes('class="tool-instagram"')) fail(f, 'Instagram visível no cabeçalho de página secundária')
  }
  if (f === 'index.html' || f === 'en/index.html') {
    const tools = html.match(/<div class="header-tools">([\s\S]*?)<\/div><\/div><\/header>/)?.[1] || ''
    const count = (tools.match(/class="tool /g) || []).length
    if (count !== 4) fail(f, `homepage com ${count} ícones de topo; esperado 4`)
  } else if (!f.endsWith('404.html') && !f.endsWith('offline.html')) {
    const tools = html.match(/<div class="header-tools">([\s\S]*?)<\/div><\/div><\/header>/)?.[1] || ''
    const count = (tools.match(/class="tool /g) || []).length
    if (count !== 0) fail(f, `página secundária com ${count} ícones de topo; esperado 0`)
  }
  if (f === 'index.html' || f === 'en/index.html') {
    if (!html.includes('Informação Legal e Privacidade') && f === 'index.html') fail(f, 'homepage sem ligação legal')
    if (!html.includes('Legal Information and Privacy') && f === 'en/index.html') fail(f, 'homepage EN sem ligação legal')
  } else if (!f.endsWith('legal.html')) {
    const footer = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1] || ''
    if (footer.includes('Informação Legal e Privacidade') || footer.includes('Legal Information and Privacy') || footer.includes('Livro de Reclamações') || footer.includes('Complaints Book')) {
      fail(f, 'ligações legais/reclamações presentes no rodapé de página secundária')
    }
  }
  if (!html.includes('data-site-lang=') || !html.includes('data-alt-lang-url=')) fail(f, 'metadados para idioma automático em falta')
}
const cssSource = fs.readFileSync(path.join(ROOT, 'src/css/site.css'), 'utf8')
if (/border-radius:50%[^}]*background:var\(--green\)/.test(cssSource)) fail('src/css/site.css', 'logo ainda usa ponto circular CSS em vez de ponto tipográfico')
const jsSource = read('site.js')
if (!jsSource.includes('navigator.languages') || !jsSource.includes('location.replace(altUrl)')) fail('site.js', 'seleção automática de idioma incompleta')
if (!exists('assets/img/aeroporto-1920.webp')) fail('aeroporto', 'fotografia de aeroporto em alta resolução em falta')

// imagens muito pesadas
for (const f of files.filter(f => f.startsWith('assets/img/'))) { const kb = fs.statSync(path.join(PUB, f)).size / 1024; if (kb > 400) fail(f, `imagem pesada (${Math.round(kb)} KB)`) }

if (errors.length) { console.error('✗ Auditoria falhou:\n' + errors.map(e => ' - ' + e).join('\n')); process.exit(1) }
console.log(`✓ Auditoria OK · ${htmlFiles.length} páginas HTML · ${files.length} ficheiros`)
