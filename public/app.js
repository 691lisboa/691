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
                title: '691.pt', subtitle: 'Táxi Lisboa', nameLabel: 'Nome', phoneLabel: 'Telefone', dateLabel: 'Data de recolha', timeLabel: 'Hora de recolha', pickupLabel: 'Local de Recolha', destinationLabel: 'Destino', submitButton: 'Reservar Táxi', whatsappChat: 'Falar com o Motorista', cancelButton: '❌ Cancelar Reserva', bookingTitle: 'Reserva ativa', bookingPending: 'A aguardar confirmação', bookingAccepted: 'Reserva aceite', driverArrived: 'O motorista chegou', driverOnTheWay: 'Motorista a caminho', bookingRejected: 'Reserva recusada', bookingCancelled: 'Reserva cancelada', bookingCompleted: 'Viagem concluída', noBookings: 'Sem reservas ativas', bookingDetailsTitle: 'Detalhes da reserva', successMessage: '✅ Reserva enviada com sucesso!', youLabel: 'Você', errorGeneric: '❌ Erro ao enviar a reserva.', errorConnection: '❌ Erro de ligação.', cancelError: '❌ Não foi possível cancelar a reserva. Tente novamente.', namePlaceholder: 'Seu nome', phonePlaceholder: 'Seu telefone', pickupPlaceholder: 'Local de recolha', destPlaceholder: 'Destino', validationName: 'Por favor, preencha o nome', validationNameInvalid: 'Nome inválido (mínimo 2 letras)', validationPhone: 'Por favor, preencha o telefone', validationPhoneInvalid: 'Telefone inválido (mínimo 7 dígitos)', validationPickup: 'Por favor, preencha o local de recolha', validationDestination: 'Por favor, preencha o destino', enableNotifications: '⚠️ Ative as notificações para receber atualizações da sua reserva.\n\nNo navegador: definições do site → Notificações → Permitir', pickupLabelShort: 'Recolha', destLabelShort: 'Destino'
            },
            en: {
                title: '691.pt', subtitle: 'Lisbon Taxi', nameLabel: 'Name', phoneLabel: 'Phone', dateLabel: 'Pickup date', timeLabel: 'Pickup time', pickupLabel: 'Pickup location', destinationLabel: 'Destination', submitButton: 'Book Taxi', whatsappChat: 'Talk to the Driver', cancelButton: '❌ Cancel Booking', bookingTitle: 'Active booking', bookingPending: 'Awaiting confirmation', bookingAccepted: 'Booking accepted', driverArrived: 'Driver arrived', driverOnTheWay: 'Driver is on the way', bookingRejected: 'Booking declined', bookingCancelled: 'Booking cancelled', bookingCompleted: 'Trip completed', noBookings: 'No active bookings', bookingDetailsTitle: 'Booking details', successMessage: '✅ Booking sent successfully!', youLabel: 'You', errorGeneric: '❌ Error sending booking.', errorConnection: '❌ Connection error.', cancelError: '❌ The booking could not be cancelled. Please try again.', namePlaceholder: 'Your name', phonePlaceholder: 'Your phone', pickupPlaceholder: 'Pickup address', destPlaceholder: 'Destination address', validationName: 'Please enter your name', validationNameInvalid: 'Invalid name (minimum 2 characters)', validationPhone: 'Please enter your phone number', validationPhoneInvalid: 'Invalid phone number (minimum 7 digits)', validationPickup: 'Please enter the pickup location', validationDestination: 'Please enter the destination', enableNotifications: '⚠️ Enable notifications to receive booking updates.\n\nBrowser site settings → Notifications → Allow', pickupLabelShort: 'Pickup', destLabelShort: 'Destination'
            },
            fr: {
                title: '691.pt', subtitle: 'Taxi Lisbonne', nameLabel: 'Nom', phoneLabel: 'Téléphone', dateLabel: 'Date de prise en charge', timeLabel: 'Heure de prise en charge', pickupLabel: 'Lieu de prise en charge', destinationLabel: 'Destination', submitButton: 'Réserver un Taxi', whatsappChat: 'Parler au Chauffeur', cancelButton: '❌ Annuler la Réservation', bookingTitle: 'Réservation active', bookingPending: '⏳ En attente de confirmation', bookingAccepted: '✅ Réservation acceptée.', driverArrived: '📍 Le chauffeur est arrivé.', driverOnTheWay: '🚗 Le chauffeur est en route !', bookingRejected: '❌ Réservation refusée.', bookingCancelled: '❌ Réservation annulée.', bookingCompleted: '✅ Trajet terminé.', noBookings: 'Aucune réservation active', bookingDetailsTitle: '📋 Détails de la Réservation', successMessage: '✅ Réservation envoyée avec succès !', youLabel: 'Vous', errorGeneric: '❌ Erreur lors de l’envoi de la réservation.', errorConnection: '❌ Erreur de connexion.', cancelError: '❌ Impossible d’annuler la réservation. Veuillez réessayer.', namePlaceholder: 'Votre nom', phonePlaceholder: 'Votre téléphone', pickupPlaceholder: 'Adresse de prise en charge', destPlaceholder: 'Adresse de destination', validationName: 'Veuillez saisir votre nom', validationNameInvalid: 'Nom invalide (minimum 2 caractères)', validationPhone: 'Veuillez saisir votre téléphone', validationPhoneInvalid: 'Téléphone invalide (minimum 7 chiffres)', validationPickup: 'Veuillez saisir le lieu de prise en charge', validationDestination: 'Veuillez saisir la destination', enableNotifications: '⚠️ Activez les notifications pour recevoir les mises à jour de votre réservation.\n\nParamètres du site → Notifications → Autoriser', pickupLabelShort: 'Prise en charge', destLabelShort: 'Destination'
            },
            es: {
                title: '691.pt', subtitle: 'Taxi Lisboa', nameLabel: 'Nombre', phoneLabel: 'Teléfono', dateLabel: 'Fecha de recogida', timeLabel: 'Hora de recogida', pickupLabel: 'Lugar de recogida', destinationLabel: 'Destino', submitButton: 'Reservar Taxi', whatsappChat: 'Hablar con el Conductor', cancelButton: '❌ Cancelar Reserva', bookingTitle: 'Reserva activa', bookingPending: '⏳ Esperando confirmación', bookingAccepted: '✅ Reserva aceptada.', driverArrived: '📍 El conductor ha llegado.', driverOnTheWay: '🚗 El conductor está en camino.', bookingRejected: '❌ Reserva rechazada.', bookingCancelled: 'Reserva cancelada', bookingCompleted: '✅ Viaje completado.', noBookings: 'No hay reservas activas', bookingDetailsTitle: '📋 Detalles de la Reserva', successMessage: '✅ Reserva enviada con éxito.', youLabel: 'Tú', errorGeneric: '❌ Error al enviar la reserva.', errorConnection: '❌ Error de conexión.', cancelError: '❌ No se pudo cancelar la reserva. Inténtalo de nuevo.', namePlaceholder: 'Tu nombre', phonePlaceholder: 'Tu teléfono', pickupPlaceholder: 'Dirección de recogida', destPlaceholder: 'Dirección de destino', validationName: 'Introduce tu nombre', validationNameInvalid: 'Nombre no válido (mínimo 2 caracteres)', validationPhone: 'Introduce tu teléfono', validationPhoneInvalid: 'Teléfono no válido (mínimo 7 dígitos)', validationPickup: 'Introduce el lugar de recogida', validationDestination: 'Introduce el destino', enableNotifications: '⚠️ Activa las notificaciones para recibir actualizaciones de tu reserva.\n\nConfiguración del sitio → Notificaciones → Permitir', pickupLabelShort: 'Recogida', destLabelShort: 'Destino'
            },
            de: {
                title: '691.pt', subtitle: 'Taxi Lisboa', nameLabel: 'Name', phoneLabel: 'Telefon', dateLabel: 'Abholdatum', timeLabel: 'Abholzeit', pickupLabel: 'Abholort', destinationLabel: 'Ziel', submitButton: 'Taxi Buchen', whatsappChat: 'Mit dem Fahrer sprechen', cancelButton: '❌ Buchung Stornieren', bookingTitle: 'Aktive Buchung', bookingPending: '⏳ Bestätigung ausstehend', bookingAccepted: '✅ Buchung angenommen.', driverArrived: '📍 Fahrer ist angekommen.', driverOnTheWay: '🚗 Fahrer ist unterwegs.', bookingRejected: '❌ Buchung abgelehnt.', bookingCancelled: '❌ Buchung storniert.', bookingCompleted: '✅ Fahrt abgeschlossen.', noBookings: 'Keine aktiven Buchungen', bookingDetailsTitle: '📋 Buchungsdetails', successMessage: '✅ Buchung erfolgreich gesendet.', youLabel: 'Sie', errorGeneric: '❌ Fehler beim Senden der Buchung.', errorConnection: '❌ Verbindungsfehler.', cancelError: '❌ Die Buchung konnte nicht storniert werden. Bitte versuchen Sie es erneut.', namePlaceholder: 'Ihr Name', phonePlaceholder: 'Ihre Telefonnummer', pickupPlaceholder: 'Abholadresse', destPlaceholder: 'Zieladresse', validationName: 'Bitte geben Sie Ihren Namen ein', validationNameInvalid: 'Ungültiger Name (mindestens 2 Zeichen)', validationPhone: 'Bitte geben Sie Ihre Telefonnummer ein', validationPhoneInvalid: 'Ungültige Telefonnummer (mindestens 7 Ziffern)', validationPickup: 'Bitte geben Sie den Abholort ein', validationDestination: 'Bitte geben Sie das Ziel ein', enableNotifications: '⚠️ Aktivieren Sie Benachrichtigungen für Buchungsupdates.\n\nWebsite-Einstellungen → Benachrichtigungen → Zulassen', pickupLabelShort: 'Abholung', destLabelShort: 'Ziel'
            },
            it: {
                title: '691.pt', subtitle: 'Taxi Lisboa', nameLabel: 'Nome', phoneLabel: 'Telefono', dateLabel: 'Data di ritiro', timeLabel: 'Ora di ritiro', pickupLabel: 'Luogo di ritiro', destinationLabel: 'Destinazione', submitButton: 'Prenota Taxi', whatsappChat: 'Parla con l’Autista', cancelButton: '❌ Annulla Prenotazione', bookingTitle: 'Prenotazione attiva', bookingPending: '⏳ In attesa di conferma', bookingAccepted: '✅ Prenotazione accettata.', driverArrived: '📍 L’autista è arrivato.', driverOnTheWay: '🚗 L’autista è in viaggio.', bookingRejected: '❌ Prenotazione rifiutata.', bookingCancelled: '❌ Prenotazione annullata.', bookingCompleted: '✅ Viaggio completato.', noBookings: 'Nessuna prenotazione attiva', bookingDetailsTitle: '📋 Dettagli Prenotazione', successMessage: '✅ Prenotazione inviata con successo.', youLabel: 'Tu', errorGeneric: '❌ Errore durante l’invio della prenotazione.', errorConnection: '❌ Errore di connessione.', cancelError: '❌ Non è stato possibile annullare la prenotazione. Riprova.', namePlaceholder: 'Il tuo nome', phonePlaceholder: 'Il tuo telefono', pickupPlaceholder: 'Indirizzo di ritiro', destPlaceholder: 'Indirizzo di destinazione', validationName: 'Inserisci il tuo nome', validationNameInvalid: 'Nome non valido (minimo 2 caratteri)', validationPhone: 'Inserisci il tuo telefono', validationPhoneInvalid: 'Telefono non valido (minimo 7 cifre)', validationPickup: 'Inserisci il luogo di ritiro', validationDestination: 'Inserisci la destinazione', enableNotifications: '⚠️ Attiva le notifiche per ricevere aggiornamenti sulla prenotazione.\n\nImpostazioni del sito → Notifiche → Consenti', pickupLabelShort: 'Ritiro', destLabelShort: 'Destinazione'
            },
            zh: {
                title: '691.pt', subtitle: '里斯本出租车', nameLabel: '姓名', phoneLabel: '电话', dateLabel: '接车日期', timeLabel: '接车时间', pickupLabel: '接车地点', destinationLabel: '目的地', submitButton: '预订出租车', whatsappChat: '联系司机', cancelButton: '❌ 取消预订', bookingTitle: '当前预订', bookingPending: '⏳ 等待确认', bookingAccepted: '✅ 预订已接受。', driverArrived: '📍 司机已到达。', driverOnTheWay: '🚗 司机正在前往。', bookingRejected: '❌ 预订已拒绝。', bookingCancelled: '❌ 预订已取消。', bookingCompleted: '✅ 行程已完成。', noBookings: '没有当前预订', bookingDetailsTitle: '📋 预订详情', successMessage: '✅ 预订已成功发送。', youLabel: '您', errorGeneric: '❌ 发送预订时出错。', errorConnection: '❌ 连接错误。', cancelError: '❌ 无法取消预订，请重试。', namePlaceholder: '您的姓名', phonePlaceholder: '您的电话', pickupPlaceholder: '接车地址', destPlaceholder: '目的地地址', validationName: '请输入姓名', validationNameInvalid: '姓名无效（至少2个字符）', validationPhone: '请输入电话号码', validationPhoneInvalid: '电话号码无效（至少7位数字）', validationPickup: '请输入接车地点', validationDestination: '请输入目的地', enableNotifications: '⚠️ 请启用通知以接收预订更新。\n\n网站设置 → 通知 → 允许', pickupLabelShort: '接车', destLabelShort: '目的地'
            },
            ja: {
                title: '691.pt', subtitle: 'リスボン・タクシー', nameLabel: 'お名前', phoneLabel: '電話番号', dateLabel: 'お迎え日', timeLabel: 'お迎え時間', pickupLabel: 'お迎え場所', destinationLabel: '目的地', submitButton: 'タクシーを予約', whatsappChat: 'ドライバーに連絡', cancelButton: '❌ 予約をキャンセル', bookingTitle: '予約中', bookingPending: '⏳ 確認待ち', bookingAccepted: '✅ 予約が承認されました。', driverArrived: '📍 ドライバーが到着しました。', driverOnTheWay: '🚗 ドライバーが向かっています。', bookingRejected: '❌ 予約が拒否されました。', bookingCancelled: '❌ 予約がキャンセルされました。', bookingCompleted: '✅ 旅行が完了しました。', noBookings: '有効な予約はありません', bookingDetailsTitle: '📋 予約詳細', successMessage: '✅ 予約を送信しました。', youLabel: 'お客様', errorGeneric: '❌ 予約の送信中にエラーが発生しました。', errorConnection: '❌ 接続エラー。', cancelError: '❌ 予約をキャンセルできませんでした。もう一度お試しください。', namePlaceholder: 'お名前', phonePlaceholder: '電話番号', pickupPlaceholder: 'お迎え住所', destPlaceholder: '目的地住所', validationName: 'お名前を入力してください', validationNameInvalid: '名前が無効です（2文字以上）', validationPhone: '電話番号を入力してください', validationPhoneInvalid: '電話番号が無効です（7桁以上）', validationPickup: 'お迎え場所を入力してください', validationDestination: '目的地を入力してください', enableNotifications: '⚠️ 予約更新を受け取るには通知を有効にしてください。\n\nサイト設定 → 通知 → 許可', pickupLabelShort: 'お迎え', destLabelShort: '目的地'
            },
            ru: {
                title: '691.pt', subtitle: 'Такси Лиссабон', nameLabel: 'Имя', phoneLabel: 'Телефон', dateLabel: 'Дата подачи', timeLabel: 'Время подачи', pickupLabel: 'Место подачи', destinationLabel: 'Пункт назначения', submitButton: 'Заказать такси', whatsappChat: 'Связаться с водителем', cancelButton: '❌ Отменить заказ', bookingTitle: 'Активный заказ', bookingPending: '⏳ Ожидание подтверждения', bookingAccepted: '✅ Заказ принят.', driverArrived: '📍 Водитель прибыл.', driverOnTheWay: '🚗 Водитель в пути.', bookingRejected: '❌ Заказ отклонён.', bookingCancelled: '❌ Заказ отменён.', bookingCompleted: '✅ Поездка завершена.', noBookings: 'Нет активных заказов', bookingDetailsTitle: '📋 Детали заказа', successMessage: '✅ Заказ успешно отправлен.', youLabel: 'Вы', errorGeneric: '❌ Ошибка при отправке заказа.', errorConnection: '❌ Ошибка соединения.', cancelError: '❌ Не удалось отменить заказ. Попробуйте снова.', namePlaceholder: 'Ваше имя', phonePlaceholder: 'Ваш телефон', pickupPlaceholder: 'Адрес подачи', destPlaceholder: 'Адрес назначения', validationName: 'Введите имя', validationNameInvalid: 'Некорректное имя (минимум 2 символа)', validationPhone: 'Введите телефон', validationPhoneInvalid: 'Некорректный телефон (минимум 7 цифр)', validationPickup: 'Введите место подачи', validationDestination: 'Введите пункт назначения', enableNotifications: '⚠️ Включите уведомления, чтобы получать обновления заказа.\n\nНастройки сайта → Уведомления → Разрешить', pickupLabelShort: 'Подача', destLabelShort: 'Назначение'
            },
            nl: {
                title: '691.pt', subtitle: 'Taxi Lisboa', nameLabel: 'Naam', phoneLabel: 'Telefoon', dateLabel: 'Ophaaldatum', timeLabel: 'Ophaaltijd', pickupLabel: 'Ophaallocatie', destinationLabel: 'Bestemming', submitButton: 'Taxi Reserveren', whatsappChat: 'Praat met de Chauffeur', cancelButton: '❌ Reservering Annuleren', bookingTitle: 'Actieve reservering', bookingPending: '⏳ Wachten op bevestiging', bookingAccepted: '✅ Reservering geaccepteerd.', driverArrived: '📍 Chauffeur is gearriveerd.', driverOnTheWay: '🚗 Chauffeur is onderweg.', bookingRejected: '❌ Reservering afgewezen.', bookingCancelled: '❌ Reservering geannuleerd.', bookingCompleted: '✅ Rit voltooid.', noBookings: 'Geen actieve reserveringen', bookingDetailsTitle: '📋 Reserveringsdetails', successMessage: '✅ Reservering succesvol verzonden.', youLabel: 'U', errorGeneric: '❌ Fout bij het verzenden van de reservering.', errorConnection: '❌ Verbindingsfout.', cancelError: '❌ De reservering kon niet worden geannuleerd. Probeer opnieuw.', namePlaceholder: 'Uw naam', phonePlaceholder: 'Uw telefoon', pickupPlaceholder: 'Ophaaladres', destPlaceholder: 'Bestemmingsadres', validationName: 'Vul uw naam in', validationNameInvalid: 'Ongeldige naam (minimaal 2 tekens)', validationPhone: 'Vul uw telefoonnummer in', validationPhoneInvalid: 'Ongeldig telefoonnummer (minimaal 7 cijfers)', validationPickup: 'Vul de ophaallocatie in', validationDestination: 'Vul de bestemming in', enableNotifications: '⚠️ Schakel meldingen in om reserveringsupdates te ontvangen.\n\nSite-instellingen → Meldingen → Toestaan', pickupLabelShort: 'Ophalen', destLabelShort: 'Bestemming'
            },
            pl: {
                title: '691.pt', subtitle: 'Taxi Lisboa', nameLabel: 'Imię', phoneLabel: 'Telefon', dateLabel: 'Data odbioru', timeLabel: 'Godzina odbioru', pickupLabel: 'Miejsce odbioru', destinationLabel: 'Cel', submitButton: 'Zarezerwuj Taxi', whatsappChat: 'Skontaktuj się z Kierowcą', cancelButton: '❌ Anuluj Rezerwację', bookingTitle: 'Aktywna rezerwacja', bookingPending: '⏳ Oczekiwanie na potwierdzenie', bookingAccepted: '✅ Rezerwacja zaakceptowana.', driverArrived: '📍 Kierowca przyjechał.', driverOnTheWay: '🚗 Kierowca jest w drodze.', bookingRejected: '❌ Rezerwacja odrzucona.', bookingCancelled: '❌ Rezerwacja anulowana.', bookingCompleted: '✅ Podróż zakończona.', noBookings: 'Brak aktywnych rezerwacji', bookingDetailsTitle: '📋 Szczegóły Rezerwacji', successMessage: '✅ Rezerwacja została wysłana.', youLabel: 'Ty', errorGeneric: '❌ Błąd podczas wysyłania rezerwacji.', errorConnection: '❌ Błąd połączenia.', cancelError: '❌ Nie udało się anulować rezerwacji. Spróbuj ponownie.', namePlaceholder: 'Twoje imię', phonePlaceholder: 'Twój telefon', pickupPlaceholder: 'Adres odbioru', destPlaceholder: 'Adres celu', validationName: 'Podaj swoje imię', validationNameInvalid: 'Nieprawidłowe imię (minimum 2 znaki)', validationPhone: 'Podaj swój telefon', validationPhoneInvalid: 'Nieprawidłowy telefon (minimum 7 cyfr)', validationPickup: 'Podaj miejsce odbioru', validationDestination: 'Podaj cel', enableNotifications: '⚠️ Włącz powiadomienia, aby otrzymywać aktualizacje rezerwacji.\n\nUstawienia witryny → Powiadomienia → Zezwól', pickupLabelShort: 'Odbiór', destLabelShort: 'Cel'
            }
        };


        const footerTranslations = {
            pt: { legal: 'Informação Legal', privacy: 'Privacidade', complaints: 'Livro de Reclamações' },
            en: { legal: 'Legal Information', privacy: 'Privacy', complaints: 'Complaints Book' },
            fr: { legal: 'Informations légales', privacy: 'Confidentialité', complaints: 'Livre de réclamations' },
            es: { legal: 'Información Legal', privacy: 'Privacidad', complaints: 'Libro de Reclamaciones' },
            de: { legal: 'Rechtliche Informationen', privacy: 'Datenschutz', complaints: 'Beschwerdebuch' },
            it: { legal: 'Informazioni Legali', privacy: 'Privacy', complaints: 'Libro dei Reclami' },
            zh: { legal: '法律信息', privacy: '隐私', complaints: '投诉簿' },
            ja: { legal: '法的情報', privacy: 'プライバシー', complaints: '苦情申立て' },
            ru: { legal: 'Правовая информация', privacy: 'Конфиденциальность', complaints: 'Книга жалоб' },
            nl: { legal: 'Juridische informatie', privacy: 'Privacy', complaints: 'Klachtenboek' },
            pl: { legal: 'Informacje prawne', privacy: 'Prywatność', complaints: 'Księga skarg' }
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
        async function fetchSuggestions(query) {
            try {
                const res = await fetch('/api/search?q=' + encodeURIComponent(query));
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) return data;
                }
            } catch { /* ignore */ }
            // fallback: endereços locais
            if (typeof window.searchAddresses !== 'function') {
                // Attempt lazy load once when needed
                await loadAddressesJs();
            }
            if (typeof window.searchAddresses === 'function') return window.searchAddresses(query);
            const q = String(query || '').toLowerCase();
            return portugueseAddresses.filter(addr => addr.toLowerCase().includes(q)).slice(0, 10);
        }

        function setupAddressAutocomplete() {
            const pickupInput = document.getElementById('recolha');
            const destinationInput = document.getElementById('destino');

            // Proactively start loading addresses.js on first interaction
            if (pickupInput) pickupInput.addEventListener('focus', () => { loadAddressesJs(); }, { once: true });
            if (destinationInput) destinationInput.addEventListener('focus', () => { loadAddressesJs(); }, { once: true });

            [pickupInput, destinationInput].forEach(input => {
                let currentFocus = -1;

                // Create autocomplete container
                const autocompleteContainer = document.createElement('div');
                autocompleteContainer.className = 'autocomplete-items premium-autocomplete-dropdown';
                autocompleteContainer.style.position = 'absolute';
                autocompleteContainer.style.top = '100%';
                autocompleteContainer.style.left = '0';
                autocompleteContainer.style.right = '0';
                autocompleteContainer.style.background = '#ffffff';
                autocompleteContainer.style.border = '1px solid #dbe2e8';
                autocompleteContainer.style.borderTop = 'none';
                autocompleteContainer.style.borderRadius = '0 0 16px 16px';
                autocompleteContainer.style.maxHeight = '260px';
                autocompleteContainer.style.overflowY = 'auto';
                autocompleteContainer.style.zIndex = '9999';
                autocompleteContainer.style.boxShadow = '0 24px 48px rgba(11, 16, 21, 0.12)';
                autocompleteContainer.style.display = 'none';

                input.parentElement.style.position = 'relative';
                input.parentElement.appendChild(autocompleteContainer);

                input.addEventListener('input', function() {
                    const value = this.value.trim();
                    if (!value || value.length < 2) {
                        autocompleteContainer.style.display = 'none';
                        return;
                    }

                    clearTimeout(_acTimer);
                    _acTimer = setTimeout(async () => {
                        const suggestions = await fetchSuggestions(value);
                        if (suggestions.length === 0) {
                            autocompleteContainer.style.display = 'none';
                            return;
                        }

                        autocompleteContainer.replaceChildren();
                        suggestions.forEach(suggestion => {
                            const item = document.createElement('div');
                            item.style.padding = '12px 15px';
                            item.style.cursor = 'pointer';
                            item.style.borderBottom = '1px solid #eef2f5';
                            item.style.color = '#0b1015';
                            item.style.fontSize = '0.9rem';
                            const strong = document.createElement('strong');
                            strong.textContent = suggestion.substring(0, value.length);
                            strong.style.fontWeight = '700';
                            strong.style.color = '#0b1015';
                            item.appendChild(strong);
                            item.appendChild(document.createTextNode(suggestion.substring(value.length)));

                            item.addEventListener('click', function() {
                                input.value = suggestion;
                                autocompleteContainer.style.display = 'none';
                            });

                            item.addEventListener('mouseenter', function() {
                                this.style.background = '#f4f7f9';
                            });

                            item.addEventListener('mouseleave', function() {
                                this.style.background = 'transparent';
                            });

                            autocompleteContainer.appendChild(item);
                        });

                        autocompleteContainer.style.display = 'block';
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
                        autocompleteContainer.style.display = 'none';
                    }
                });
                
                function addActive(items) {
                    if (!items) return false;
                    removeActive(items);
                    if (currentFocus >= items.length) currentFocus = 0;
                    if (currentFocus < 0) currentFocus = (items.length - 1);
                    items[currentFocus].style.background = '#f4f7f9';
                }
                
                function removeActive(items) {
                    for (let item of items) {
                        item.style.background = 'transparent';
                    }
                }
            });
            
            // Close autocomplete when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.matches('#recolha, #destino')) {
                    const autocompleteItems = document.querySelectorAll('.autocomplete-items');
                    autocompleteItems.forEach(item => {
                        item.style.display = 'none';
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
            currentLang = lang;
            const t = translations[lang] || translations.en;
            const footerT = footerTranslations[lang] || footerTranslations.en;
            document.documentElement.lang = lang;
            
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
            if (nomeInput) nomeInput.title = t.validationName;
            if (telefoneInput) telefoneInput.title = t.validationPhone;
            if (recolhaInput) recolhaInput.title = t.validationPickup;
            if (destinoInput) destinoInput.title = t.validationDestination;

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
                en: { pending: 'We received your request. Please wait for confirmation.', accepted: 'Your booking was accepted. We will meet you at the scheduled time.', onway: 'The driver is on the way. You can contact us if needed.', arrived: 'The driver has arrived at the pickup location.', completed: 'Thank you for booking with 691.pt.', rejected: 'The booking was not accepted. You can try again or contact us.', cancelled: 'The booking was cancelled. If needed, create a new booking.' },
                fr: { pending: 'Nous avons reçu votre demande. Veuillez attendre la confirmation.', accepted: 'Votre réservation a été acceptée. Nous serons là à l’heure prévue.', onway: 'Le chauffeur est en route. Vous pouvez nous contacter si besoin.', arrived: 'Le chauffeur est déjà arrivé au lieu de prise en charge.', completed: 'Merci d’avoir réservé avec 691.pt.', rejected: 'La réservation n’a pas été acceptée. Vous pouvez réessayer ou nous contacter.', cancelled: 'La réservation a été annulée. Si besoin, faites une nouvelle réservation.' },
                es: { pending: 'Hemos recibido su solicitud. Espere la confirmación.', accepted: 'La reserva fue aceptada. Estaremos allí a la hora prevista.', onway: 'El conductor está en camino. Si lo necesita, puede contactarnos.', arrived: 'El conductor ya ha llegado al lugar de recogida.', completed: 'Gracias por reservar con 691.pt.', rejected: 'La reserva no fue aceptada. Puede intentarlo de nuevo o contactarnos.', cancelled: 'La reserva fue cancelada. Si lo necesita, haga una nueva reserva.' },
                de: { pending: 'Wir haben Ihre Anfrage erhalten. Bitte warten Sie auf die Bestätigung.', accepted: 'Ihre Buchung wurde angenommen. Wir sind zur vereinbarten Zeit für Sie da.', onway: 'Der Fahrer ist unterwegs. Bei Bedarf können Sie uns kontaktieren.', arrived: 'Der Fahrer ist bereits am Abholort angekommen.', completed: 'Vielen Dank für Ihre Buchung bei 691.pt.', rejected: 'Die Buchung wurde nicht angenommen. Sie können es erneut versuchen oder uns kontaktieren.', cancelled: 'Die Buchung wurde storniert. Falls nötig, erstellen Sie bitte eine neue Buchung.' },
                it: { pending: 'Abbiamo ricevuto la tua richiesta. Attendi la conferma.', accepted: 'La prenotazione è stata accettata. Saremo lì all’orario previsto.', onway: 'L’autista è in arrivo. Se necessario puoi contattarci.', arrived: 'L’autista è già arrivato al punto di ritiro.', completed: 'Grazie per aver prenotato con 691.pt.', rejected: 'La prenotazione non è stata accettata. Puoi riprovare o contattarci.', cancelled: 'La prenotazione è stata annullata. Se necessario, effettua una nuova prenotazione.' },
                zh: { pending: '我们已收到您的请求，请等待确认。', accepted: '您的预订已接受，我们会按约定时间到达。', onway: '司机正在前往，如有需要可随时联系我们。', arrived: '司机已到达接送地点。', completed: '感谢您通过 691.pt 预订。', rejected: '该预订未被接受，您可以重新尝试或联系我们。', cancelled: '预订已取消，如有需要请重新预订。' },
                ja: { pending: 'ご予約依頼を受け付けました。確認をお待ちください。', accepted: '予約が承認されました。予定時刻にお迎えします。', onway: 'ドライバーが向かっています。必要であればご連絡ください。', arrived: 'ドライバーが乗車場所に到着しました。', completed: '691.pt でのご予約ありがとうございます。', rejected: '予約は承認されませんでした。再度お試しいただくかご連絡ください。', cancelled: '予約はキャンセルされました。必要であれば新しく予約してください。' },
                ru: { pending: 'Мы получили ваш запрос. Пожалуйста, дождитесь подтверждения.', accepted: 'Ваш заказ принят. Мы будем на месте в назначенное время.', onway: 'Водитель в пути. При необходимости свяжитесь с нами.', arrived: 'Водитель уже прибыл к месту подачи.', completed: 'Спасибо за бронирование через 691.pt.', rejected: 'Заказ не был принят. Вы можете попробовать снова или связаться с нами.', cancelled: 'Заказ отменён. При необходимости создайте новый заказ.' },
                nl: { pending: 'We hebben uw aanvraag ontvangen. Wacht alstublieft op bevestiging.', accepted: 'Uw reservering is geaccepteerd. We zijn er op het afgesproken tijdstip.', onway: 'De chauffeur is onderweg. Indien nodig kunt u contact met ons opnemen.', arrived: 'De chauffeur is al op de ophaallocatie aangekomen.', completed: 'Bedankt voor uw boeking bij 691.pt.', rejected: 'De reservering is niet geaccepteerd. U kunt het opnieuw proberen of contact opnemen.', cancelled: 'De reservering is geannuleerd. Maak indien nodig een nieuwe reservering.' },
                pl: { pending: 'Otrzymaliśmy Twoje zgłoszenie. Proszę czekać na potwierdzenie.', accepted: 'Rezerwacja została zaakceptowana. Będziemy na miejscu o ustalonej godzinie.', onway: 'Kierowca jest w drodze. W razie potrzeby możesz się z nami skontaktować.', arrived: 'Kierowca dotarł już do miejsca odbioru.', completed: 'Dziękujemy za rezerwację w 691.pt.', rejected: 'Rezerwacja nie została zaakceptowana. Możesz spróbować ponownie lub skontaktować się z nami.', cancelled: 'Rezerwacja została anulowana. W razie potrzeby utwórz nową rezerwację.' }
            };
            const langNotes = notes[lang] || notes.en;
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

        // Custom validation with translated messages
        function validateForm() {
            const t = translations[currentLang];
            let isValid = true;

            // Name validation
            const nomeInput = document.getElementById('nome');
            const nomeError = document.getElementById('nome-error');
            if (nomeInput && nomeError) {
                const nomeValue = nomeInput.value.trim();
                if (!nomeValue) {
                    nomeInput.classList.add('error');
                    nomeError.textContent = t.validationName;
                    nomeError.classList.add('show');
                    isValid = false;
                } else if (nomeValue.length < 2) {
                    nomeInput.classList.add('error');
                    nomeError.textContent = t.validationNameInvalid;
                    nomeError.classList.add('show');
                    isValid = false;
                } else {
                    nomeInput.classList.remove('error');
                    nomeError.classList.remove('show');
                }
            }

            // Phone validation
            const telefoneInput = document.getElementById('telefone');
            const telefoneError = document.getElementById('telefone-error');
            if (telefoneInput && telefoneError) {
                const telefoneValue = telefoneInput.value.trim();
                if (!telefoneValue) {
                    telefoneInput.classList.add('error');
                    telefoneError.textContent = t.validationPhone;
                    telefoneError.classList.add('show');
                    isValid = false;
                } else if (!/^[+\d\s()\-]{7,30}$/.test(telefoneValue)) {
                    telefoneInput.classList.add('error');
                    telefoneError.textContent = t.validationPhoneInvalid;
                    telefoneError.classList.add('show');
                    isValid = false;
                } else {
                    telefoneInput.classList.remove('error');
                    telefoneError.classList.remove('show');
                }
            }

            // Pickup validation
            const recolhaInput = document.getElementById('recolha');
            const recolhaError = document.getElementById('recolha-error');
            if (recolhaInput && recolhaError) {
                if (!recolhaInput.value.trim()) {
                    recolhaInput.classList.add('error');
                    recolhaError.textContent = t.validationPickup;
                    recolhaError.classList.add('show');
                    isValid = false;
                } else {
                    recolhaInput.classList.remove('error');
                    recolhaError.classList.remove('show');
                }
            }

            // Destination validation
            const destinoInput = document.getElementById('destino');
            const destinoError = document.getElementById('destino-error');
            if (destinoInput && destinoError) {
                if (!destinoInput.value.trim()) {
                    destinoInput.classList.add('error');
                    destinoError.textContent = t.validationDestination;
                    destinoError.classList.add('show');
                    isValid = false;
                } else {
                    destinoInput.classList.remove('error');
                    destinoError.classList.remove('show');
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
            clearValidation('recolha', 'recolha-error');
            clearValidation('destino', 'destino-error');
            
            // Detect browser language automatically
            function detectBrowserLanguage() {
                const supportedLangs = ['pt', 'en', 'fr', 'es', 'de', 'it', 'zh', 'ja', 'ru', 'nl', 'pl'];
                const requestedLang = new URLSearchParams(window.location.search).get('lang');
                if (requestedLang && supportedLangs.includes(requestedLang.toLowerCase())) {
                    return requestedLang.toLowerCase();
                }

                const browserLang = navigator.language || navigator.userLanguage || 'pt';
                const primaryLang = browserLang.split('-')[0].toLowerCase();
                if (supportedLangs.includes(primaryLang)) return primaryLang;
                return 'en';
            }
            
            const detectedLang = detectBrowserLanguage();
            updateLanguage(detectedLang);
        });
