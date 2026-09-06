(() => {
  'use strict'

  const params = new URLSearchParams(window.location.search)
  const supported = ['pt', 'en', 'fr', 'es', 'de', 'it', 'zh', 'ja', 'ru', 'nl', 'pl']
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
    },
    fr: {
      active: 'Réservation active', heading: 'État de votre réservation', call: 'Appel', callAria: 'Appeler le +351 928 158 158', whatsappAria: 'Ouvrir WhatsApp',
      note: { pending: 'Nous avons reçu votre demande. Veuillez attendre la confirmation.', accepted: 'Votre réservation a été acceptée. Le chauffeur viendra vous chercher à l’heure prévue.', onway: 'Le chauffeur est en route. Vous pouvez nous contacter si besoin.', arrived: 'Le chauffeur est arrivé au point de prise en charge.', completed: 'Merci d’avoir voyagé avec 691.pt.', rejected: 'Cette réservation n’a pas été acceptée. Vous pouvez réessayer ou nous contacter.', cancelled: 'La réservation a été annulée. Si besoin, faites une nouvelle réservation.' },
      steps: { pending: 'Demande', accepted: 'Acceptée', onway: 'En route', arrived: 'Arrivé' },
      status: { pending: 'En attente de confirmation', accepted: 'Réservation acceptée', onway: 'Le chauffeur est en route', arrived: 'Le chauffeur est arrivé', completed: 'Trajet terminé', rejected: 'Réservation refusée', cancelled: 'Réservation annulée' }
    },
    es: {
      active: 'Reserva activa', heading: 'Estado de su reserva', call: 'Llamar', callAria: 'Llamar al +351 928 158 158', whatsappAria: 'Abrir WhatsApp',
      note: { pending: 'Hemos recibido su solicitud. Espere la confirmación.', accepted: 'Su reserva ha sido aceptada. El conductor le recogerá a la hora prevista.', onway: 'El conductor está en camino. Puede contactarnos si lo necesita.', arrived: 'El conductor ya ha llegado al punto de recogida.', completed: 'Gracias por viajar con 691.pt.', rejected: 'Esta reserva no fue aceptada. Puede intentarlo de nuevo o contactarnos.', cancelled: 'La reserva ha sido cancelada. Si lo necesita, haga una nueva reserva.' },
      steps: { pending: 'Solicitud', accepted: 'Aceptada', onway: 'En camino', arrived: 'Llegó' },
      status: { pending: 'Esperando confirmación', accepted: 'Reserva aceptada', onway: 'El conductor está en camino', arrived: 'El conductor ha llegado', completed: 'Viaje completado', rejected: 'Reserva rechazada', cancelled: 'Reserva cancelada' }
    },
    de: {
      active: 'Aktive Buchung', heading: 'Status Ihrer Buchung', call: 'Anrufen', callAria: '+351 928 158 158 anrufen', whatsappAria: 'WhatsApp öffnen',
      note: { pending: 'Wir haben Ihre Anfrage erhalten. Bitte warten Sie auf die Bestätigung.', accepted: 'Ihre Buchung wurde angenommen. Der Fahrer holt Sie zur vereinbarten Zeit ab.', onway: 'Der Fahrer ist unterwegs. Bei Bedarf können Sie uns kontaktieren.', arrived: 'Der Fahrer ist am Abholort angekommen.', completed: 'Danke, dass Sie mit 691.pt gefahren sind.', rejected: 'Diese Buchung wurde nicht angenommen. Sie können es erneut versuchen oder uns kontaktieren.', cancelled: 'Die Buchung wurde storniert. Falls nötig, erstellen Sie bitte eine neue Buchung.' },
      steps: { pending: 'Anfrage', accepted: 'Angenommen', onway: 'Unterwegs', arrived: 'Angekommen' },
      status: { pending: 'Bestätigung ausstehend', accepted: 'Buchung angenommen', onway: 'Fahrer ist unterwegs', arrived: 'Fahrer ist angekommen', completed: 'Fahrt abgeschlossen', rejected: 'Buchung abgelehnt', cancelled: 'Buchung storniert' }
    },
    it: {
      active: 'Prenotazione attiva', heading: 'Stato della prenotazione', call: 'Chiama', callAria: 'Chiama +351 928 158 158', whatsappAria: 'Apri WhatsApp',
      note: { pending: 'Abbiamo ricevuto la tua richiesta. Attendi la conferma.', accepted: 'La tua prenotazione è stata accettata. L’autista verrà a prenderti all’orario previsto.', onway: 'L’autista è in arrivo. Se necessario puoi contattarci.', arrived: 'L’autista è arrivato al punto di ritiro.', completed: 'Grazie per aver viaggiato con 691.pt.', rejected: 'Questa prenotazione non è stata accettata. Puoi riprovare o contattarci.', cancelled: 'La prenotazione è stata annullata. Se necessario, effettua una nuova prenotazione.' },
      steps: { pending: 'Richiesta', accepted: 'Accettata', onway: 'In arrivo', arrived: 'Arrivato' },
      status: { pending: 'In attesa di conferma', accepted: 'Prenotazione accettata', onway: 'L’autista è in viaggio', arrived: 'L’autista è arrivato', completed: 'Viaggio completato', rejected: 'Prenotazione rifiutata', cancelled: 'Prenotazione annullata' }
    },
    zh: {
      active: '当前预订', heading: '您的预订状态', call: '电话', callAria: '拨打 +351 928 158 158', whatsappAria: '打开 WhatsApp',
      note: { pending: '我们已收到您的请求，请等待确认。', accepted: '您的预订已接受，司机会按约定时间接您。', onway: '司机正在前往，如有需要可随时联系我们。', arrived: '司机已到达接送地点。', completed: '感谢您选择 691.pt。', rejected: '该预订未被接受，您可以重新尝试或联系我们。', cancelled: '预订已取消，如有需要请重新预订。' },
      steps: { pending: '请求', accepted: '已接受', onway: '前往中', arrived: '已到达' },
      status: { pending: '等待确认', accepted: '预订已接受', onway: '司机正在前往', arrived: '司机已到达', completed: '行程已完成', rejected: '预订已拒绝', cancelled: '预订已取消' }
    },
    ja: {
      active: '予約中', heading: '予約状況', call: '電話', callAria: '+351 928 158 158 に電話', whatsappAria: 'WhatsApp を開く',
      note: { pending: 'ご予約依頼を受け付けました。確認をお待ちください。', accepted: '予約が承認されました。ドライバーが予定時刻にお迎えに向かいます。', onway: 'ドライバーが向かっています。必要であればご連絡ください。', arrived: 'ドライバーが乗車場所に到着しました。', completed: '691.pt をご利用いただきありがとうございました。', rejected: 'この予約は承認されませんでした。再度お試しいただくかご連絡ください。', cancelled: '予約はキャンセルされました。必要であれば新しく予約してください。' },
      steps: { pending: '依頼', accepted: '承認', onway: '向かっています', arrived: '到着' },
      status: { pending: '確認待ち', accepted: '予約が承認されました', onway: 'ドライバーが向かっています', arrived: 'ドライバーが到着しました', completed: '旅行が完了しました', rejected: '予約が拒否されました', cancelled: '予約がキャンセルされました' }
    },
    ru: {
      active: 'Активный заказ', heading: 'Статус вашего заказа', call: 'Позвонить', callAria: 'Позвонить +351 928 158 158', whatsappAria: 'Открыть WhatsApp',
      note: { pending: 'Мы получили ваш запрос. Пожалуйста, дождитесь подтверждения.', accepted: 'Ваш заказ принят. Водитель приедет в назначенное время.', onway: 'Водитель в пути. При необходимости свяжитесь с нами.', arrived: 'Водитель уже прибыл к месту подачи.', completed: 'Спасибо, что выбрали 691.pt.', rejected: 'Этот заказ не был принят. Вы можете попробовать снова или связаться с нами.', cancelled: 'Заказ отменён. При необходимости создайте новый заказ.' },
      steps: { pending: 'Запрос', accepted: 'Принят', onway: 'В пути', arrived: 'Прибыл' },
      status: { pending: 'Ожидание подтверждения', accepted: 'Заказ принят', onway: 'Водитель в пути', arrived: 'Водитель прибыл', completed: 'Поездка завершена', rejected: 'Заказ отклонён', cancelled: 'Заказ отменён' }
    },
    nl: {
      active: 'Actieve reservering', heading: 'Status van uw reservering', call: 'Bellen', callAria: 'Bel +351 928 158 158', whatsappAria: 'WhatsApp openen',
      note: { pending: 'We hebben uw aanvraag ontvangen. Wacht alstublieft op bevestiging.', accepted: 'Uw reservering is geaccepteerd. De chauffeur haalt u op het afgesproken tijdstip op.', onway: 'De chauffeur is onderweg. Indien nodig kunt u contact met ons opnemen.', arrived: 'De chauffeur is aangekomen op de ophaallocatie.', completed: 'Bedankt dat u met 691.pt heeft gereisd.', rejected: 'Deze reservering is niet geaccepteerd. U kunt het opnieuw proberen of contact met ons opnemen.', cancelled: 'De reservering is geannuleerd. Maak indien nodig een nieuwe reservering.' },
      steps: { pending: 'Aanvraag', accepted: 'Geaccepteerd', onway: 'Onderweg', arrived: 'Aangekomen' },
      status: { pending: 'Wachten op bevestiging', accepted: 'Reservering geaccepteerd', onway: 'Chauffeur is onderweg', arrived: 'Chauffeur is gearriveerd', completed: 'Rit voltooid', rejected: 'Reservering afgewezen', cancelled: 'Reservering geannuleerd' }
    },
    pl: {
      active: 'Aktywna rezerwacja', heading: 'Status rezerwacji', call: 'Zadzwoń', callAria: 'Zadzwoń pod +351 928 158 158', whatsappAria: 'Otwórz WhatsApp',
      note: { pending: 'Otrzymaliśmy Twoje zgłoszenie. Proszę czekać na potwierdzenie.', accepted: 'Twoja rezerwacja została zaakceptowana. Kierowca odbierze Cię o ustalonej godzinie.', onway: 'Kierowca jest w drodze. W razie potrzeby możesz się z nami skontaktować.', arrived: 'Kierowca dotarł już do miejsca odbioru.', completed: 'Dziękujemy za podróż z 691.pt.', rejected: 'Ta rezerwacja nie została zaakceptowana. Możesz spróbować ponownie lub skontaktować się z nami.', cancelled: 'Rezerwacja została anulowana. W razie potrzeby utwórz nową rezerwację.' },
      steps: { pending: 'Zgłoszenie', accepted: 'Akceptacja', onway: 'W drodze', arrived: 'Przybył' },
      status: { pending: 'Oczekiwanie na potwierdzenie', accepted: 'Rezerwacja zaakceptowana', onway: 'Kierowca jest w drodze', arrived: 'Kierowca przyjechał', completed: 'Podróż zakończona', rejected: 'Rezerwacja odrzucona', cancelled: 'Rezerwacja anulowana' }
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
  socket.on('booking_view_error', data => {
    console.warn('Falha ao registar vista da reserva:', data?.error || 'erro desconhecido')
    applyBookingStatus('pending')
  })
})()
