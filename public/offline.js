(() => {
  'use strict'
  const supported = ['pt', 'en', 'fr', 'es', 'de', 'it', 'zh', 'ja', 'ru', 'nl', 'pl']
  const requested = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase()
  const browser = (navigator.language || 'pt').split('-')[0].toLowerCase()
  const lang = supported.includes(requested) ? requested : (supported.includes(browser) ? browser : 'en')
  const translations = {
    pt: { page: '691 Lisboa — Sem Ligação', title: 'Sem ligação à internet', sub: 'O servidor 691 está temporariamente inacessível. Verifica a tua ligação e tenta novamente.', retry: 'Tentar novamente', contact: 'Reservas por telefone' },
    en: { page: '691 Lisboa — Offline', title: 'No internet connection', sub: 'The 691 server is temporarily unreachable. Check your connection and try again.', retry: 'Try again', contact: 'Bookings by phone' },
    fr: { page: '691 Lisboa — Hors connexion', title: 'Pas de connexion internet', sub: 'Le serveur 691 est temporairement inaccessible. Vérifiez votre connexion et réessayez.', retry: 'Réessayer', contact: 'Réservations par téléphone' },
    es: { page: '691 Lisboa — Sin conexión', title: 'Sin conexión a internet', sub: 'El servidor 691 está temporalmente inaccesible. Comprueba tu conexión e inténtalo de nuevo.', retry: 'Intentar de nuevo', contact: 'Reservas por teléfono' },
    de: { page: '691 Lisboa — Offline', title: 'Keine Internetverbindung', sub: 'Der 691-Server ist vorübergehend nicht erreichbar. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.', retry: 'Erneut versuchen', contact: 'Buchungen per Telefon' },
    it: { page: '691 Lisboa — Offline', title: 'Nessuna connessione internet', sub: 'Il server 691 è temporaneamente irraggiungibile. Controlla la connessione e riprova.', retry: 'Riprova', contact: 'Prenotazioni telefoniche' },
    zh: { page: '691 Lisboa — 离线', title: '无网络连接', sub: '691 服务器暂时无法访问。请检查网络连接后重试。', retry: '重试', contact: '电话预订' },
    ja: { page: '691 Lisboa — オフライン', title: 'インターネットに接続されていません', sub: '691 サーバーに一時的に接続できません。接続を確認してもう一度お試しください。', retry: '再試行', contact: '電話予約' },
    ru: { page: '691 Lisboa — Нет сети', title: 'Нет подключения к интернету', sub: 'Сервер 691 временно недоступен. Проверьте соединение и попробуйте снова.', retry: 'Повторить', contact: 'Бронирование по телефону' },
    nl: { page: '691 Lisboa — Offline', title: 'Geen internetverbinding', sub: 'De 691-server is tijdelijk onbereikbaar. Controleer uw verbinding en probeer opnieuw.', retry: 'Opnieuw proberen', contact: 'Telefonisch reserveren' },
    pl: { page: '691 Lisboa — Offline', title: 'Brak połączenia z internetem', sub: 'Serwer 691 jest chwilowo niedostępny. Sprawdź połączenie i spróbuj ponownie.', retry: 'Spróbuj ponownie', contact: 'Rezerwacje telefoniczne' }
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
