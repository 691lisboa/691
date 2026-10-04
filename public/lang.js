(() => {
  'use strict'
  try {
    const primary = String((navigator.languages && navigator.languages[0]) || navigator.language || 'pt').toLowerCase().split('-')[0]
    const wantsEnglish = primary === 'en'
    const pairs = {
      '/': '/en/',
      '/taxi-aeroporto-lisboa/': '/en/lisbon-airport-taxi/',
      '/taxi-lisboa/': '/en/lisbon-taxi/',
      '/viagens-portugal/': '/en/trips-portugal/',
      '/viagens-portugal/sintra/': '/en/trips-portugal/sintra/',
      '/viagens-portugal/fatima/': '/en/trips-portugal/fatima/',
      '/viagens-portugal/nazare/': '/en/trips-portugal/nazare/',
      '/viagens-portugal/porto/': '/en/trips-portugal/porto/',
      '/viagens-portugal/evora/': '/en/trips-portugal/evora/',
      '/legal.html': '/en/legal.html',
      '/404.html': '/en/404.html',
      '/offline.html': '/en/offline.html'
    }
    const reverse = Object.fromEntries(Object.entries(pairs).map(([pt, en]) => [en, pt]))
    const path = location.pathname
    const target = wantsEnglish ? pairs[path] : reverse[path]
    if (target && target !== path) location.replace(target)
  } catch (_) {}
})()
