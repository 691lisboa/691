(() => {
  'use strict'

  const params = new URLSearchParams(window.location.search)
  const supported = ['pt', 'en', 'fr', 'es', 'de', 'it', 'zh', 'ja', 'ru', 'nl', 'pl']
  const requested = (params.get('lang') || '').toLowerCase()
  const browser = (navigator.language || 'pt').split('-')[0].toLowerCase()
  const lang = supported.includes(requested) ? requested : (supported.includes(browser) ? browser : 'en')

  const translations = {
    pt: { active: 'Reserva Ativa', call: 'Chamada', callAria: 'Chamar +351 928 158 158', whatsappAria: 'Abrir WhatsApp', status: { pending: 'A aguardar confirmação', accepted: 'Reserva aceite', onway: 'Motorista a caminho', arrived: 'Motorista chegou', completed: 'Viagem concluída', rejected: 'Reserva recusada', cancelled: 'Reserva cancelada' } },
    en: { active: 'Active Booking', call: 'Call', callAria: 'Call +351 928 158 158', whatsappAria: 'Open WhatsApp', status: { pending: 'Awaiting confirmation', accepted: 'Booking accepted', onway: 'Driver is on the way', arrived: 'Driver has arrived', completed: 'Trip completed', rejected: 'Booking declined', cancelled: 'Booking cancelled' } },
    fr: { active: 'Réservation Active', call: 'Appel', callAria: 'Appeler le +351 928 158 158', whatsappAria: 'Ouvrir WhatsApp', status: { pending: 'En attente de confirmation', accepted: 'Réservation acceptée', onway: 'Le chauffeur est en route', arrived: 'Le chauffeur est arrivé', completed: 'Trajet terminé', rejected: 'Réservation refusée', cancelled: 'Réservation annulée' } },
    es: { active: 'Reserva Activa', call: 'Llamar', callAria: 'Llamar al +351 928 158 158', whatsappAria: 'Abrir WhatsApp', status: { pending: 'Esperando confirmación', accepted: 'Reserva aceptada', onway: 'El conductor está en camino', arrived: 'El conductor ha llegado', completed: 'Viaje completado', rejected: 'Reserva rechazada', cancelled: 'Reserva cancelada' } },
    de: { active: 'Aktive Buchung', call: 'Anrufen', callAria: '+351 928 158 158 anrufen', whatsappAria: 'WhatsApp öffnen', status: { pending: 'Bestätigung ausstehend', accepted: 'Buchung angenommen', onway: 'Fahrer ist unterwegs', arrived: 'Fahrer ist angekommen', completed: 'Fahrt abgeschlossen', rejected: 'Buchung abgelehnt', cancelled: 'Buchung storniert' } },
    it: { active: 'Prenotazione Attiva', call: 'Chiama', callAria: 'Chiama +351 928 158 158', whatsappAria: 'Apri WhatsApp', status: { pending: 'In attesa di conferma', accepted: 'Prenotazione accettata', onway: 'L’autista è in viaggio', arrived: 'L’autista è arrivato', completed: 'Viaggio completato', rejected: 'Prenotazione rifiutata', cancelled: 'Prenotazione annullata' } },
    zh: { active: '当前预订', call: '电话', callAria: '拨打 +351 928 158 158', whatsappAria: '打开 WhatsApp', status: { pending: '等待确认', accepted: '预订已接受', onway: '司机正在前往', arrived: '司机已到达', completed: '行程已完成', rejected: '预订已拒绝', cancelled: '预订已取消' } },
    ja: { active: '予約中', call: '電話', callAria: '+351 928 158 158 に電話', whatsappAria: 'WhatsApp を開く', status: { pending: '確認待ち', accepted: '予約が承認されました', onway: 'ドライバーが向かっています', arrived: 'ドライバーが到着しました', completed: '旅行が完了しました', rejected: '予約が拒否されました', cancelled: '予約がキャンセルされました' } },
    ru: { active: 'Активный заказ', call: 'Позвонить', callAria: 'Позвонить +351 928 158 158', whatsappAria: 'Открыть WhatsApp', status: { pending: 'Ожидание подтверждения', accepted: 'Заказ принят', onway: 'Водитель в пути', arrived: 'Водитель прибыл', completed: 'Поездка завершена', rejected: 'Заказ отклонён', cancelled: 'Заказ отменён' } },
    nl: { active: 'Actieve Reservering', call: 'Bellen', callAria: 'Bel +351 928 158 158', whatsappAria: 'WhatsApp openen', status: { pending: 'Wachten op bevestiging', accepted: 'Reservering geaccepteerd', onway: 'Chauffeur is onderweg', arrived: 'Chauffeur is gearriveerd', completed: 'Rit voltooid', rejected: 'Reservering afgewezen', cancelled: 'Reservering geannuleerd' } },
    pl: { active: 'Aktywna Rezerwacja', call: 'Zadzwoń', callAria: 'Zadzwoń pod +351 928 158 158', whatsappAria: 'Otwórz WhatsApp', status: { pending: 'Oczekiwanie na potwierdzenie', accepted: 'Rezerwacja zaakceptowana', onway: 'Kierowca jest w drodze', arrived: 'Kierowca przyjechał', completed: 'Podróż zakończona', rejected: 'Rezerwacja odrzucona', cancelled: 'Rezerwacja anulowana' } }
  }

  const t = translations[lang] || translations.en
  document.documentElement.lang = lang

  const statusEl = document.getElementById('trip-status')
  const callLabel = document.getElementById('btn-call-label')
  const signalLabel = document.getElementById('btn-signal-label')
  const callButton = document.getElementById('btn-call')
  const whatsappButton = document.getElementById('btn-whatsapp')

  if (callLabel) callLabel.textContent = t.call
  if (signalLabel) signalLabel.textContent = 'WhatsApp'
  if (callButton) callButton.setAttribute('aria-label', t.callAria)
  if (whatsappButton) whatsappButton.setAttribute('aria-label', t.whatsappAria)

  const pathParts = window.location.pathname.split('/').filter(Boolean)
  const bookingIdFromPath = pathParts.length >= 2 && pathParts[0] === 'reserva' ? pathParts[1] : ''
  const bookingId = bookingIdFromPath || params.get('id') || ''
  const accessToken = params.get('token') || ''

  function applyBookingStatus(status, eventBookingId = '') {
    if (!statusEl) return
    if (eventBookingId && bookingId && eventBookingId !== bookingId) return

    const safeStatus = Object.prototype.hasOwnProperty.call(t.status, status) ? status : 'pending'
    statusEl.textContent = t.status[safeStatus]
    statusEl.dataset.status = safeStatus
    statusEl.className = `trip-status status-${safeStatus}`

    const terminal = safeStatus === 'completed' || safeStatus === 'rejected' || safeStatus === 'cancelled'
    document.title = `691 — ${terminal ? t.status[safeStatus] : t.active}`
  }

  applyBookingStatus('pending')

  const map = L.map('map', { zoomControl: true, attributionControl: true })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map)
  map.setView([38.7169, -9.1399], 13)

  const socket = io()
  let clientId = localStorage.getItem('691_clientId')
  if (!clientId) {
    clientId = `client-${crypto.randomUUID()}`
    localStorage.setItem('691_clientId', clientId)
  }

  socket.on('connect', () => {
    if (bookingId) socket.emit('register_booking_view', { bookingId, accessToken })
    else {
      socket.emit('register_client', { clientId })
      socket.emit('restore_session', { clientId, accessToken })
    }
  })

  socket.on('session_restored', (data) => {
    if (!data) return
    applyBookingStatus(data.status || data.booking?.status || 'pending', data.booking?.bookingId || '')
  })
  socket.on('session_not_found', () => applyBookingStatus('pending'))
  socket.on('booking_accepted', data => data && applyBookingStatus('accepted', data.bookingId))
  socket.on('booking_rejected', data => data && applyBookingStatus('rejected', data.bookingId))
  socket.on('booking_status_update', data => data && applyBookingStatus(data.status || 'pending', data.bookingId))
  socket.on('driver_arrived', data => data && applyBookingStatus('arrived', data.bookingId))
  socket.on('booking_completed', data => data && applyBookingStatus('completed', data.bookingId))
  socket.on('booking_cancelled', data => data && applyBookingStatus('cancelled', data.bookingId))
  socket.on('booking_view_error', data => {
    console.warn('Falha ao registar vista da reserva:', data?.error || 'erro desconhecido')
    applyBookingStatus('pending')
  })
})()
