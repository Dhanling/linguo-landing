// Linguo.id Service Worker — handles push notifications
// Registered from StudentRealtimeNotifs component.

const VERSION = 'v1';
console.log('[SW Linguo] loaded', VERSION);

self.addEventListener('install', (event) => {
  console.log('[SW Linguo] install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW Linguo] activate');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[SW Linguo] push received');
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Linguo.id', body: event.data ? event.data.text() : 'Notifikasi baru' };
  }

  const title = data.title || 'Linguo.id';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'linguo',
    data: { url: data.url || '/akun' },
    requireInteraction: false,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW Linguo] notification clicked');
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/akun';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window with matching origin exists, focus it
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          client.focus();
          if ('navigate' in client && clientUrl.pathname !== targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
