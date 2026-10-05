#!/usr/bin/env node
// Gera o site estático (public/) a partir de content/ e src/. Sem dependências.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { SITE, ROUTES, DEST_KEYS, IMAGES, T } from '../content/site.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public')
const SRC = path.join(ROOT, 'src')
const imgs = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/images.json'), 'utf8'))
const legal = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/legal.json'), 'utf8'))

const LANGS = ['pt', 'en']
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 8)
const write = (rel, data) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data) }
const url = (lang, key) => SITE.origin + ROUTES[lang][key]
const waLink = (lang, key) => `${SITE.wa}?text=${encodeURIComponent(T[lang].wa[key] || T[lang].wa.home)}`

// ---------- 1. limpar e copiar estáticos ----------
for (const f of fs.readdirSync(OUT)) if (!['assets'].includes(f)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true })
fs.cpSync(path.join(SRC, 'static'), OUT, { recursive: true })

// ---------- 2. CSS / JS ----------
const minCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{};,])\s*/g, '$1').replace(/;}/g, '}').trim()
const posClass = pos => 'op-' + pos.replace(/[^0-9 ]/g, '').trim().split(/\s+/).join('-')
const posCss = [...new Set(Object.values(IMAGES).map(i => i.pos))].map(p => `.${posClass(p)}{object-position:${p}}`).join('\n')
const css = minCss(fs.readFileSync(path.join(SRC, 'css/site.css'), 'utf8') + '\n' + posCss)
const js = fs.readFileSync(path.join(SRC, 'js/site.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\n{2,}/g, '\n').trim() + '\n'
const V_CSS = hash(css), V_JS = hash(js)
write('site.css', css); write('site.js', js)
const CSS_URL = `/site.css?v=${V_CSS}`, JS_URL = `/site.js?v=${V_JS}`
const FONT_MAIN = '/fonts/inter-latin-wght-normal.woff2'

// ---------- 3. Ícones (sprite) ----------
const ICONS = {
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.42 2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.149-.67.149-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.123-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
  car: '<path d="M5 17h14M3 13l2-6a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 7l2 6v4a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'
}
const FILLED = new Set(['whatsapp', 'star'])
const sprite = '<svg class="sprite" xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
  Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('') + '</defs></svg>'
const icon = (name, cls = '') => `<svg class="icon${FILLED.has(name) ? ' icon-fill' : ''}${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`

// ---------- 4. Imagens ----------
function img(name, { alt, sizes, cls = '', eager = false, high = false }) {
  const vs = imgs[name].variants
  const def = vs.find(v => v.w >= 768) || vs[vs.length - 1]
  const srcset = vs.map(v => `/assets/img/${name}-${v.w}.webp ${v.w}w`).join(', ')
  return `<img${cls ? ` class="${cls}"` : ''} src="/assets/img/${name}-${def.w}.webp" srcset="${srcset}" sizes="${sizes}" width="${def.w}" height="${def.h}" alt="${esc(alt)}"${eager ? '' : ' loading="lazy"'} decoding="async"${high ? ' fetchpriority="high"' : ''}>`
}
const heroPreload = name => {
  const vs = imgs[name].variants
  return `<link rel="preload" as="image" href="/assets/img/${name}-${(vs.find(v => v.w >= 768) || vs.at(-1)).w}.webp" imagesrcset="${vs.map(v => `/assets/img/${name}-${v.w}.webp ${v.w}w`).join(', ')}" imagesizes="100vw" fetchpriority="high">`
}
const CARD_SIZES = '(min-width:900px) 360px, (min-width:620px) 50vw, 100vw'
const DEST_SIZES = '(min-width:900px) 360px, (min-width:620px) 50vw, 100vw'

// ---------- 5. Componentes ----------
const externalHint = lang => (lang === 'pt' ? ' (abre numa nova janela)' : ' (opens in a new window)')

function header(lang, key) {
  const t = T[lang], u = t.ui, r = ROUTES[lang]
  const navItems = [['home', u.home], ['airport', u.airport], ['lisbon', u.lisbon], ['portugal', u.portugal]]
  const cur = k => (k === key || (k === 'portugal' && DEST_KEYS.includes(key))) ? ' aria-current="page"' : ''
  const links = navItems.map(([k, label]) => `<a href="${r[k]}"${cur(k)}>${esc(label)}</a>`).join('')
  const homeTools = key === 'home' ? `<a class="tool tool-phone" href="tel:${SITE.phone}" aria-label="${esc(u.callLabel)}">${icon('phone')}</a><a class="tool tool-wa" href="${waLink(lang, 'home')}" aria-label="${esc(u.waLabel)}">${icon('whatsapp')}</a><a class="tool tool-instagram" href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="${esc(u.igLabel + externalHint(lang))}">${icon('instagram')}</a><a class="tool tool-google" href="${SITE.review}" target="_blank" rel="noopener" aria-label="${esc(u.reviewLabel + externalHint(lang))}">${icon('star')}</a>` : ''
  return `<header class="site-header"><div class="wrap header-inner">
<a class="logo" href="${r.home}" aria-label="691.pt — ${esc(u.home)}"><b>691</b><i aria-hidden="true">.</i><span>pt</span></a>
<nav class="nav" aria-label="${esc(u.nav)}">${links}</nav>
<div class="header-tools">${homeTools}</div></div></header>`
}

function footer(lang, key) {
  const t = T[lang], u = t.ui, r = ROUTES[lang]
  return `<footer class="site-footer"><div class="wrap"><div class="footer-grid">
<div class="footer-brand"><a class="logo" href="${r.home}" aria-label="691.pt"><b>691</b><i aria-hidden="true"></i><span>pt</span></a><p>${esc(u.footerTag)}</p></div>
<div><h2>${esc(u.services)}</h2><ul><li><a href="${r.home}">${esc(u.home)}</a></li><li><a href="${r.airport}">${esc(u.airport)}</a></li><li><a href="${r.lisbon}">${esc(u.lisbon)}</a></li><li><a href="${r.portugal}">${esc(u.portugal)}</a></li></ul></div>
<div><h2>${esc(u.destinations)}</h2><ul>${DEST_KEYS.map(k => `<li><a href="${r[k]}">${esc(t.dest[k].name)}</a></li>`).join('')}</ul></div>
<div><h2>${esc(u.contactsTitle)}</h2><ul>
<li><a href="tel:${SITE.phone}">${icon('phone')}${SITE.phoneDisplay}</a></li>
<li><a href="${waLink(lang, 'home')}">${icon('whatsapp')}WhatsApp</a></li>
<li><a href="${SITE.instagram}" target="_blank" rel="noopener">${icon('instagram')}Instagram<span class="sr-only">${externalHint(lang)}</span></a></li>
<li><a href="${SITE.review}" target="_blank" rel="noopener">${icon('star')}${esc(u.review)}<span class="sr-only">${externalHint(lang)}</span></a></li></ul></div>
</div>
<div class="footer-bottom"><span>${esc(u.rights)}</span>${key === 'home' ? `<span><a href="${r.legal}">${esc(u.legal)}</a> · <a href="${SITE.complaints}" target="_blank" rel="noopener">${esc(u.complaints)}<span class="sr-only">${externalHint(lang)}</span></a></span>` : ''}</div>
</div></footer>`
}

function breadcrumb(lang, trail) {
  const u = T[lang].ui
  return `<nav class="breadcrumb" aria-label="${esc(u.breadcrumb)}"><ol>${trail.map(([label, href], i) => i === trail.length - 1 ? `<li><span aria-current="page">${esc(label)}</span></li>` : `<li><a href="${href}">${esc(label)}</a></li>`).join('')}</ol></nav>`
}

const faqHtml = (lang, items, id = 'faq') => `<section class="section section--soft" aria-labelledby="${id}-h"><div class="wrap"><div class="section-head"><span class="eyebrow">FAQ</span><h2 id="${id}-h">${esc(T[lang].faqTitle)}</h2></div><div class="faq">${items.map(f => `<details><summary>${esc(f.q)}</summary><div class="answer"><p>${esc(f.a)}</p></div></details>`).join('')}</div></div></section>`

function ctaBand(lang, key) {
  const t = T[lang], u = t.ui
  return `<section class="cta-band" aria-labelledby="cta-h"><div class="wrap cta-inner"><div><h2 id="cta-h">${esc(t.cta.title)}</h2><p>${esc(t.cta.p)}</p></div><div class="actions"><a class="btn btn-wa btn-lg" href="${waLink(lang, key in t.wa ? key : 'home')}">${icon('whatsapp')}${esc(u.book)}</a></div></div></section>`
}

function stepsHtml(lang, soft = true) {
  const s = T[lang].steps
  return `<section class="section${soft ? ' section--soft' : ''}" aria-labelledby="steps-h"><div class="wrap"><div class="section-head"><span class="eyebrow">${esc(lang === 'pt' ? 'Como funciona' : 'How it works')}</span><h2 id="steps-h">${esc(s.title)}</h2><p class="lede">${esc(s.sub)}</p></div><ol class="steps">${s.items.map((it, i) => `<li class="step" data-reveal><span class="step-n" aria-hidden="true">${i + 1}</span><div class="step-icon">${icon(it.i)}</div><h3>${esc(it.t)}</h3><p>${esc(it.p)}</p></li>`).join('')}</ol></div></section>`
}

const destCard = (lang, k) => {
  const t = T[lang], d = t.dest[k]
  return `<a class="dest" href="${ROUTES[lang][k]}" data-reveal>${img(IMAGES[k].img, { alt: d.imgAlt, sizes: DEST_SIZES })}<div class="dest-body"><div><h3>${esc(d.name)}</h3><p>${esc(d.teaser)}</p><span class="dest-meta">${icon('clock')}${esc(d.time)} · ${esc(d.km)}</span></div><span class="dest-arrow" aria-hidden="true">${icon('arrow')}</span></div></a>`
}
const lisbonCard = lang => {
  const t = T[lang]
  return `<a class="dest" href="${ROUTES[lang].lisbon}" data-reveal>${img('lisboa', { alt: t.pages.home.cards.lisbon.alt, sizes: DEST_SIZES })}<div class="dest-body"><div><h3>${esc(t.ui.lisbon)}</h3><p>${esc(lang === 'pt' ? 'A cidade das sete colinas' : 'The city of seven hills')}</p></div><span class="dest-arrow" aria-hidden="true">${icon('arrow')}</span></div></a>`
}

const serviceCard = (lang, k) => {
  const t = T[lang], c = t.pages.home.cards[k]
  const imgName = { lisbon: 'lisboa', airport: 'aeroporto', portugal: 'sintra' }[k]
  return `<article class="card-photo" data-reveal><div class="thumb">${img(imgName, { alt: c.alt, sizes: CARD_SIZES })}</div><div class="card-body"><h3>${esc(c.t)}</h3><p>${esc(c.p)}</p><a class="card-link" href="${ROUTES[lang][k]}">${esc(t.ui.seeMore)}<span class="sr-only">: ${esc(c.t)}</span>${icon('arrow')}</a></div></article>`
}

function hero(lang, key, { h1, sub, eyebrow, imgKey, alt, trail, home = false }) {
  const t = T[lang], u = t.ui
  const I = IMAGES[imgKey]
  const glass = home ? `<aside class="glass" aria-labelledby="send-h"><h2 id="send-h">${esc(u.sendTitle)}</h2><p>${esc(u.sendIntro)}</p><ul class="checklist">${u.send.map(s => `<li>${icon('check')}${esc(s)}</li>`).join('')}</ul><a class="btn btn-wa btn-lg" href="${waLink(lang, 'home')}">${icon('whatsapp')}${esc(u.book)}</a></aside>` : ''
  return `<section class="hero${home ? '' : ' hero--page'}"><div class="hero-media">${img(I.img, { alt, sizes: '100vw', eager: true, high: true, cls: posClass(I.pos) })}</div><div class="wrap hero-inner"><div class="hero-copy">${trail ? breadcrumb(lang, trail) : ''}<span class="eyebrow">${esc(eyebrow)}</span><h1>${esc(h1)}</h1><p class="hero-sub">${esc(sub)}</p><div class="actions"><a class="btn btn-wa btn-lg" data-hero-cta href="${waLink(lang, key in t.wa ? key : 'home')}">${icon('whatsapp')}${esc(u.book)}</a></div></div>${glass}</div></section>`
}

// ---------- 6. JSON-LD ----------
const BUSINESS_ID = SITE.origin + '/#business'
function businessNode(lang) {
  return {
    '@type': ['TaxiService', 'LocalBusiness'], '@id': BUSINESS_ID, name: '691.pt Táxi Lisboa', url: SITE.origin + '/',
    telephone: SITE.phone, image: `${SITE.origin}/assets/og/home-pt.jpg`, logo: `${SITE.origin}/icon-512.png`,
    sameAs: [SITE.instagram, SITE.review],
    areaServed: [{ '@type': 'City', name: 'Lisboa' }, { '@type': 'Country', name: 'Portugal' }],
    availableLanguage: [{ '@type': 'Language', name: 'Portuguese', alternateName: 'pt' }, { '@type': 'Language', name: 'English', alternateName: 'en' }],
    contactPoint: { '@type': 'ContactPoint', telephone: SITE.phone, contactType: 'reservations', availableLanguage: ['pt', 'en'], url: SITE.wa },
    potentialAction: { '@type': 'ReserveAction', name: T[lang].ui.book, target: { '@type': 'EntryPoint', urlTemplate: SITE.wa, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] } }
  }
}
function graph(lang, key, { title, desc, trail, faq, service }) {
  const pageUrl = url(lang, key)
  const g = [businessNode(lang), { '@type': 'WebSite', '@id': SITE.origin + '/#website', url: SITE.origin + '/', name: '691.pt', inLanguage: ['pt-PT', 'en'], publisher: { '@id': BUSINESS_ID } }]
  const page = { '@type': 'WebPage', '@id': pageUrl + '#webpage', url: pageUrl, name: title, description: desc, inLanguage: T[lang].lang, isPartOf: { '@id': SITE.origin + '/#website' }, about: { '@id': BUSINESS_ID }, primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE.origin}/assets/og/${key}-${lang}.jpg`, width: 1200, height: 630 } }
  if (trail) page.breadcrumb = { '@id': pageUrl + '#breadcrumb' }
  g.push(page)
  if (trail) g.push({ '@type': 'BreadcrumbList', '@id': pageUrl + '#breadcrumb', itemListElement: trail.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE.origin + (href || ROUTES[lang][key]) })) })
  if (service) g.push({ '@type': 'Service', '@id': pageUrl + '#service', name: service.name, serviceType: 'Taxi', provider: { '@id': BUSINESS_ID }, areaServed: service.area, url: pageUrl, description: desc })
  if (faq) g.push({ '@type': 'FAQPage', '@id': pageUrl + '#faq', mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) })
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': g })
}

// ---------- 7. Layout ----------
const pages = [] // {lang,key,path,indexable}
function layout(lang, key, { title, desc, body, imgPreload, ld, robots = 'index,follow,max-image-preview:large,max-snippet:-1', ogKey = key, ogAlt, noAlt = false }) {
  const t = T[lang], o = T[t.other]
  const self = url(lang, key)
  const alt = noAlt ? '' : [
    `<link rel="alternate" hreflang="pt-PT" href="${url('pt', key)}">`,
    `<link rel="alternate" hreflang="en" href="${url('en', key)}">`,
    `<link rel="alternate" hreflang="x-default" href="${url('pt', key)}">`
  ].join('')
  const og = `${SITE.origin}/assets/og/${ogKey}-${lang}.jpg`
  const altRoute = ROUTES[t.other][key] || ROUTES[t.other].home
  return `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="${robots}">
<link rel="canonical" href="${self}">${alt}
<meta property="og:type" content="website"><meta property="og:site_name" content="691.pt"><meta property="og:locale" content="${t.locale}"><meta property="og:locale:alternate" content="${o.locale}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${self}">
<meta property="og:image" content="${og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(ogAlt || title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${og}"><meta name="twitter:image:alt" content="${esc(ogAlt || title)}">
<meta name="theme-color" content="#0b1015"><meta name="color-scheme" content="light"><meta name="format-detection" content="telephone=no">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="691.pt"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="${FONT_MAIN}" as="font" type="font/woff2" crossorigin>${imgPreload || ''}
<link rel="stylesheet" href="${CSS_URL}">${ld ? `<script type="application/ld+json">${ld}</script>` : ''}
</head><body data-site-lang="${t.code}" data-alt-lang-url="${altRoute}">${sprite}<a class="skip" href="#main">${esc(t.ui.skip)}</a>
${header(lang, key)}
<main id="main">${body}</main>
${footer(lang, key)}
<script src="${JS_URL}" defer></script></body></html>`
}

// ---------- 8. Páginas ----------
function homePage(lang) {
  const t = T[lang], p = t.pages.home, u = t.ui, r = ROUTES[lang], key = 'home'
  const body = [
    hero(lang, key, { h1: p.h1, sub: p.sub, eyebrow: p.eyebrow, imgKey: 'home', alt: p.imgAlt, home: true }),
    `<section class="section" aria-labelledby="serv-h"><div class="wrap"><div class="section-head"><span class="eyebrow">${esc(p.servicesEyebrow)}</span><h2 id="serv-h">${esc(p.servicesTitle)}</h2><p class="lede">${esc(p.servicesSub)}</p></div><div class="grid grid-3">${['lisbon', 'airport', 'portugal'].map(k => serviceCard(lang, k)).join('')}</div></div></section>`,
    stepsHtml(lang, true),
    `<section class="section" aria-labelledby="dest-h"><div class="wrap"><div class="section-head section-head--row"><div class="stack"><span class="eyebrow">${esc(p.destEyebrow)}</span><h2 id="dest-h">${esc(p.destTitle)}</h2><p class="lede">${esc(p.destSub)}</p></div><a class="btn btn-outline" href="${r.portugal}">${esc(u.allDest)}${icon('arrow')}</a></div><div class="grid grid-3">${lisbonCard(lang)}${DEST_KEYS.map(k => destCard(lang, k)).join('')}</div></div></section>`,
    `<section class="section section--dark" aria-labelledby="why-h"><div class="wrap"><div class="section-head"><span class="eyebrow">${esc(t.why.eyebrow)}</span><h2 id="why-h">${esc(t.why.title)}</h2></div><div class="grid grid-4">${t.why.items.map(it => `<div class="feature" data-reveal><div class="feature-icon">${icon(it.i)}</div><h3>${esc(it.t)}</h3><p>${esc(it.p)}</p></div>`).join('')}</div></div></section>`,
    `<section class="section" aria-labelledby="veh-h"><div class="wrap split"><div class="split-media">${img('taxi', { alt: p.vehicle.alt, sizes: '(min-width:900px) 600px, 100vw' })}</div><div class="split-copy"><span class="eyebrow">${esc(p.vehicle.eyebrow)}</span><h2 id="veh-h">${esc(p.vehicle.title)}</h2><p class="lede">${esc(p.vehicle.p)}</p><div class="actions"><a class="btn btn-wa" href="${waLink(lang, 'home')}">${icon('whatsapp')}${esc(u.book)}</a></div></div></div></section>`,
    faqHtml(lang, p.faq),
    `<section class="section" aria-labelledby="rev-h"><div class="wrap"><div class="review"><div><div class="stars" aria-hidden="true">${icon('star')}${icon('star')}${icon('star')}${icon('star')}${icon('star')}</div><h2 id="rev-h">${esc(t.review.title)}</h2><p>${esc(t.review.p)}</p></div><a class="btn btn-wa" href="${SITE.review}" target="_blank" rel="noopener">${icon('star')}${esc(t.review.cta)}<span class="sr-only">${externalHint(lang)}</span></a></div></div></section>`,
    ctaBand(lang, key)
  ].join('\n')
  return layout(lang, key, { title: p.title, desc: p.desc, body, imgPreload: heroPreload(IMAGES.home.img), ld: graph(lang, key, { title: p.title, desc: p.desc, faq: p.faq }), ogAlt: p.imgAlt })
}

function servicePage(lang, key) { // airport | lisbon
  const t = T[lang], p = t.pages[key], u = t.ui, r = ROUTES[lang]
  const trail = [[u.home, r.home], [p.eyebrow, r[key]]]
  const otherKeys = ['airport', 'lisbon', 'portugal'].filter(k => k !== key)
  const body = [
    hero(lang, key, { h1: p.h1, sub: p.sub, eyebrow: p.eyebrow, imgKey: key, alt: p.imgAlt, trail }),
    `<section class="section" aria-labelledby="sec-h"><div class="wrap"><div class="section-head"><span class="eyebrow">${esc(p.sectionEyebrow)}</span><h2 id="sec-h">${esc(p.sectionTitle)}</h2><p class="lede">${esc(p.sectionSub)}</p></div><div class="grid grid-3">${p.cards.map(c => `<article class="highlight" data-reveal><div class="step-icon">${icon(c.i)}</div><h3>${esc(c.t)}</h3><p>${esc(c.p)}</p></article>`).join('')}</div><div class="tip">${icon('info')}<div><h3>${esc(p.tip.t)}</h3><p>${esc(p.tip.p)}</p></div></div></div></section>`,
    stepsHtml(lang, true),
    faqHtml(lang, p.faq).replace('section--soft', ''),
    `<section class="section section--soft" aria-labelledby="oth-h"><div class="wrap"><div class="section-head"><h2 id="oth-h">${esc(u.others)}</h2></div><div class="grid grid-2">${otherKeys.map(k => serviceCard(lang, k)).join('')}</div></div></section>`,
    ctaBand(lang, key)
  ].join('\n')
  return layout(lang, key, { title: p.title, desc: p.desc, body, imgPreload: heroPreload(IMAGES[key].img), ld: graph(lang, key, { title: p.title, desc: p.desc, trail, faq: p.faq, service: { name: p.eyebrow, area: { '@type': 'City', name: 'Lisboa' } } }), ogAlt: p.imgAlt })
}

function portugalPage(lang) {
  const t = T[lang], p = t.pages.portugal, u = t.ui, r = ROUTES[lang], key = 'portugal'
  const trail = [[u.home, r.home], [u.portugal, r.portugal]]
  const body = [
    hero(lang, key, { h1: p.h1, sub: p.sub, eyebrow: p.eyebrow, imgKey: key, alt: p.imgAlt, trail }),
    `<section class="section" aria-labelledby="sec-h"><div class="wrap"><div class="section-head"><span class="eyebrow">${esc(p.sectionEyebrow)}</span><h2 id="sec-h">${esc(p.sectionTitle)}</h2><p class="lede">${esc(p.sectionSub)}</p></div><div class="grid grid-3">${DEST_KEYS.map(k => destCard(lang, k)).join('')}<div class="more-box" data-reveal><h3>${esc(p.more.t)}</h3><p>${esc(p.more.p)}</p><a class="card-link card-link--plain" href="${waLink(lang, 'portugal')}">${esc(u.book)}${icon('arrow')}</a></div></div><div class="tip">${icon('info')}<div><h3>${esc(p.tip.t)}</h3><p>${esc(p.tip.p)}</p></div></div></div></section>`,
    stepsHtml(lang, true),
    faqHtml(lang, p.faq).replace('section--soft', ''),
    ctaBand(lang, key)
  ].join('\n')
  const dl = DEST_KEYS.map(k => ({ '@type': 'City', name: t.dest[k].name }))
  return layout(lang, key, { title: p.title, desc: p.desc, body, imgPreload: heroPreload(IMAGES[key].img), ld: graph(lang, key, { title: p.title, desc: p.desc, trail, faq: p.faq, service: { name: u.portugal, area: [{ '@type': 'Country', name: 'Portugal' }, ...dl] } }), ogAlt: p.imgAlt })
}

function destPage(lang, key) {
  const t = T[lang], d = t.dest[key], u = t.ui, r = ROUTES[lang]
  const trail = [[u.home, r.home], [u.portugal, r.portugal], [d.name, r[key]]]
  const others = DEST_KEYS.filter(k => k !== key)
  const body = [
    hero(lang, key, { h1: d.h1, sub: d.sub, eyebrow: (lang === 'pt' ? 'Lisboa → ' : 'Lisbon → ') + d.name, imgKey: key, alt: d.imgAlt, trail }),
    `<section class="section" aria-labelledby="hl-h"><div class="wrap"><dl class="facts"><div class="fact"><dt>${esc(u.facts.from)}</dt><dd>Lisboa</dd></div><div class="fact"><dt>${esc(u.facts.distance)}</dt><dd>${esc(d.km)}</dd></div><div class="fact"><dt>${esc(u.facts.time)}</dt><dd>${esc(d.time)}</dd></div></dl><div class="section-head"><h2 id="hl-h">${esc(d.sectionTitle)}</h2></div><div class="grid grid-3">${d.highlights.map((h, i) => `<article class="highlight" data-reveal><span class="highlight-n">0${i + 1}</span><h3>${esc(h.t)}</h3><p>${esc(h.p)}</p></article>`).join('')}</div><div class="tip">${icon('info')}<div><h3>${esc(d.tip.t)}</h3><p>${esc(d.tip.p)}</p></div></div></div></section>`,
    stepsHtml(lang, true),
    faqHtml(lang, d.faq).replace('section--soft', ''),
    `<section class="section section--soft" aria-labelledby="oth-h"><div class="wrap"><div class="section-head"><h2 id="oth-h">${esc(u.otherDest)}</h2></div><div class="grid grid-4">${others.map(k => destCard(lang, k)).join('')}</div></div></section>`,
    ctaBand(lang, key)
  ].join('\n')
  return layout(lang, key, { title: d.title, desc: d.desc, body, imgPreload: heroPreload(IMAGES[key].img), ld: graph(lang, key, { title: d.title, desc: d.desc, trail, faq: d.faq, service: { name: (lang === 'pt' ? 'Táxi de Lisboa para ' : 'Taxi from Lisbon to ') + d.name, area: { '@type': 'City', name: d.name } } }), ogAlt: d.imgAlt })
}

function legalPage(lang) {
  const L = legal[lang], t = T[lang], u = t.ui, r = ROUTES[lang], key = 'legal'
  const anchors = lang === 'pt' ? { priv: 'privacidade', comp: 'reclamacoes' } : { priv: 'privacy', comp: 'complaints' }
  const body = `<div class="doc"><div class="doc-wrap"><a href="${r.home}" class="card-link card-link--plain">← ${esc(u.backHome)}</a><h1>${esc(L.legalTitle)}</h1><p class="muted">${esc(L.updated)}</p>${L.translationNote ? `<p class="muted">${esc(L.translationNote)}</p>` : ''}
<div class="doc-card"><h2>${esc(L.providerTitle)}</h2><p><strong>José Alfredo Mendes Fernandes</strong></p><p>${esc(L.nifLabel)}: 224003852</p><p>${esc(L.licenseLabel)} 132815</p><p>Praceta Bernardo Santareno 4 6<br>2720-067 Amadora, Portugal</p><p>${esc(L.phoneLabel)}: <a href="tel:${SITE.phone}">${SITE.phoneDisplay}</a><br>${esc(L.mobileCall)}</p></div>
<div class="doc-card"><h2>${esc(L.bookingPriceTitle)}</h2><p>${esc(L.bookingRequest)}</p><p>${esc(L.price)}</p><p class="small"><strong>${esc(L.important)}</strong> ${esc(L.priceNote)}</p></div>
<section class="doc-card" id="${anchors.priv}"><h2>${esc(L.privacyTitle)}</h2><p>${esc(L.controller)}</p><h3>${esc(L.dataTitle)}</h3><p>${esc(L.dataText)}</p><h3>${esc(L.purposesTitle)}</h3><ul><li>${esc(L.purpose1)}</li><li>${esc(L.purpose2)}</li><li>${esc(L.purpose3)}</li><li>${esc(L.purpose4)}</li></ul><h3>${esc(L.basisTitle)}</h3><p>${esc(L.basisText)}</p><h3>${esc(L.recipientsTitle)}</h3><p>${esc(L.recipientsText)}</p><p>${esc(L.mapData)}</p><h3>${esc(L.retentionTitle)}</h3><p>${esc(L.retentionText)}</p><h3>${esc(L.rightsTitle)}</h3><p>${esc(L.rightsText)} <a href="https://www.cnpd.pt/cidadaos/direitos/" target="_blank" rel="noopener">${esc(L.rightsLink)}<span class="sr-only">${externalHint(lang)}</span></a></p><h3>${esc(L.privacyComplaintsTitle)}</h3><p>${esc(L.privacyComplaintsText)} <a href="https://www.cnpd.pt/" target="_blank" rel="noopener">${esc(L.cnpdLink)}<span class="sr-only">${externalHint(lang)}</span></a>.</p></section>
<section class="doc-card" id="${anchors.comp}"><h2>${esc(L.complaintsTitle)}</h2><p>${esc(L.complaintsIntro)}</p><p><a href="${SITE.complaints}" target="_blank" rel="noopener">${esc(L.complaintsLink)}<span class="sr-only">${externalHint(lang)}</span></a></p><p>${esc(L.complaintsLawText)} <a href="https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2005-34431675" target="_blank" rel="noopener">${esc(L.complaintsLawLink)}<span class="sr-only">${externalHint(lang)}</span></a>.</p></section>
<div class="doc-card"><h2>${esc(L.ralTitle)}</h2><p>${esc(L.ralText)}</p><p><a href="https://www.centroarbitragemlisboa.pt/" target="_blank" rel="noopener">${esc(L.ralLink)}<span class="sr-only">${externalHint(lang)}</span></a></p><p class="small">${esc(L.ralNote)}</p></div>
<div class="doc-card"><h2>${esc(L.contactsTitle)}</h2><p><a href="tel:${SITE.phone}">${SITE.phoneDisplay}</a><br>${esc(L.mobileCall)}</p></div>
<p class="muted-foot">© 2026 691 Lisboa · José Alfredo Mendes Fernandes · ${esc(L.licenseLabel)} 132815</p></div></div>`
  return layout(lang, key, { title: L.pageTitle, desc: L.meta, body, robots: 'noindex,follow', ogKey: 'home' })
}

function notFoundPage(lang) {
  const n = T[lang].notFound, u = T[lang].ui, r = ROUTES[lang]
  const body = `<section class="center-page"><div class="wrap"><p class="big-code" aria-hidden="true">4<span>0</span>4</p><h1>${esc(n.h1)}</h1><p class="lede">${esc(n.p)}</p><div class="actions"><a class="btn btn-dark btn-lg" href="${r.home}">${esc(u.backHome)}</a><a class="btn btn-wa btn-lg" href="${waLink(lang, 'home')}">${icon('whatsapp')}${esc(u.book)}</a></div></div></section>`
  return layout(lang, 'error', { title: n.title, desc: n.p, body, robots: 'noindex,follow', noAlt: true }).replace(/<link rel="canonical"[^>]*>/, '')
}

function offlinePage(lang) {
  const n = T[lang].offline, u = T[lang].ui
  const body = `<section class="center-page"><div class="wrap"><p class="big-code" aria-hidden="true">69<span>1</span></p><h1>${esc(n.h1)}</h1><p class="lede">${esc(n.p)}</p><div class="actions"><button class="btn btn-dark btn-lg" type="button" data-reload>${esc(n.retry)}</button><a class="btn btn-wa btn-lg" href="tel:${SITE.phone}">${icon('phone')}${esc(n.contact)}: ${SITE.phoneDisplay}</a></div></div></section>`
  return layout(lang, 'error', { title: n.title, desc: n.p, body, robots: 'noindex,nofollow', noAlt: true }).replace(/<link rel="canonical"[^>]*>/, '')
}

// ---------- 9. Escrever tudo ----------
const outPath = route => route.endsWith('/') ? route + 'index.html' : route
for (const lang of LANGS) {
  const r = ROUTES[lang]
  const set = [['home', homePage(lang)], ['airport', servicePage(lang, 'airport')], ['lisbon', servicePage(lang, 'lisbon')], ['portugal', portugalPage(lang)], ...DEST_KEYS.map(k => [k, destPage(lang, k)])]
  for (const [key, html] of set) { write(outPath(r[key]), html); pages.push({ lang, key, indexable: true }) }
  write(outPath(r.legal), legalPage(lang))
  write(lang === 'pt' ? '404.html' : 'en/404.html', notFoundPage(lang))
  write(lang === 'pt' ? 'offline.html' : 'en/offline.html', offlinePage(lang))
}

// sitemap com alternates
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
for (const { lang, key } of pages) {
  sm.push(`<url><loc>${url(lang, key)}</loc><lastmod>${SITE.updated}</lastmod><xhtml:link rel="alternate" hreflang="pt-PT" href="${url('pt', key)}"/><xhtml:link rel="alternate" hreflang="en" href="${url('en', key)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${url('pt', key)}"/></url>`)
}
sm.push('</urlset>')
write('sitemap.xml', sm.join('\n') + '\n')
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE.origin}/sitemap.xml\n`)

// manifest
const manifest = {
  name: '691.pt — Táxi Lisboa', short_name: '691.pt', description: 'Táxi em Lisboa, aeroporto e viagens por Portugal. Reserva direta pelo WhatsApp.',
  id: '/', start_url: '/?source=pwa', scope: '/', display: 'standalone', orientation: 'portrait', lang: 'pt-PT', dir: 'ltr',
  background_color: '#0b1015', theme_color: '#0b1015', categories: ['travel', 'transportation'],
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ],
  shortcuts: [
    { name: 'Reservar pelo WhatsApp', short_name: 'WhatsApp', url: waLink('pt', 'home'), icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    { name: 'Aeroporto de Lisboa', short_name: 'Aeroporto', url: ROUTES.pt.airport, icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }] },
  ]
}
write('manifest.webmanifest', JSON.stringify(manifest, null, 2) + '\n')

// service worker
const core = ['/', '/en/', '/offline.html', '/en/offline.html', CSS_URL, JS_URL, FONT_MAIN, '/favicon.svg', '/icon-192.png']
const swSrc = fs.readFileSync(path.join(SRC, 'js/sw.js'), 'utf8')
const version = hash(css + js + JSON.stringify(core) + fs.readdirSync(path.join(OUT, 'assets/img')).join())
write('sw.js', swSrc.replace('__VERSION__', version).replace('__CORE__', JSON.stringify(core)))

console.log(`build ok · ${pages.length} páginas indexáveis · css ${(css.length / 1024).toFixed(1)} KB · js ${js.length} B · sw ${version}`)
