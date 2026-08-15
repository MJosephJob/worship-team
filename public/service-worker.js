// CBC Thane Worship Portal — Service Worker
const CACHE_NAME = 'cbc-worship-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]
const WB_MANIFEST = self.__WB_MANIFEST || []
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin.includes('script.google.com') || url.origin.includes('firebase')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response
        const clone = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        return response
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return new Response(`
            <!DOCTYPE html><html lang="en">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Offline — CBC Worship</title>
            <style>
              body{font-family:'Lato',sans-serif;background:#0f1b2d;color:#f5f0e8;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;margin:0}
              h1{font-family:'Playfair Display',serif;color:#c9a84c;font-size:2rem;margin-bottom:1rem}
              p{color:#b8ae9e;line-height:1.7;max-width:320px}
              svg{margin-bottom:1.5rem;opacity:0.6}
            </style>
            </head>
            <body>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 4 L24 44 M8 24 L40 24 M13 11 L35 37 M35 11 L13 37" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <h1>You're offline</h1>
              <p>Connect to sync with your team. Your worship portal will be back when you're online.</p>
            </body></html>
          `, { headers: { 'Content-Type': 'text/html' } })
        }
      })
    })
  )
})

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications())
  }
})

async function syncNotifications() {
  // Placeholder for background sync logic
}

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.notification?.title || 'CBC Worship', {
      body: data.notification?.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.data?.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
