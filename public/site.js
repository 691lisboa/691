(() => {
  'use strict'
  const doc = document
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
  }
  doc.querySelectorAll('[data-reload]').forEach(el => el.addEventListener('click', () => location.reload()))
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
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const targets = [...doc.querySelectorAll('[data-reveal]')].filter(el => el.getBoundingClientRect().top > innerHeight * 0.9)
    const rv = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); rv.unobserve(en.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    targets.forEach(el => { el.classList.add('reveal'); rv.observe(el) })
    setTimeout(() => targets.forEach(el => el.classList.add('is-in')), 4000)
  }
})()
