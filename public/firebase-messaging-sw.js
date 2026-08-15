importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC12vBkO_KUTuffTUaQU9e6bCeYfi4y5Bs",
  authDomain: "cbc-thane-worship-portal.firebaseapp.com",
  projectId: "cbc-thane-worship-portal",
  storageBucket: "cbc-thane-worship-portal.firebasestorage.app",
  messagingSenderId: "302555259658",
  appId: "1:302555259658:web:04c6b04d91352e98b4d0f3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notification = payload.notification || {};
  const notifTitle = notification.title || 'CBC Worship Portal';
  const notifOptions = {
    body: notification.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: payload.data || {},
    vibrate: [100, 50, 100]
  };
  return self.registration.showNotification(notifTitle, notifOptions);
});

self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const notification = data.notification || {};
    if (!notification.title) return;
    event.waitUntil(
      self.registration.showNotification(
        notification.title, {
          body: notification.body || '',
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          vibrate: [100, 50, 100]
        }
      )
    );
  } catch(e) {}
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.linkTo || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
