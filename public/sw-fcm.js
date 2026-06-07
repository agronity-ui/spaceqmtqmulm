/* Optional Firebase Messaging service worker.
   VitePWA juga membuat service worker Workbox saat build. File ini dipakai khusus FCM.
   Jika FCM tidak diaktifkan, file ini aman dibiarkan. */
self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json?.() || {} } catch (_) {}
  const notification = payload.notification || payload
  event.waitUntil(
    self.registration.showNotification(notification.title || 'SpaceQ', {
      body: notification.body || 'Ada notifikasi baru.',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: payload.data || {}
    })
  )
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
