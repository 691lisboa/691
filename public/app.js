// ── Lazy-load addresses.js (large file) ─────────────────────────────
        let _addressesLoading = null;
        function loadAddressesJs() {
            if (typeof window.searchAddresses === 'function') return Promise.resolve(true);
            if (_addressesLoading) return _addressesLoading;
            _addressesLoading = new Promise((resolve) => {
                const s = document.createElement('script');
                s.src = '/addresses.js';
                s.async = true;
                s.onload = () => resolve(true);
                s.onerror = () => resolve(false);
                document.head.appendChild(s);
            });
            return _addressesLoading;
        }

        // Minimal local fallback list (keeps autocomplete usable even without addresses.js)
        const portugueseAddresses = [
            "Aeroporto Humberto Delgado, Lisboa",
            "Gare do Oriente, Lisboa",
            "Estação Santa Apolónia, Lisboa",
            "Avenida da Liberdade, Lisboa",
            "Praça do Comércio, Lisboa",
            "Torre de Belém, Lisboa",
            "Mosteiro dos Jerónimos, Lisboa",
            "Hospital de Santa Maria, Lisboa"
        ];

        // Traduções da interface do cliente.
        const translations = {
            pt: {
                title: '691.pt', subtitle: 'Táxi Lisboa', nameLabel: 'Nome', phoneLabel: 'Telefone', dateLabel: 'Data de recolha', timeLabel: 'Hora de recolha', pickupLabel: 'Local de Recolha', destinationLabel: 'Destino', submitButton: 'Reservar Táxi', whatsappChat: 'Falar com o Motorista', cancelButton: '❌ Cancelar Reserva', bookingTitle: 'Reserva ativa', bookingPending: 'A aguardar confirmação', bookingAccepted: 'Reserva aceite', driverArrived: 'O motorista chegou', driverOnTheWay: 'Motorista a caminho', bookingRejected: 'Reserva recusada', bookingCancelled: 'Reserva cancelada', bookingCompleted: 'Viagem concluída', noBookings: 'Sem reservas ativas', bookingDetailsTitle: 'Detalhes da reserva', successMessage: '✅ Reserva enviada com sucesso!', youLabel: 'Você', errorGeneric: '❌ Erro ao enviar a reserva.', errorConnection: '❌ Erro de ligação.', cancelError: '❌ Não foi possível cancelar a reserva. Tente novamente.', namePlaceholder: 'Seu nome', phonePlaceholder: 'Seu telefone', pickupPlaceholder: 'Local de recolha', destPlaceholder: 'Destino', validationName: 'Por favor, preencha o nome', validationNameInvalid: 'Nome inválido (mínimo 2 letras)', validationPhone: 'Por favor, preencha o telefone', validationPhoneInvalid: 'Telefone inválido (mínimo 7 dígitos)', validationPickup: 'Por favor, preencha o local de recolha', validationDestination: 'Por favor, preencha o destino', validationDate: 'Por favor, escolha a data', validationTime: 'Por favor, escolha a hora', validationDatePast: 'Escolha hoje ou uma data futura', validationDateTimePast: 'Escolha uma hora futura para a recolha', enableNotifications: '⚠️ Ative as notificações para receber atualizações da sua reserva.\n\nNo navegador: definições do site → Notificações → Permitir', pickupLabelShort: 'Recolha', destLabelShort: 'Destino'
            },
            en: {
                title: '691.pt', subtitle: 'Lisbon Taxi', nameLabel: 'Name', phoneLabel: 'Phone', dateLabel: 'Pickup date', timeLabel: 'Pickup time', pickupLabel: 'Pickup location', destinationLabel: 'Destination', submitButton: 'Book Taxi', whatsappChat: 'Talk to the Driver', cancelButton: '❌ Cancel Booking', bookingTitle: 'Active booking', bookingPending: 'Awaiting confirmation', bookingAccepted: 'Booking accepted', driverArrived: 'Driver arrived', driverOnTheWay: 'Driver is on the way', bookingRejected: 'Booking declined', bookingCancelled: 'Booking cancelled', bookingCompleted: 'Trip completed', noBookings: 'No active bookings', bookingDetailsTitle: 'Booking details', successMessage: '✅ Booking sent successfully!', youLabel: 'You', errorGeneric: '❌ Error sending booking.', errorConnection: '❌ Connection error.', cancelError: '❌ The booking could not be cancelled. Please try again.', namePlaceholder: 'Your name', phonePlaceholder: 'Your phone', pickupPlaceholder: 'Pickup address', destPlaceholder: 'Destination address', validationName: 'Please enter your name', validationNameInvalid: 'Invalid name (minimum 2 characters)', validationPhone: 'Please enter your phone number', validationPhoneInvalid: 'Invalid phone number (minimum 7 digits)', validationPickup: 'Please enter the pickup location', validationDestination: 'Please enter the destination', validationDate: 'Please select a date', validationTime: 'Please select a time', validationDatePast: 'Please choose today or a future date', validationDateTimePast: 'Please choose a future pickup time', enableNotifications: '⚠️ Enable notifications to receive booking updates.\n\nBrowser site settings → Notifications → Allow', pickupLabelShort: 'Pickup', destLabelShort: 'Destination'
            }
        };


        const footerTranslations = {
            pt: { legal: 'Informação Legal', privacy: 'Privacidade', complaints: 'Livro de Reclamações' },
            en: { legal: 'Legal Information', privacy: 'Privacy', complaints: 'Complaints Book' }
        };

        let currentLang = 'pt';
        let socket = null;
        let currentBooking = null;
        let currentStatus = 'pending';
        let isConnected = false;
        let pendingPushStatus = null; // armazena push recebido antes de session_restored

        // clientId persiste no localStorage para sobreviver a refreshes
        let clientId = localStorage.getItem('691_clientId');
        if (!clientId) {
            clientId = 'client-' + crypto.randomUUID();
            localStorage.setItem('691_clientId', clientId);
        }

        // Autocomplete: TomTom Search API (proxy /api/search) com fallback local
        let _acTimer = null;
        function normalizeSuggestion(raw) {
            if (typeof raw === 'string') {
                return { label: raw, lat: '', lon: '' };
            }
            if (!raw || typeof raw !== 'object') {
                return { label: '', lat: '', lon: '' };
            }
            return {
                label: String(raw.label || raw.address || raw.name || '').trim(),
                lat: raw.lat ?? '',
                lon: raw.lon ?? ''
            };
        }
        async function fetchSuggestions(query) {
            try {
                const res = await fetch('/api/search?q=' + encodeURIComponent(query));
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) return data.map(normalizeSuggestion).filter(item => item.label);
                }
            } catch { /* ignore */ }
            // fallback: endereços locais
            if (typeof window.searchAddresses !== 'function') {
                // Attempt lazy load once when needed
                await loadAddressesJs();
            }
            if (typeof window.searchAddresses === 'function') return window.searchAddresses(query).map(normalizeSuggestion).filter(item => item.label);
            const q = String(query || '').toLowerCase();
            return portugueseAddresses.filter(addr => addr.toLowerCase().includes(q)).slice(0, 10).map(normalizeSuggestion).filter(item => item.label);
        }

        function setupAddressAutocomplete() {
            const pickupInput = document.getElementById('recolha');
            const destinationInput = document.getElementById('destino');

            // Proactively start loading addresses.js on first interaction
            if (pickupInput) pickupInput.addEventListener('focus', () => { loadAddressesJs(); }, { once: true });
            if (destinationInput) destinationInput.addEventListener('focus', () => { loadAddressesJs(); }, { once: true });

            [pickupInput, destinationInput].forEach(input => {
                if (!input) return;
                let currentFocus = -1;
                const formGroup = input.closest('.form-group') || input.parentElement;

                function setStoredCoords(targetInput, suggestion) {
                    if (!targetInput?.dataset) return;
                    if (!suggestion || !suggestion.lat || !suggestion.lon) {
                        delete targetInput.dataset.lat;
                        delete targetInput.dataset.lon;
                        return;
                    }
                    targetInput.dataset.lat = String(suggestion.lat);
                    targetInput.dataset.lon = String(suggestion.lon);
                }

                function openDropdown() {
                    autocompleteContainer.style.display = 'block';
                    input.setAttribute('aria-expanded', 'true');
                    formGroup?.classList.add('autocomplete-open');
                }

                function closeDropdown() {
                    autocompleteContainer.style.display = 'none';
                    input.setAttribute('aria-expanded', 'false');
                    input.removeAttribute('aria-activedescendant');
                    formGroup?.classList.remove('autocomplete-open');
                }

                // Create autocomplete container
                const autocompleteContainer = document.createElement('div');
                autocompleteContainer.className = 'autocomplete-items premium-autocomplete-dropdown';
                autocompleteContainer.id = `${input.id}-suggestions`;
                autocompleteContainer.setAttribute('role', 'listbox');
                input.setAttribute('role', 'combobox');
                input.setAttribute('aria-autocomplete', 'list');
                input.setAttribute('aria-controls', autocompleteContainer.id);
                input.setAttribute('aria-expanded', 'false');
                autocompleteContainer.style.position = 'absolute';
                autocompleteContainer.style.top = 'calc(100% + 6px)';
                autocompleteContainer.style.left = '0';
                autocompleteContainer.style.right = '0';
                autocompleteContainer.style.background = '#ffffff';
                autocompleteContainer.style.border = '1px solid #dbe2e8';
                autocompleteContainer.style.borderRadius = '16px';
                autocompleteContainer.style.maxHeight = '260px';
                autocompleteContainer.style.overflowY = 'auto';
                autocompleteContainer.style.zIndex = '9999';
                autocompleteContainer.style.boxShadow = '0 24px 48px rgba(11, 16, 21, 0.12)';
                autocompleteContainer.style.display = 'none';

                input.parentElement.style.position = 'relative';
                input.parentElement.appendChild(autocompleteContainer);

                input.addEventListener('input', function() {
                    setStoredCoords(input, null);
                    const value = this.value.trim();
                    if (!value || value.length < 2) {
                        closeDropdown();
                        return;
                    }

                    clearTimeout(_acTimer);
                    _acTimer = setTimeout(async () => {
                        const suggestions = await fetchSuggestions(value);
                        if (suggestions.length === 0) {
                            closeDropdown();
                            return;
                        }

                        currentFocus = -1;
                        autocompleteContainer.replaceChildren();
                        suggestions.forEach((suggestion, suggestionIndex) => {
                            const label = String(suggestion.label || '');
                            const item = document.createElement('div');
                            item.id = `${input.id}-suggestion-${suggestionIndex}`;
                            item.setAttribute('role', 'option');
                            item.setAttribute('aria-selected', 'false');
                            item.style.padding = '12px 15px';
                            item.style.cursor = 'pointer';
                            item.style.borderBottom = '1px solid #eef2f5';
                            item.style.color = '#0b1015';
                            item.style.fontSize = '0.9rem';
                            item.style.background = '#ffffff';
                            const strong = document.createElement('strong');
                            strong.textContent = label.substring(0, value.length);
                            strong.style.fontWeight = '700';
                            strong.style.color = '#0b1015';
                            item.appendChild(strong);
                            item.appendChild(document.createTextNode(label.substring(value.length)));

                            item.addEventListener('click', function() {
                                input.value = label;
                                setStoredCoords(input, suggestion);
                                closeDropdown();
                            });

                            item.addEventListener('mouseenter', function() {
                                this.style.background = '#f4f7f9';
                            });

                            item.addEventListener('mouseleave', function() {
                                this.style.background = '#ffffff';
                            });

                            autocompleteContainer.appendChild(item);
                        });

                        openDropdown();
                    }, 300);
                });
                
                input.addEventListener('keydown', function(e) {
                    const items = autocompleteContainer.getElementsByTagName('div');
                    if (e.keyCode === 40) { // DOWN
                        currentFocus++;
                        addActive(items);
                    } else if (e.keyCode === 38) { // UP
                        currentFocus--;
                        addActive(items);
                    } else if (e.keyCode === 13) { // ENTER
                        e.preventDefault();
                        if (currentFocus > -1 && items[currentFocus]) {
                            items[currentFocus].click();
                        }
                    } else if (e.keyCode === 27) { // ESC
                        closeDropdown();
                    }
                });
                
                function addActive(items) {
                    if (!items || !items.length) return false;
                    removeActive(items);
                    if (currentFocus >= items.length) currentFocus = 0;
                    if (currentFocus < 0) currentFocus = (items.length - 1);
                    const activeItem = items[currentFocus];
                    activeItem.style.background = '#f4f7f9';
                    activeItem.setAttribute('aria-selected', 'true');
                    input.setAttribute('aria-activedescendant', activeItem.id);
                }
                
                function removeActive(items) {
                    for (let item of items) {
                        item.style.background = '#ffffff';
                        item.setAttribute('aria-selected', 'false');
                    }
                    input.removeAttribute('aria-activedescendant');
                }
            });
            
            // Close autocomplete when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('#recolha, #destino, .premium-autocomplete-dropdown')) {
                    document.querySelectorAll('.autocomplete-items').forEach(item => {
                        item.style.display = 'none';
                    });
                    document.querySelectorAll('.form-group.autocomplete-open').forEach(item => {
                        item.classList.remove('autocomplete-open');
                    });
                }
            });
        }

        // Initialize socket connection
        function initSocket() {
            socket = io();

            socket.on('connect', () => {
                updateStatus(true);
                socket.emit('register_client', { clientId });
                // Restaurar apenas com o token privado emitido para a própria reserva.
                let restoreAccessToken = currentBooking?.accessToken || '';
                if (!restoreAccessToken) {
                    try {
                        restoreAccessToken = JSON.parse(localStorage.getItem('691_booking') || '{}')?.accessToken || '';
                    } catch { restoreAccessToken = ''; }
                }
                socket.emit('restore_session', { clientId, accessToken: restoreAccessToken });
            });

            // Servidor encontrou reserva ativa para este clientId
            socket.on('session_restored', (data) => {
                const st = data.status || data.booking?.status || 'pending';

                if (data.booking && !currentBooking) {
                    // Verificar estados finais primeiro - não mostrar booking se já estiver concluído
                    if (['completed','rejected','cancelled'].includes(st)) {
                        localStorage.removeItem('691_booking');
                        // Garantir que volta ao menu inicial mesmo se browser foi reaberto
                        hideBooking();
                        return;
                    }

                    // Restauração inicial (página nova)
                    currentBooking = data.booking;
                    displayBooking(data.booking);
                    updateBookingStatus(st);

                    openBookingWindow();
                    if (pendingPushStatus?.bookingId === data.booking.bookingId) {
                        const pst = pendingPushStatus;
                        pendingPushStatus = null;
                        applyPushStatus(pst);
                    }

                } else if (data.booking && currentBooking?.bookingId === data.booking.bookingId && st !== currentStatus) {
                    // Reconexão: sincronizar estado que pode ter mudado durante desligação
                    updateBookingStatus(st);
                }
            });

            // Sem confirmação do servidor não mostramos uma reserva apenas local/stale.
            socket.on('session_not_found', () => {
                localStorage.removeItem('691_booking');
                currentBooking = null;
                hideBooking();
            });

            socket.on('push_subscription_invalid', async (data) => {
                console.warn('[Push] Server rejected old subscription:', data?.status);
                if (
                    'serviceWorker' in navigator &&
                    'PushManager' in window &&
                    'Notification' in window &&
                    Notification.permission === 'granted'
                ) {
                    try {
                        const reg = await navigator.serviceWorker.ready;
                        await registerPush(reg, true);
                    } catch (error) {
                        console.warn('[Push] Automatic subscription renewal failed:', error);
                    }
                }
            });

            socket.on('disconnect', () => {
                updateStatus(false);
                            });

            socket.on('driver_arrived', (data) => {
                if (currentBooking && currentBooking.bookingId === data.bookingId) {
                    updateBookingStatus('arrived');
                                        playSound();
                }
            });

            socket.on('booking_accepted', (data) => {
                if (currentBooking && currentBooking.bookingId === data.bookingId) {
                    updateBookingStatus('accepted');
                                        playSound();
                }
            });

            socket.on('booking_rejected', (data) => {
                if (currentBooking && currentBooking.bookingId === data.bookingId) {
                    localStorage.removeItem('691_booking');
                    updateBookingStatus('rejected');
                                        playSound();
                    setTimeout(() => { hideBooking(); }, 3000);
                }
            });

            socket.on('booking_cancelled', (data) => {
                if (currentBooking && currentBooking.bookingId === data.bookingId) {
                    localStorage.removeItem('691_booking');
                    updateBookingStatus('cancelled');
                    playSound();
                    setTimeout(() => { hideBooking(); }, 3000);
                }
            });

            // Fecho manual no Telegram: voltar imediatamente ao formulário principal.
            socket.on('booking_closed', (data) => {
                if (!currentBooking || !data || currentBooking.bookingId !== data.bookingId) return;
                localStorage.removeItem('691_booking');
                hideBooking();
                if (window.location.pathname !== '/') {
                    window.history.replaceState({}, '', '/');
                }
                window.requestAnimationFrame(() => {
                    const target = document.getElementById('reservar') || document.body;
                    target?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                });
            });

            socket.on('booking_completed', (data) => {
                if (currentBooking && currentBooking.bookingId === data.bookingId) {
                    localStorage.removeItem('691_booking');
                    updateBookingStatus('completed');
                                        playSound();
                    setTimeout(() => { hideBooking(); }, 5000);
                }
            });

            socket.on('booking_status_update', (data) => {
                if (currentBooking && currentBooking.bookingId === data.bookingId) {
                    const inferredStatus = normalizeBookingStatus(data.status) || inferStatusFromMessage(data.message);
                    openBookingWindow();
                    if (inferredStatus) {
                        updateBookingStatus(inferredStatus);
                    } else if (data.message) {
                        const windowStatusEl = document.getElementById('booking-window-status');
                        const statusEl = document.getElementById('booking-status');
                        const bookingLivePill = document.getElementById('booking-live-pill');
                        const bookingSummaryNote = document.getElementById('booking-summary-note');
                        if (windowStatusEl) windowStatusEl.textContent = data.message;
                        if (statusEl) statusEl.textContent = data.message;
                        if (bookingLivePill) bookingLivePill.textContent = data.message;
                        if (bookingSummaryNote) bookingSummaryNote.textContent = data.message;
                    }
                    playSound();
                }
            });
        }

        // Update language
        function updateLanguage(lang) {
            if (!lang) lang = 'pt';
            lang = lang.toLowerCase().startsWith('en') ? 'en' : 'pt';
            currentLang = lang;
            const t = translations[lang] || translations.en;
            const footerT = footerTranslations[lang] || footerTranslations.en;
            document.documentElement.lang = lang === 'pt' ? 'pt-PT' : 'en';
            
            document.getElementById('title').textContent = t.title;
            document.getElementById('subtitle').textContent = t.subtitle;
            document.getElementById('name-label').textContent = t.nameLabel;
            document.getElementById('phone-label').textContent = t.phoneLabel;
            document.getElementById('date-label').textContent = t.dateLabel;
            document.getElementById('time-label').textContent = t.timeLabel;
            document.getElementById('pickup-label').textContent = t.pickupLabel;
            document.getElementById('dest-label').textContent = t.destinationLabel;
            document.getElementById('submit-btn').textContent = t.submitButton;
            document.getElementById('whatsapp-chat-text').textContent = t.whatsappChat;

            const footerLegal = document.getElementById('footer-legal');
            const footerPrivacy = document.getElementById('footer-privacy');
            const footerComplaints = document.getElementById('footer-complaints');
            const premiumFooterLegal = document.getElementById('premium-footer-legal');
            const premiumFooterPrivacy = document.getElementById('premium-footer-privacy');
            const premiumFooterComplaints = document.getElementById('premium-footer-complaints');
            const encodedLang = encodeURIComponent(lang);
            if (footerLegal) {
                footerLegal.textContent = footerT.legal;
                footerLegal.href = `/legal.html?lang=${encodedLang}`;
            }
            if (footerPrivacy) {
                footerPrivacy.textContent = footerT.privacy;
                footerPrivacy.href = `/legal.html?lang=${encodedLang}#privacidade`;
            }
            if (footerComplaints) {
                footerComplaints.textContent = footerT.complaints;
                footerComplaints.href = `https://www.livroreclamacoes.pt/Inicio/?lang=${lang === 'pt' ? 'PT' : 'EN'}`;
            }
            if (premiumFooterLegal) {
                premiumFooterLegal.textContent = footerT.legal;
                premiumFooterLegal.href = `/legal.html?lang=${encodedLang}`;
            }
            if (premiumFooterPrivacy) {
                premiumFooterPrivacy.textContent = footerT.privacy;
                premiumFooterPrivacy.href = `/legal.html?lang=${encodedLang}#privacidade`;
            }
            if (premiumFooterComplaints) {
                premiumFooterComplaints.textContent = footerT.complaints;
                premiumFooterComplaints.href = `https://www.livroreclamacoes.pt/Inicio/?lang=${lang === 'pt' ? 'PT' : 'EN'}`;
            }
            const whatsappDriverText = document.getElementById('whatsapp-driver-text');
            if (whatsappDriverText) whatsappDriverText.textContent = t.whatsappChat;
            document.getElementById('booking-title').textContent = t.bookingTitle;
            const noBookingsText = document.getElementById('no-bookings-text');
            if (noBookingsText) noBookingsText.textContent = t.noBookings;
            // Form input placeholders
            document.getElementById('nome').placeholder      = t.namePlaceholder;
            document.getElementById('telefone').placeholder  = t.phonePlaceholder;
            document.getElementById('recolha').placeholder   = t.pickupPlaceholder;
            document.getElementById('destino').placeholder   = t.destPlaceholder;

            // Booking window
            const bwTitle = document.getElementById('booking-window-title');
            if (bwTitle) bwTitle.textContent = t.bookingTitle;
            const bDetailsTitle = document.getElementById('booking-details-title');
            if (bDetailsTitle) bDetailsTitle.textContent = t.bookingDetailsTitle;
            const bookingHeaderSub = document.querySelector('.booking-header-sub');
            if (bookingHeaderSub) bookingHeaderSub.textContent = ({pt:'Estado em tempo real da sua reserva',en:'Live status of your booking',fr:'État en temps réel de votre réservation',es:'Estado en tiempo real de su reserva',de:'Live-Status Ihrer Buchung',it:'Stato in tempo reale della prenotazione',zh:'您的预订实时状态',ja:'ご予約のリアルタイム状況',ru:'Статус вашего заказа в реальном времени',nl:'Live status van uw reservering',pl:'Status rezerwacji w czasie rzeczywistym'})[lang] || 'Live status of your booking';
            const bookingSectionKicker = document.querySelector('.booking-section-kicker');
            if (bookingSectionKicker) bookingSectionKicker.textContent = ({pt:'DETALHES DA RESERVA',en:'BOOKING DETAILS',fr:'DÉTAILS DE LA RÉSERVATION',es:'DETALLES DE LA RESERVA',de:'BUCHUNGSDETAILS',it:'DETTAGLI DELLA PRENOTAZIONE',zh:'预订详情',ja:'予約内容',ru:'ДЕТАЛИ БРОНИРОВАНИЯ',nl:'RESERVERINGSGEGEVENS',pl:'SZCZEGÓŁY REZERWACJI'})[lang] || 'BOOKING DETAILS';
            const bookingWindowEyebrow = document.getElementById('booking-window-eyebrow');
            if (bookingWindowEyebrow) bookingWindowEyebrow.textContent = ({pt:'Acompanhar reserva',en:'Track booking',fr:'Suivre la réservation',es:'Seguir reserva',de:'Buchung verfolgen',it:'Segui prenotazione',zh:'跟踪预订',ja:'予約を確認',ru:'Отследить бронирование',nl:'Boeking volgen',pl:'Śledź rezerwację'})[lang] || 'Track booking';
            const bookingStatusKicker = document.getElementById('booking-status-kicker');
            if (bookingStatusKicker) bookingStatusKicker.textContent = ({pt:'ESTADO DA VIAGEM',en:'TRIP STATUS',fr:'STATUT DU TRAJET',es:'ESTADO DEL VIAJE',de:'FAHRTSTATUS',it:'STATO DEL VIAGGIO',zh:'行程状态',ja:'配車状況',ru:'СТАТУС ПОЕЗДКИ',nl:'RITSTATUS',pl:'STATUS PRZEJAZDU'})[lang] || 'TRIP STATUS';
            const bookingContactKicker = document.getElementById('booking-contact-kicker');
            if (bookingContactKicker) bookingContactKicker.textContent = ({pt:'CONTACTO',en:'CONTACT',fr:'CONTACT',es:'CONTACTO',de:'KONTAKT',it:'CONTATTO',zh:'联系',ja:'連絡先',ru:'КОНТАКТ',nl:'CONTACT',pl:'KONTAKT'})[lang] || 'CONTACT';
            const bookingContactNote = document.getElementById('booking-contact-note');
            if (bookingContactNote) bookingContactNote.textContent = ({pt:'Se precisar, fale diretamente connosco.',en:'If needed, contact us directly.',fr:'Si besoin, contactez-nous directement.',es:'Si lo necesita, contáctenos directamente.',de:'Falls nötig, kontaktieren Sie uns direkt.',it:'Se necessario, contattaci direttamente.',zh:'如有需要，请直接联系我们。',ja:'必要であれば直接ご連絡ください。',ru:'При необходимости свяжитесь с нами напрямую.',nl:'Neem indien nodig rechtstreeks contact met ons op.',pl:'W razie potrzeby skontaktuj się z nami bezpośrednio.'})[lang] || 'If needed, contact us directly.';
            const progressPending = document.getElementById('progress-pending');
            const progressAccepted = document.getElementById('progress-accepted');
            const progressOnway = document.getElementById('progress-onway');
            const progressArrived = document.getElementById('progress-arrived');
            if (progressPending) progressPending.textContent = ({pt:'Pedido',en:'Request',fr:'Demande',es:'Solicitud',de:'Anfrage',it:'Richiesta',zh:'请求',ja:'依頼',ru:'Запрос',nl:'Aanvraag',pl:'Zgłoszenie'})[lang] || 'Request';
            if (progressAccepted) progressAccepted.textContent = ({pt:'Aceite',en:'Accepted',fr:'Acceptée',es:'Aceptada',de:'Angenommen',it:'Accettata',zh:'已接受',ja:'承認',ru:'Принят',nl:'Geaccepteerd',pl:'Akceptacja'})[lang] || 'Accepted';
            if (progressOnway) progressOnway.textContent = ({pt:'A caminho',en:'On the way',fr:'En route',es:'En camino',de:'Unterwegs',it:'In arrivo',zh:'前往中',ja:'向かっています',ru:'В пути',nl:'Onderweg',pl:'W drodze'})[lang] || 'On the way';
            if (progressArrived) progressArrived.textContent = ({pt:'Chegou',en:'Arrived',fr:'Arrivé',es:'Llegó',de:'Angekommen',it:'Arrivato',zh:'已到达',ja:'到着',ru:'Прибыл',nl:'Aangekomen',pl:'Przybył'})[lang] || 'Arrived';
            const bookingSummaryNote = document.getElementById('booking-summary-note');
            if (bookingSummaryNote) bookingSummaryNote.textContent = getStatusNote(currentStatus, lang);

            // Booking info panel buttons
            const cancelBtn = document.getElementById('cancel-btn');
            if (cancelBtn) cancelBtn.textContent = t.cancelButton;
            const windowCancelBtn = document.getElementById('window-cancel-btn');
            if (windowCancelBtn) windowCancelBtn.textContent = t.cancelButton;

            // Success message
            const successMsg = document.getElementById('success-message');
            if (successMsg && !successMsg.classList.contains('show')) successMsg.textContent = t.successMessage;

            // Update validation messages on form fields (title only for hover, no custom validity)
            const nomeInput = document.getElementById('nome');
            const telefoneInput = document.getElementById('telefone');
            const recolhaInput = document.getElementById('recolha');
            const destinoInput = document.getElementById('destino');
            const dateInput = document.getElementById('data');
            const timeInput = document.getElementById('hora');
            if (nomeInput) nomeInput.title = t.validationName;
            if (telefoneInput) telefoneInput.title = t.validationPhone;
            if (dateInput) dateInput.title = t.validationDate || 'Please select a date';
            if (timeInput) timeInput.title = t.validationTime || 'Please select a time';
            if (recolhaInput) recolhaInput.title = t.validationPickup;
            if (destinoInput) destinoInput.title = t.validationDestination;
            applyDateTimeConstraints();

            // Re-render booking status badge in the new language
            if (currentBooking) updateBookingStatus(currentStatus);
            
            // Re-render connection status in the new language
            updateStatus(isConnected);
        }

        // Display booking info
        function displayBooking(booking) {
            currentBooking = booking;
            const bookingInfo = document.getElementById('booking-info');
            const noBookings  = document.getElementById('no-bookings');
            const taxiForm    = document.getElementById('taxi-form');
            const mainContactFab = document.getElementById('main-contact-fab');

            if (noBookings) noBookings.style.display = 'none';
            if (bookingInfo) bookingInfo.style.display = 'block';
            if (taxiForm) taxiForm.style.display = 'none';
            // Hide main contact buttons when booking is active
            if (mainContactFab) mainContactFab.style.display = 'none';

            updateBookingWindow(booking);
            updateBookingStatus('pending');

            // Abrir directamente a janela de detalhes
            openBookingWindow();
        }

        // Update booking window — Uber-style trip card (safe DOM, no innerHTML with user data)
        function updateBookingWindow(booking) {
            const bookingDetails = document.getElementById('booking-window-details');
            if (!bookingDetails) return;
            bookingDetails.replaceChildren();

            const t = translations[currentLang];

            // ── helpers ──────────────────────────────────────────────
            function el(tag, cls, txt) {
                const e = document.createElement(tag);
                if (cls) e.className = cls;
                if (txt !== undefined) e.textContent = txt;
                return e;
            }
            function divider() { return el('div', 'trip-divider'); }

            // ── card root ────────────────────────────────────────────
            const card = el('div', 'trip-card');

            // ── header: ID pill  +  date/time ───────────────────────
            const header = el('div', 'trip-header');
            header.appendChild(el('div', 'trip-id-pill', '#' + (booking.bookingId || '').slice(-8).toUpperCase()));
            const dtWrap = el('div', 'trip-datetime');
            dtWrap.appendChild(el('span', 'trip-date', booking.data  || ''));
            dtWrap.appendChild(el('span', 'trip-time', booking.hora  || ''));
            header.appendChild(dtWrap);
            card.appendChild(header);

            // ── passenger ────────────────────────────────────────────
            card.appendChild(divider());
            const pRow = el('div', 'trip-passenger');
            const avatar = el('div', 'trip-avatar', (booking.nome || '?')[0].toUpperCase());
            const pInfo  = el('div');
            pInfo.appendChild(el('div', 'trip-passenger-name',  booking.nome      || ''));
            pInfo.appendChild(el('div', 'trip-passenger-phone', booking.telefone  || ''));
            pRow.appendChild(avatar);
            pRow.appendChild(pInfo);
            card.appendChild(pRow);

            // ── route timeline ───────────────────────────────────────
            card.appendChild(divider());
            const route = el('div', 'trip-route');

            // pickup row
            const pickupRow   = el('div', 'trip-route-row');
            const pickupTrack = el('div', 'trip-route-track');
            pickupTrack.appendChild(el('div', 'trip-dot-pickup'));
            pickupTrack.appendChild(el('div', 'trip-connector'));
            const pickupInfo  = el('div', 'trip-route-info');
            pickupInfo.appendChild(el('div', 'trip-route-label',   t.pickupLabelShort));
            pickupInfo.appendChild(el('div', 'trip-route-address', booking.recolha || ''));
            pickupRow.appendChild(pickupTrack);
            pickupRow.appendChild(pickupInfo);

            // destination row
            const destRow   = el('div', 'trip-route-row');
            const destTrack = el('div', 'trip-route-track');
            destTrack.appendChild(el('div', 'trip-dot-dest'));
            const destInfo  = el('div', 'trip-route-info');
            destInfo.appendChild(el('div', 'trip-route-label',   t.destLabelShort));
            destInfo.appendChild(el('div', 'trip-route-address', booking.destino || ''));
            destRow.appendChild(destTrack);
            destRow.appendChild(destInfo);

            route.appendChild(pickupRow);
            route.appendChild(destRow);
            card.appendChild(route);

            bookingDetails.appendChild(card);
        }

        function getStatusNote(status, lang) {
            const notes = {
                pt: { pending: 'Recebemos o seu pedido. Aguarde a confirmação.', accepted: 'A reserva foi aceite. Estaremos consigo à hora marcada.', onway: 'O motorista está a caminho. Se precisar, pode falar connosco.', arrived: 'O motorista já chegou ao local de recolha.', completed: 'Obrigado por reservar com a 691.pt.', rejected: 'A reserva não foi aceite. Pode tentar novamente ou falar connosco.', cancelled: 'A reserva foi cancelada. Se precisar, pode fazer uma nova reserva.' },
                en: { pending: 'We received your request. Please wait for confirmation.', accepted: 'Your booking was accepted. We will meet you at the scheduled time.', onway: 'The driver is on the way. You can contact us if needed.', arrived: 'The driver has arrived at the pickup location.', completed: 'Thank you for booking with 691.pt.', rejected: 'The booking was not accepted. You can try again or contact us.', cancelled: 'The booking was cancelled. If needed, create a new booking.' }
            };
            const langNotes = notes[lang === 'en' ? 'en' : 'pt'];
            return langNotes[status] || langNotes.pending;
        }

        function normalizeBookingStatus(status) {
            const value = String(status || '').toLowerCase().trim();
            if (!value) return null;
            const aliases = {
                pending: 'pending', waiting: 'pending', requested: 'pending',
                accepted: 'accepted', accept: 'accepted', confirmed: 'accepted',
                onway: 'onway', on_way: 'onway', 'on-the-way': 'onway', driving: 'onway',
                arrived: 'arrived', arrival: 'arrived',
                completed: 'completed', complete: 'completed', finished: 'completed',
                rejected: 'rejected', reject: 'rejected', declined: 'rejected',
                cancelled: 'cancelled', canceled: 'cancelled', cancel: 'cancelled'
            };
            return aliases[value] || null;
        }

        function inferStatusFromMessage(message) {
            const msg = String(message || '').toLowerCase();
            if (!msg) return null;
            if (/(chegou|arriv|arrived|lleg|ankomm|到着|到达|прибыл|aangekomen|przyjechał)/.test(msg)) return 'arrived';
            if (/(a caminho|on the way|en route|en camino|unterwegs|in arrivo|в пути|onderweg|w drodze)/.test(msg)) return 'onway';
            if (/(aceit|accepted|acceptée|aceptad|angenommen|accett|принят|geaccepteerd|zaakcept)/.test(msg)) return 'accepted';
            if (/(cancel|cancelad|annul|storni|取消|отмен|geannuleerd)/.test(msg)) return 'cancelled';
            if (/(reject|recus|rechaz|refus|abgelehnt|rifiut|拒绝|отклон|afgewezen|odrzu)/.test(msg)) return 'rejected';
            if (/(complet|conclu|terminad|terminé|abgeschlossen|completato|完成|заверш|voltooid|zakończ)/.test(msg)) return 'completed';
            return null;
        }

        function updateBookingProgress(status) {
            const order = ['pending', 'accepted', 'onway', 'arrived'];
            const terminal = ['completed', 'rejected', 'cancelled'].includes(status);
            const activeIndex = status === 'completed' ? order.length - 1 : order.indexOf(status);
            const progress = document.getElementById('booking-progress');
            if (progress) progress.dataset.status = status;
            const progressItems = document.querySelectorAll('.booking-progress-step');
            progressItems.forEach((item, index) => {
                item.classList.remove('is-active', 'is-complete', 'is-terminal');
                item.removeAttribute('aria-current');
                if (terminal) {
                    if (status === 'completed') item.classList.add('is-complete');
                    else if (index === 0) item.classList.add('is-terminal');
                    return;
                }
                if (activeIndex === -1) {
                    if (index === 0) {
                        item.classList.add('is-active');
                        item.setAttribute('aria-current', 'step');
                    }
                    return;
                }
                if (index < activeIndex) item.classList.add('is-complete');
                else if (index === activeIndex) {
                    item.classList.add('is-active');
                    item.setAttribute('aria-current', 'step');
                }
            });
        }

        // Update booking status (persists to localStorage — excepto estados finais)
        function updateBookingStatus(status) {
            status = normalizeBookingStatus(status) || status || 'pending';
            currentStatus = status;
            if (currentBooking) {
                currentBooking.status = status;
                if (['completed','rejected','cancelled'].includes(status)) {
                    localStorage.removeItem('691_booking');
                } else if (currentBooking.accessToken) {
                    localStorage.setItem('691_booking', JSON.stringify(currentBooking));
                }
            }
            const t = translations[currentLang];
            const statusEl = document.getElementById('booking-status');
            const windowStatusEl = document.getElementById('booking-window-status');
            const whatsappSection = document.getElementById('whatsapp-section');
            const windowCancelBtn = document.getElementById('window-cancel-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const bookingLivePill = document.getElementById('booking-live-pill');
            const bookingSummaryNote = document.getElementById('booking-summary-note');
            const bookingWindowTitle = document.getElementById('booking-window-title');
            const statusText = getStatusText(status, t);
            if (statusEl) {
                statusEl.className = 'booking-status ' + status;
                statusEl.textContent = statusText;
            }
            if (windowStatusEl) {
                windowStatusEl.className = 'booking-status ' + status;
                windowStatusEl.textContent = statusText;
            }
            if (bookingLivePill) {
                bookingLivePill.className = 'booking-live-pill ' + status;
                bookingLivePill.textContent = statusText;
            }
            if (bookingSummaryNote) bookingSummaryNote.textContent = getStatusNote(status, currentLang);
            if (bookingWindowTitle) bookingWindowTitle.textContent = t.bookingTitle;
            updateBookingProgress(status);

            // Mostrar botão WhatsApp quando aceite, a caminho ou chegou
            if (whatsappSection) {
                if (status === 'accepted' || status === 'onway' || status === 'arrived') {
                    whatsappSection.style.display = 'block';
                } else {
                    whatsappSection.style.display = 'none';
                }
            }
            
            // Esconder botões de cancelamento quando motorista vai a caminho, chega, viagem é concluída, ou reserva é cancelada/recusada
            if (status === 'onway' || status === 'arrived' || status === 'completed' || status === 'cancelled' || status === 'rejected') {
                if (windowCancelBtn) windowCancelBtn.style.display = 'none';
                if (cancelBtn) cancelBtn.style.display = 'none';
            } else {
                if (windowCancelBtn) windowCancelBtn.style.display = 'block';
                if (cancelBtn) cancelBtn.style.display = 'block';
            }
        }

        // Get status text
        function getStatusText(status, t) {
            switch(status) {
                case 'pending':
                    return t.bookingPending;
                case 'accepted':
                    return t.bookingAccepted;
                case 'onway':
                    return t.driverOnTheWay || 'Motorista a caminho';
                case 'arrived':
                    return t.driverArrived;
                case 'rejected':
                    return t.bookingRejected;
                case 'cancelled':
                    return t.bookingCancelled;
                case 'completed':
                    return t.bookingCompleted;
                default:
                    return '';
            }
        }

        // Abrir janela de reserva programaticamente
        function openBookingWindow() {
            const bw = document.getElementById('booking-window');
            if (bw) bw.classList.add('show');
            document.body.classList.add('booking-active');
        }

        // Aplicar estado recebido via push (PUSH_STATUS ou session_restored)
        // pushData = { type, bookingId, message?, driverName? }
        function applyPushStatus(pushData) {
            const st = pushData.type;
            const bookingId = pushData.bookingId;
            if (!currentBooking || currentBooking.bookingId !== bookingId) return;
            
            if (st === 'message') {
                openBookingWindow();
                const inferredStatus = normalizeBookingStatus(pushData.status) || inferStatusFromMessage(pushData.message);
                if (inferredStatus) updateBookingStatus(inferredStatus);
                playSound();
            } else if (st === 'completed') {
                localStorage.removeItem('691_booking');
                updateBookingStatus('completed');
                                playSound();
                setTimeout(() => hideBooking(), 5000);
            } else if (st === 'rejected') {
                localStorage.removeItem('691_booking');
                updateBookingStatus('rejected');
                                playSound();
                setTimeout(() => hideBooking(), 3000);
            } else if (st === 'cancelled') {
                localStorage.removeItem('691_booking');
                updateBookingStatus('cancelled');
                                playSound();
                setTimeout(() => hideBooking(), 3000);
            } else if (st === 'accepted') {
                openBookingWindow();
                updateBookingStatus('accepted');
                                playSound();
            } else if (st === 'onway') {
                openBookingWindow();
                updateBookingStatus('onway');
                                playSound();
            } else if (st === 'arrived') {
                openBookingWindow();
                updateBookingStatus('arrived');
                                playSound();
            }
        }

        function syncCurrentBooking() {
            if (!socket || !socket.connected || !currentBooking?.bookingId) return;
            socket.emit('restore_session', {
                clientId,
                accessToken: currentBooking.accessToken || ''
            });
        }

        // Em mobile, o browser pode suspender o socket enquanto está em segundo plano.
        // Ao voltar à app/browser, confirmamos novamente se a reserva continua ativa.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') syncCurrentBooking();
        });
        window.addEventListener('pageshow', () => syncCurrentBooking());
        window.addEventListener('focus', () => syncCurrentBooking());

        // Hide booking
        function hideBooking() {
            const bookingInfo   = document.getElementById('booking-info');
            const noBookings    = document.getElementById('no-bookings');
            const bookingWindow = document.getElementById('booking-window');
            const taxiForm      = document.getElementById('taxi-form');
            const mainContactFab = document.getElementById('main-contact-fab');

            if (bookingInfo) bookingInfo.style.display = 'none';
            if (noBookings) noBookings.style.display  = 'block';
            if (taxiForm) taxiForm.style.display = 'block';
            if (bookingWindow) bookingWindow.classList.remove('show');
            document.body.classList.remove('booking-active');
            if (mainContactFab) mainContactFab.style.display = 'flex';

            currentBooking = null;
            currentStatus = 'pending';
        }

        // Show notification (toast)
        // Play sound
        function playSound() {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        }

        // Update status
        function updateStatus(connected) {
            isConnected = connected;
            const t = translations[currentLang];
            const text = connected ? t.connected : t.disconnected;

            const statusText = document.getElementById('status-text');
            const statusDot  = document.querySelector('.status-dot');
            const statusInd  = document.querySelector('.status-indicator');

            if (statusText) statusText.textContent = text;
            if (statusDot) statusDot.style.background = connected ? '#22c55e' : '#ef4444';
            if (statusInd) statusInd.style.opacity = connected ? '0.9' : '0.7';
        }

        function validationMessage(key, fallback) {
            const t = translations[currentLang] || translations.en || {};
            return t[key] || fallback;
        }

        function setFieldError(input, errorEl, message) {
            if (!input || !errorEl) return;
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }

        function clearFieldError(input, errorEl) {
            if (!input || !errorEl) return;
            input.classList.remove('error');
            input.setAttribute('aria-invalid', 'false');
            errorEl.classList.remove('show');
        }

        function getTodayISO() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function getNowTimeISO() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }

        function applyDateTimeConstraints() {
            const dateInput = document.getElementById('data');
            const timeInput = document.getElementById('hora');
            if (!dateInput || !timeInput) return;
            const today = getTodayISO();
            dateInput.min = today;
            if (!dateInput.value) return;
            if (dateInput.value < today) dateInput.value = today;
            if (dateInput.value === today) {
                const minTime = getNowTimeISO();
                timeInput.min = minTime;
                if (timeInput.value && timeInput.value < minTime) timeInput.value = minTime;
            } else {
                timeInput.removeAttribute('min');
            }
        }

        function initDateTimeValidation() {
            const dateInput = document.getElementById('data');
            const timeInput = document.getElementById('hora');
            const dateError = document.getElementById('data-error');
            const timeError = document.getElementById('hora-error');
            applyDateTimeConstraints();
            if (dateInput) {
                dateInput.addEventListener('input', () => {
                    applyDateTimeConstraints();
                    if (dateInput.value) clearFieldError(dateInput, dateError);
                });
            }
            if (timeInput) {
                timeInput.addEventListener('input', () => {
                    applyDateTimeConstraints();
                    if (timeInput.value) clearFieldError(timeInput, timeError);
                });
            }
        }

        // Custom validation with translated messages
        function validateForm() {
            let isValid = true;

            const nomeInput = document.getElementById('nome');
            const nomeError = document.getElementById('nome-error');
            if (nomeInput && nomeError) {
                const nomeValue = nomeInput.value.trim();
                if (!nomeValue) {
                    setFieldError(nomeInput, nomeError, validationMessage('validationName', 'Please enter your name'));
                    isValid = false;
                } else if (nomeValue.length < 2) {
                    setFieldError(nomeInput, nomeError, validationMessage('validationNameInvalid', 'Invalid name'));
                    isValid = false;
                } else {
                    clearFieldError(nomeInput, nomeError);
                }
            }

            const telefoneInput = document.getElementById('telefone');
            const telefoneError = document.getElementById('telefone-error');
            if (telefoneInput && telefoneError) {
                const telefoneValue = telefoneInput.value.trim();
                if (!telefoneValue) {
                    setFieldError(telefoneInput, telefoneError, validationMessage('validationPhone', 'Please enter your phone number'));
                    isValid = false;
                } else if (!/^[+\d\s()\-]{7,30}$/.test(telefoneValue)) {
                    setFieldError(telefoneInput, telefoneError, validationMessage('validationPhoneInvalid', 'Invalid phone number'));
                    isValid = false;
                } else {
                    clearFieldError(telefoneInput, telefoneError);
                }
            }

            const dateInput = document.getElementById('data');
            const dateError = document.getElementById('data-error');
            const timeInput = document.getElementById('hora');
            const timeError = document.getElementById('hora-error');
            const dateValue = dateInput ? dateInput.value : '';
            const timeValue = timeInput ? timeInput.value : '';
            const today = getTodayISO();
            if (dateInput && dateError) {
                if (!dateValue) {
                    setFieldError(dateInput, dateError, validationMessage('validationDate', 'Please select a date'));
                    isValid = false;
                } else if (dateValue < today) {
                    setFieldError(dateInput, dateError, validationMessage('validationDatePast', 'Please choose today or a future date'));
                    isValid = false;
                } else {
                    clearFieldError(dateInput, dateError);
                }
            }
            if (timeInput && timeError) {
                if (!timeValue) {
                    setFieldError(timeInput, timeError, validationMessage('validationTime', 'Please select a time'));
                    isValid = false;
                } else {
                    clearFieldError(timeInput, timeError);
                }
            }
            if (dateInput && timeInput && dateError && timeError && dateValue && timeValue) {
                const selected = new Date(`${dateValue}T${timeValue}:00`);
                if (!Number.isNaN(selected.getTime()) && selected.getTime() < Date.now() - 60000) {
                    const msg = validationMessage('validationDateTimePast', 'Please choose a future pickup time');
                    setFieldError(dateInput, dateError, msg);
                    setFieldError(timeInput, timeError, msg);
                    isValid = false;
                }
            }

            const recolhaInput = document.getElementById('recolha');
            const recolhaError = document.getElementById('recolha-error');
            if (recolhaInput && recolhaError) {
                if (!recolhaInput.value.trim()) {
                    setFieldError(recolhaInput, recolhaError, validationMessage('validationPickup', 'Please enter the pickup location'));
                    isValid = false;
                } else {
                    clearFieldError(recolhaInput, recolhaError);
                }
            }

            const destinoInput = document.getElementById('destino');
            const destinoError = document.getElementById('destino-error');
            if (destinoInput && destinoError) {
                if (!destinoInput.value.trim()) {
                    setFieldError(destinoInput, destinoError, validationMessage('validationDestination', 'Please enter the destination'));
                    isValid = false;
                } else {
                    clearFieldError(destinoInput, destinoError);
                }
            }

            return isValid;
        }

        // Clear validation on input
        function clearValidation(inputId, errorId) {
            const input = document.getElementById(inputId);
            const errorEl = document.getElementById(errorId);
            if (input && errorEl) {
                input.addEventListener('input', () => {
                    if (input.value.trim()) {
                        input.classList.remove('error');
                        errorEl.classList.remove('show');
                    }
                });
            }
        }

        // Handle form submission
        document.getElementById('taxi-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Custom validation
            if (!validateForm()) {
                return;
            }
            
            const formData = new FormData(e.target);
            const data = {
                nome: formData.get('nome'),
                telefone: formData.get('telefone'),
                data: formData.get('data'),
                hora: formData.get('hora'),
                recolha: formData.get('recolha'),
                destino: formData.get('destino'),
                recolhaLat: document.getElementById('recolha')?.dataset?.lat || '',
                recolhaLon: document.getElementById('recolha')?.dataset?.lon || '',
                destinoLat: document.getElementById('destino')?.dataset?.lat || '',
                destinoLon: document.getElementById('destino')?.dataset?.lon || '',
                clientId: clientId,
                lang: currentLang,
                source: new URLSearchParams(window.location.search).get('src') || new URLSearchParams(window.location.search).get('utm_source') || 'direct'
            };

            try {
                const apiUrl = window.location.origin + '/api/reserva';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                    cache: 'no-store'
                });

                if (response.ok) {
                    const result = await response.json();
                    const bookingData = { ...data, bookingId: result.bookingId, accessToken: result.accessToken };
                    const successMsg = document.getElementById('success-message');
                    if (successMsg) successMsg.classList.add('show');
                    displayBooking(bookingData);
                    // Persistir no localStorage
                    localStorage.setItem('691_booking', JSON.stringify(bookingData));
                    e.target.reset();
                    setTimeout(() => {
                        if (successMsg) successMsg.classList.remove('show');
                    }, 3000);
                } else {
                    const t = translations[currentLang] || translations.pt;
                    const errData = await response.json().catch(() => ({}));
                    const msg = errData?.error || errData?.message || t?.errorGeneric || '❌ Erro ao enviar reserva.';
                    alert(msg);
                }
            } catch (error) {
                const t = translations[currentLang] || translations.pt;
                alert((t?.errorConnection || '❌ Erro de ligação.') + '\n' + (error?.message || ''));
            }
        });

        async function cancelCurrentBooking() {
            if (!currentBooking || !socket) return;

            const bookingId = currentBooking.bookingId;
            const t = translations[currentLang] || translations.pt;

            socket.timeout(10000).emit('cancel_booking', {
                bookingId,
                clientId,
                accessToken: currentBooking.accessToken || ''
            }, (err, result) => {
                if (err) {
                    console.error('Cancelamento sem resposta do servidor:', err);
                    alert(t?.errorConnection || 'Não foi possível cancelar a reserva. Tente novamente.');
                    return;
                }

                if (!result?.ok) {
                    console.warn('Cancelamento recusado pelo servidor:', result?.error);
                    alert(t?.cancelError || 'Não foi possível cancelar a reserva.');
                    return;
                }

                localStorage.removeItem('691_booking');
                updateBookingStatus('cancelled');
                setTimeout(() => { hideBooking(); }, 1200);
            });
        }


        function applyRoutePrefillFromQuery() {
            const params = new URLSearchParams(window.location.search);
            const pickupParam = (params.get('recolha') || params.get('pickup') || '').trim();
            const destinationParam = (params.get('destino') || params.get('destination') || '').trim().toLowerCase();
            const routeMap = {
                'lisboa': 'Lisboa',
                'sintra-cascais': 'Sintra & Cascais',
                'sintra': 'Sintra',
                'fatima-obidos': 'Fátima & Óbidos',
                'fatima': 'Fátima',
                'evora': 'Évora',
                'nazare': 'Nazaré',
                'porto': 'Porto'
            };

            const pickupInput = document.getElementById('recolha');
            const destinationInput = document.getElementById('destino');

            if (pickupInput && pickupParam) {
                pickupInput.value = pickupParam;
                delete pickupInput.dataset.lat;
                delete pickupInput.dataset.lon;
            }

            const mappedDestination = routeMap[destinationParam] || (params.get('destino') || params.get('destination') || '').trim();
            if (destinationInput && mappedDestination) {
                destinationInput.value = mappedDestination;
                delete destinationInput.dataset.lat;
                delete destinationInput.dataset.lon;
            }
        }

        // Window cancel button
        const windowCancelBtn = document.getElementById('window-cancel-btn');
        if (windowCancelBtn) {
            windowCancelBtn.addEventListener('click', cancelCurrentBooking);
        }

        // Original cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelCurrentBooking);
        }

        // Initialize everything when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            initSocket();
            setupAddressAutocomplete();
            
            // Setup validation clearing on input
            clearValidation('nome', 'nome-error');
            clearValidation('telefone', 'telefone-error');
            clearValidation('data', 'data-error');
            clearValidation('hora', 'hora-error');
            clearValidation('recolha', 'recolha-error');
            clearValidation('destino', 'destino-error');
            initDateTimeValidation();
            
            // Detect browser language automatically
            function detectBrowserLanguage() {
                const requestedLang = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
                if (requestedLang === 'en') return 'en';
                if (requestedLang === 'pt') return 'pt';

                const browserLang = (navigator.language || navigator.userLanguage || 'pt').toLowerCase();
                return browserLang.startsWith('en') ? 'en' : 'pt';
            }
            
            const detectedLang = detectBrowserLanguage();
            updateLanguage(detectedLang);
            applyRoutePrefillFromQuery();
        });
