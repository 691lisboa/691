(() => {
  'use strict'
  const supported = ['pt', 'en']
  const requested = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase()
  const browser = (navigator.language || 'pt').split('-')[0].toLowerCase()
  const lang = requested === 'en' ? 'en' : (requested === 'pt' ? 'pt' : (browser.startsWith('en') ? 'en' : 'pt'))
  const translations = {
    pt: { page: '691 Lisboa — Sem Ligação', title: 'Sem ligação à internet', sub: 'O servidor 691 está temporariamente inacessível. Verifica a tua ligação e tenta novamente.', retry: 'Tentar novamente', contact: 'Reservas por telefone' },
    en: { page: '691 Lisboa — Offline', title: 'No internet connection', sub: 'The 691 server is temporarily unreachable. Check your connection and try again.', retry: 'Try again', contact: 'Bookings by phone' }
  }
  const t = translations[lang] || translations.en
  document.documentElement.lang = lang
  document.title = t.page
  const title = document.getElementById('offline-title')
  const sub = document.getElementById('offline-sub')
  const retry = document.getElementById('retry-btn')
  const contact = document.getElementById('offline-contact-label')
  if (title) title.textContent = t.title
  if (sub) sub.textContent = t.sub
  if (retry) retry.textContent = t.retry
  if (contact) contact.textContent = t.contact
  retry?.addEventListener('click', () => window.location.reload())
})()
