(() => {
  'use strict'

  const params = new URLSearchParams(window.location.search)
  const supported = ['pt', 'en']
  const requested = (params.get('lang') || '').toLowerCase()
  const browser = (navigator.language || 'pt').split('-')[0].toLowerCase()
  const lang = supported.includes(requested) ? requested : (supported.includes(browser) ? browser : 'en')

  const translations = {
    pt: {
      active: 'Reserva ativa',
      heading: 'Estado da sua reserva',
      call: 'Chamada',
      callAria: 'Chamar +351 928 158 158',
      whatsappAria: 'Abrir WhatsApp',
      note: {
        pending: 'Recebemos o seu pedido. Aguarde a confirmação.',
        accepted: 'A sua reserva foi aceite. O motorista irá buscá-lo à hora marcada.',
        onway: 'O motorista está a caminho. Se precisar, pode contactar-nos.',
        arrived: 'O motorista já chegou ao local de recolha.',
        completed: 'Obrigado por viajar com a 691.pt.',
        rejected: 'Esta reserva não foi aceite. Pode tentar novamente ou falar connosco.',
        cancelled: 'A reserva foi cancelada. Se precisar, faça uma nova reserva.'
      },
      steps: { pending: 'Pedido', accepted: 'Aceite', onway: 'A caminho', arrived: 'Chegou' },
      status: { pending: 'A aguardar confirmação', accepted: 'Reserva aceite', onway: 'Motorista a caminho', arrived: 'Motorista chegou', completed: 'Viagem concluída', rejected: 'Reserva recusada', cancelled: 'Reserva cancelada' }
    },
    en: {
      active: 'Active booking', heading: 'Your booking status', call: 'Call', callAria: 'Call +351 928 158 158', whatsappAria: 'Open WhatsApp',
      note: { pending: 'We received your request. Please wait for confirmation.', accepted: 'Your booking has been accepted. The driver will pick you up at the scheduled time.', onway: 'The driver is on the way. You can contact us if needed.', arrived: 'The driver has arrived at the pickup point.', completed: 'Thank you for travelling with 691.pt.', rejected: 'This booking was not accepted. You can try again or contact us.', cancelled: 'The booking was cancelled. If needed, create a new booking.' },
      steps: { pending: 'Request', accepted: 'Accepted', onway: 'On the way', arrived: 'Arrived' },
      status: { pending: 'Awaiting confirmation', accepted: 'Booking accepted', onway: 'Driver is on the way', arrived: 'Driver has arrived', completed: 'Trip completed', rejected: 'Booking declined', cancelled: 'Booking cancelled' }
    }
  }

  const t = translations[lang] || translations.en
  document.documentElement.lang = lang

  const statusEl = document.getElementById('trip-status')
  const statusPill = document.getElementById('trip-status-pill')
  const noteEl = document.getElementById('trip-note')
  const captionEl = document.getElementById('trip-caption')
  const headerChip = document.getElementById('trip-header-chip')
  const stepLabels = {
    pending: document.getElementById('step-pending'),
    accepted: document.getElementById('step-accepted'),
    onway: document.getElementById('step-onway'),
    arrived: document.getElementById('step-arrived')
  }
  const callLabel = document.getElementById('btn-call-label')
  const signalLabel = document.getElementById('btn-signal-label')
  const callButton = document.getElementById('btn-call')
  const whatsappButton = document.getElementById('btn-whatsapp')

  if (captionEl) captionEl.textContent = t.heading
  if (headerChip) headerChip.textContent = t.active
  if (callLabel) callLabel.textContent = t.call
  if (signalLabel) signalLabel.textContent = 'WhatsApp'
  if (callButton) callButton.setAttribute('aria-label', t.callAria)
  if (whatsappButton) whatsappButton.setAttribute('aria-label', t.whatsappAria)
  Object.entries(stepLabels).forEach(([key, el]) => { if (el) el.textContent = t.steps[key] })

  const pathParts = window.location.pathname.split('/').filter(Boolean)
  const bookingIdFromPath = pathParts.length >= 2 && pathParts[0] === 'reserva' ? pathParts[1] : ''
  const bookingId = bookingIdFromPath || params.get('id') || ''
  const accessToken = params.get('token') || ''

  function updateSteps(status) {
    const order = ['pending', 'accepted', 'onway', 'arrived']
    const terminal = status === 'completed' || status === 'rejected' || status === 'cancelled'
    const activeIndex = status === 'completed' ? order.length - 1 : order.indexOf(status)

    document.querySelectorAll('.trip-step').forEach((stepEl, index) => {
      stepEl.classList.remove('is-active', 'is-complete', 'is-terminal')
      if (terminal) {
        if (status === 'completed') {
          stepEl.classList.add('is-complete')
        } else if (index === 0) {
          stepEl.classList.add('is-terminal')
        }
        return
      }
      if (activeIndex === -1) {
        if (index === 0) stepEl.classList.add('is-active')
        return
      }
      if (index < activeIndex) stepEl.classList.add('is-complete')
      else if (index === activeIndex) stepEl.classList.add('is-active')
    })
  }

  function applyBookingStatus(status, eventBookingId = '') {
    if (!statusEl) return
    if (eventBookingId && bookingId && eventBookingId !== bookingId) return

    const safeStatus = Object.prototype.hasOwnProperty.call(t.status, status) ? status : 'pending'
    const statusText = t.status[safeStatus]
    statusEl.textContent = statusText
    statusEl.dataset.status = safeStatus

    if (statusPill) {
      statusPill.textContent = statusText
      statusPill.className = `trip-status-pill status-${safeStatus}`
    }
    if (noteEl) noteEl.textContent = t.note[safeStatus] || t.note.pending
    updateSteps(safeStatus)

    const terminal = safeStatus === 'completed' || safeStatus === 'rejected' || safeStatus === 'cancelled'
    document.title = `691.pt — ${terminal ? statusText : t.active}`
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
  socket.on('booking_closed', data => {
    if (!data || (bookingId && data.bookingId !== bookingId)) return
    localStorage.removeItem('691_booking')
    window.location.replace('/')
  })
  socket.on('booking_view_error', data => {
    console.warn('Falha ao registar vista da reserva:', data?.error || 'erro desconhecido')
    applyBookingStatus('pending')
  })
})()
