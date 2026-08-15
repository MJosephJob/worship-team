import { apiFetch } from './api'

export async function requestFCMPermission() {
  if (!('Notification' in window)) return null
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const fbConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  }
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

  if (!fbConfig.apiKey || !vapidKey) return null

  try {
    const { initializeApp, getApps } = await import('firebase/app')
    const { getMessaging, getToken } = await import('firebase/messaging')

    const app = getApps().length ? getApps()[0] : initializeApp(fbConfig)
    const messaging = getMessaging(app)
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    setupForegroundNotifications(messaging)
    return token
  } catch {
    return null
  }
}

export function setupForegroundNotifications(messaging) {
  import('firebase/messaging').then(({ onMessage }) => {
    onMessage(messaging, function(payload) {
      const notification = payload.notification || {}
      if (Notification.permission === 'granted') {
        new Notification(
          notification.title || 'CBC Worship Portal',
          {
            body: notification.body || '',
            icon: '/icons/icon-192.png'
          }
        )
      }
    })
  }).catch(() => {})
}

export async function saveFCMToken(memberId, token) {
  if (!token) return
  return apiFetch('updateMember', { id: memberId, fcmToken: token })
}

function parseNotifDate(val) {
  if (!val) return null
  const clean = String(val).replace(' IST', '').replace(' ', 'T')
  const d = new Date(clean)
  return isNaN(d) ? new Date(val) : d
}

export function formatNotificationTime(ts) {
  const d = parseNotifDate(ts)
  if (!d || isNaN(d)) return ''
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    + ', '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}
