/**
 * sw-push.js — Service Worker Handler untuk Web Push Notifications Ruang Bahagia
 */
self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Ruang Bahagia 📸',
        body: event.data.text(),
      };
    }
  }

  const title = data.title || 'Ruang Bahagia 📸';
  const options = {
    body: data.body || 'Ada aktivitas sesi foto terbaru di studio Anda.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg',
    data: data.data || { url: '/dashboard' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Buka Studio' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
