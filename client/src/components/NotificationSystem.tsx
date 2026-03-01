import { useEffect } from 'react'

interface NotificationSystemProps {
  notifications: string[]
}

export default function NotificationSystem({ notifications }: NotificationSystemProps) {
  useEffect(() => {
    // Solicitar permissão para notificações do navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    // Mostrar notificações do navegador quando novas mensagens chegam
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1]
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('691 - Atualização', {
          body: latestNotification,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: '691-notification',
          silent: false
        })
      }
    }
  }, [notifications])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className="glass-card p-4 text-sm text-white animate-slideInRight border-l-4 border-taxi-green"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-taxi-green rounded-full animate-pulse-slow" />
            </div>
            <div className="flex-1">
              <p className="text-green-400 font-semibold mb-1">691</p>
              <p className="text-white/90">{notification}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
