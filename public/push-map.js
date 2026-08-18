// Map background — Lisbon, CartoDB Dark Matter
        if (typeof L !== 'undefined') {
            const map = L.map('map-bg', {
                center: [38.7169, -9.1399],
                zoom: 14,
                zoomControl: false,
                dragging: false,
                touchZoom: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                boxZoom: false,
                keyboard: false,
                attributionControl: true
            });
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(map);
        }

        // ── Web Push ─────────────────────────────────────────────────────────
        function urlBase64ToUint8Array(b64) {
            const pad  = '='.repeat((4 - b64.length % 4) % 4);
            const raw  = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
            return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
        }

        let pushServiceWorkerRegistration = null;
        let pushRegistrationBusy = false;

        function pushSubscriptionMatchesVapidKey(subscription, publicKey) {
            try {
                const currentKey = subscription?.options?.applicationServerKey;
                if (!currentKey) return false;
                const current = new Uint8Array(currentKey);
                const expected = urlBase64ToUint8Array(publicKey);
                if (current.length !== expected.length) return false;
                for (let i = 0; i < current.length; i++) {
                    if (current[i] !== expected[i]) return false;
                }
                return true;
            } catch {
                return false;
            }
        }

        function getPushUiText() {
            const map = {
                pt: { enable: '🔔 Ativar notificações', active: '✅ Notificações ativas', blocked: '⚠️ Notificações bloqueadas', unsupported: 'Este navegador não suporta notificações Push neste dispositivo.', settings: 'Ative as notificações nas definições do site e volte a clicar no sino.', denied: 'A permissão de notificações não foi concedida.', retry: 'Não foi possível ativar as notificações. Tente novamente.', swFailed: 'Não foi possível registar o serviço de notificações.' },
                en: { enable: '🔔 Enable notifications', active: '✅ Notifications enabled', blocked: '⚠️ Notifications blocked', unsupported: 'This browser does not support Push notifications on this device.', settings: 'Enable notifications in the site settings and click the bell again.', denied: 'Notification permission was not granted.', retry: 'Notifications could not be enabled. Please try again.', swFailed: 'The notification service could not be registered.' },
                fr: { enable: '🔔 Activer les notifications', active: '✅ Notifications activées', blocked: '⚠️ Notifications bloquées', unsupported: 'Ce navigateur ne prend pas en charge les notifications Push sur cet appareil.', settings: 'Activez les notifications dans les paramètres du site puis cliquez de nouveau sur la cloche.', denied: 'L’autorisation des notifications n’a pas été accordée.', retry: 'Impossible d’activer les notifications. Réessayez.', swFailed: 'Impossible d’enregistrer le service de notifications.' },
                es: { enable: '🔔 Activar notificaciones', active: '✅ Notificaciones activas', blocked: '⚠️ Notificaciones bloqueadas', unsupported: 'Este navegador no admite notificaciones Push en este dispositivo.', settings: 'Activa las notificaciones en la configuración del sitio y vuelve a pulsar la campana.', denied: 'No se concedió el permiso de notificaciones.', retry: 'No se pudieron activar las notificaciones. Inténtalo de nuevo.', swFailed: 'No se pudo registrar el servicio de notificaciones.' },
                de: { enable: '🔔 Benachrichtigungen aktivieren', active: '✅ Benachrichtigungen aktiv', blocked: '⚠️ Benachrichtigungen blockiert', unsupported: 'Dieser Browser unterstützt auf diesem Gerät keine Push-Benachrichtigungen.', settings: 'Aktivieren Sie Benachrichtigungen in den Website-Einstellungen und klicken Sie erneut auf die Glocke.', denied: 'Die Benachrichtigungsberechtigung wurde nicht erteilt.', retry: 'Benachrichtigungen konnten nicht aktiviert werden. Bitte versuchen Sie es erneut.', swFailed: 'Der Benachrichtigungsdienst konnte nicht registriert werden.' },
                it: { enable: '🔔 Attiva notifiche', active: '✅ Notifiche attive', blocked: '⚠️ Notifiche bloccate', unsupported: 'Questo browser non supporta le notifiche Push su questo dispositivo.', settings: 'Attiva le notifiche nelle impostazioni del sito e fai di nuovo clic sulla campanella.', denied: 'Il permesso per le notifiche non è stato concesso.', retry: 'Non è stato possibile attivare le notifiche. Riprova.', swFailed: 'Non è stato possibile registrare il servizio di notifiche.' },
                nl: { enable: '🔔 Meldingen inschakelen', active: '✅ Meldingen actief', blocked: '⚠️ Meldingen geblokkeerd', unsupported: 'Deze browser ondersteunt geen Pushmeldingen op dit apparaat.', settings: 'Schakel meldingen in via de site-instellingen en klik opnieuw op de bel.', denied: 'Toestemming voor meldingen is niet verleend.', retry: 'Meldingen konden niet worden ingeschakeld. Probeer opnieuw.', swFailed: 'De meldingsservice kon niet worden geregistreerd.' },
                pl: { enable: '🔔 Włącz powiadomienia', active: '✅ Powiadomienia aktywne', blocked: '⚠️ Powiadomienia zablokowane', unsupported: 'Ta przeglądarka nie obsługuje powiadomień Push na tym urządzeniu.', settings: 'Włącz powiadomienia w ustawieniach witryny i ponownie kliknij dzwonek.', denied: 'Nie udzielono zgody na powiadomienia.', retry: 'Nie udało się włączyć powiadomień. Spróbuj ponownie.', swFailed: 'Nie udało się zarejestrować usługi powiadomień.' },
                ru: { enable: '🔔 Включить уведомления', active: '✅ Уведомления включены', blocked: '⚠️ Уведомления заблокированы', unsupported: 'Этот браузер не поддерживает Push-уведомления на данном устройстве.', settings: 'Разрешите уведомления в настройках сайта и снова нажмите на колокольчик.', denied: 'Разрешение на уведомления не предоставлено.', retry: 'Не удалось включить уведомления. Попробуйте снова.', swFailed: 'Не удалось зарегистрировать службу уведомлений.' },
                zh: { enable: '🔔 开启通知', active: '✅ 通知已开启', blocked: '⚠️ 通知已被阻止', unsupported: '此浏览器在该设备上不支持 Push 通知。', settings: '请在网站设置中允许通知，然后再次点击铃铛。', denied: '未授予通知权限。', retry: '无法开启通知，请重试。', swFailed: '无法注册通知服务。' },
                ja: { enable: '🔔 通知を有効にする', active: '✅ 通知が有効です', blocked: '⚠️ 通知がブロックされています', unsupported: 'このブラウザはこの端末で Push 通知をサポートしていません。', settings: 'サイト設定で通知を許可し、もう一度ベルをクリックしてください。', denied: '通知の許可が付与されませんでした。', retry: '通知を有効にできませんでした。もう一度お試しください。', swFailed: '通知サービスを登録できませんでした。' }
            };
            return map[currentLang] || map.pt;
        }

        function updatePushButton(state, helpText = '') {
            const btn = document.getElementById('push-permission-btn');
            const help = document.getElementById('push-permission-help');
            const indicator = document.getElementById('push-permission-indicator');
            if (!btn) return;

            const ui = getPushUiText();
            btn.style.display = 'inline-flex';
            btn.classList.toggle('success', state === 'active');
            btn.disabled = state === 'active' || pushRegistrationBusy;
            btn.textContent = '🔔';

            const label = state === 'active' ? ui.active : state === 'blocked' ? ui.blocked : ui.enable;
            btn.setAttribute('aria-label', label);
            btn.title = label;

            if (indicator) {
                indicator.classList.toggle('show', state !== 'active');
            }

            if (help) {
                help.textContent = helpText || '';
                help.style.display = helpText ? 'inline-block' : 'none';
            }
        }

        async function registerPush(swReg, forceRenew = false) {
            if (pushRegistrationBusy) return false;
            pushRegistrationBusy = true;
            try {
                console.log('[Push] Starting registration...');
                if (!('Notification' in window) || !('PushManager' in window)) {
                    console.warn('[Push] Notifications/Push not supported');
                    updatePushButton('blocked', getPushUiText().unsupported);
                    return false;
                }

                console.log('[Push] Notification permission:', Notification.permission);
                if (Notification.permission === 'denied') {
                    const ui = getPushUiText();
                    updatePushButton('blocked', getPushUiText().settings);
                    return false;
                }

                const keyRes = await fetch('/api/vapid-public-key', { cache: 'no-store' });
                if (!keyRes.ok) throw new Error(`VAPID key request failed: HTTP ${keyRes.status}`);
                const { publicKey } = await keyRes.json();
                console.log('[Push] VAPID public key received:', publicKey ? 'Yes' : 'No');
                if (!publicKey) throw new Error('VAPID public key unavailable');

                let sub = await swReg.pushManager.getSubscription();
                console.log('[Push] Existing subscription:', sub ? 'Yes' : 'No');

                if (sub && (forceRenew || !pushSubscriptionMatchesVapidKey(sub, publicKey))) {
                    console.warn('[Push] Existing subscription uses an old/invalid VAPID key. Recreating...');
                    try {
                        await sub.unsubscribe();
                    } catch (unsubscribeError) {
                        console.warn('[Push] Could not unsubscribe old subscription:', unsubscribeError);
                    }
                    sub = null;
                }

                if (!sub) {
                    if (Notification.permission !== 'granted') {
                        const permission = await Notification.requestPermission();
                        console.log('[Push] Permission after user action:', permission);
                        if (permission !== 'granted') {
                            const ui = getPushUiText();
                            updatePushButton('blocked', getPushUiText().denied);
                            return false;
                        }
                    }

                    console.log('[Push] Creating new subscription...');
                    sub = await swReg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(publicKey)
                    });
                    console.log('[Push] Subscription created successfully');
                }

                const res = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, subscription: sub })
                });
                if (!res.ok) {
                    const body = await res.text().catch(() => '');
                    throw new Error(`Subscribe failed: HTTP ${res.status}${body ? ` - ${body.slice(0,120)}` : ''}`);
                }

                console.log('[Push] Registration complete');
                updatePushButton('active');
                return true;
            } catch (e) {
                console.error('[Push] Registration failed:', e);
                updatePushButton('enable', getPushUiText().retry);
                return false;
            } finally {
                pushRegistrationBusy = false;
                if (Notification?.permission === 'granted') {
                    const btn = document.getElementById('push-permission-btn');
                    if (btn && btn.classList.contains('success')) btn.disabled = true;
                }
            }
        }

        async function handlePushButtonClick() {
            if (!pushServiceWorkerRegistration) return;
            if ('Notification' in window && Notification.permission === 'denied') {
                updatePushButton('blocked', getPushUiText().settings);
                return;
            }
            await registerPush(pushServiceWorkerRegistration);
        }

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(async reg => {
                        pushServiceWorkerRegistration = reg;
                        console.log('SW registered:', reg.scope);

                        const pushBtn = document.getElementById('push-permission-btn');
                        if (pushBtn) pushBtn.addEventListener('click', handlePushButtonClick);

                        if ('Notification' in window && Notification.permission === 'granted') {
                            const existing = await reg.pushManager.getSubscription().catch(() => null);
                            if (existing) {
                                await registerPush(reg);
                            } else {
                                updatePushButton('enable');
                            }
                        } else {
                            updatePushButton(Notification?.permission === 'denied' ? 'blocked' : 'enable');
                        }
                    })
                    .catch(err => {
                        console.warn('SW registration failed:', err);
                        updatePushButton('blocked', getPushUiText().swFailed);
                    });
            });

            // Recebe dados da notificação push quando o utilizador clica nela
            // (funciona mesmo quando o browser estava fechado)
            navigator.serviceWorker.addEventListener('message', (e) => {
                if (e.data?.type !== 'PUSH_STATUS') return;
                const { type: st, bookingId } = e.data.data || {};
                if (!st || !bookingId) return;
                // Guardar dados completos do push — serão aplicados em session_restored se necessário
                const pushData = e.data.data || {};
                pendingPushStatus = pushData;
                if (currentBooking?.bookingId === bookingId) {
                    applyPushStatus(pushData);
                    pendingPushStatus = null;
                }
                // else: session_restored vai aplicar quando chegar
            });
        }
