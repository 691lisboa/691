(() => {
  'use strict'
  const doc = document

  // PWA: service worker (só em HTTPS ou localhost)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) })
  }

  // Botão "Tentar novamente" (página offline)
  doc.querySelectorAll('[data-reload]').forEach(el => el.addEventListener('click', () => location.reload()))

  if (!('IntersectionObserver' in window)) return

  // Barra fixa móvel: escondida enquanto já há um botão de reserva visível
  const bar = doc.querySelector('[data-bar]')
  if (bar) {
    const seen = new Set()
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { en.isIntersecting ? seen.add(en.target) : seen.delete(en.target) })
      bar.classList.toggle('is-hidden', seen.size > 0)
    })
    doc.querySelectorAll('[data-hero-cta],.cta-band').forEach(el => io.observe(el))
  }

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
