(() => {
  'use strict'
  const doc = document
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
  }
  doc.querySelectorAll('[data-reload]').forEach(el => el.addEventListener('click', () => location.reload()))
  const menu = doc.querySelector('.menu')
  if (menu) {
    menu.addEventListener('click', e => { if (e.target.closest('a')) menu.removeAttribute('open') })
    doc.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.hasAttribute('open')) { menu.removeAttribute('open'); menu.querySelector('summary')?.focus() } })
    doc.addEventListener('click', e => { if (menu.hasAttribute('open') && !menu.contains(e.target)) menu.removeAttribute('open') })
  }
  if (!('IntersectionObserver' in window)) return
  const bar = doc.querySelector('[data-bar]')
  if (bar) {
    const seen = new Set()
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { en.isIntersecting ? seen.add(en.target) : seen.delete(en.target) })
      bar.classList.toggle('is-hidden', seen.size > 0)
    })
    doc.querySelectorAll('[data-hero-cta],.cta-band').forEach(el => io.observe(el))
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const targets = [...doc.querySelectorAll('[data-reveal]')].filter(el => el.getBoundingClientRect().top > innerHeight * 0.9)
    const rv = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); rv.unobserve(en.target) } })
    }, { rootMargin: '0px 0px -8% 0px' })
    targets.forEach(el => { el.classList.add('reveal'); rv.observe(el) })
    setTimeout(() => targets.forEach(el => el.classList.add('is-in')), 4000)
  }
})()
