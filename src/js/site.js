(() => {
  'use strict'
  const doc = document

  // PWA: service worker (só em HTTPS ou localhost)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
  }

  // Botão "Tentar novamente" (página offline)
  doc.querySelectorAll('[data-reload]').forEach(el => el.addEventListener('click', () => location.reload()))

  // Idioma automático: PT em dispositivos configurados em português; EN nos restantes.
  // Não interfere com crawlers para preservar as duas versões indexáveis.
  const lang = doc.body?.dataset.siteLang
  const altUrl = doc.body?.dataset.altLangUrl
  const ua = navigator.userAgent || ''
  const isBot = /bot|crawler|spider|slurp|facebookexternalhit|bingpreview|lighthouse/i.test(ua)
  if (lang && altUrl && !isBot) {
    const browserLang = (navigator.languages?.[0] || navigator.language || 'en').split('-')[0].toLowerCase()
    const target = browserLang === 'pt' ? 'pt' : 'en'
    if (target !== lang) location.replace(altUrl)
  }

  if (!('IntersectionObserver' in window)) return

  // Entrada suave (apenas se o utilizador não pedir menos movimento)
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const targets = [...doc.querySelectorAll('[data-reveal]')].filter(el => el.getBoundingClientRect().top > innerHeight * 0.9)
    const rv = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); rv.unobserve(en.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    targets.forEach(el => { el.classList.add('reveal'); rv.observe(el) })
    // Rede de segurança: nada fica escondido se o observador não disparar
    setTimeout(() => targets.forEach(el => el.classList.add('is-in')), 4000)
  }
})()
