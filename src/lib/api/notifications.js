import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { supabase } from '../supabase'

export async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) throw new Error('Browser belum mendukung Notification API.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Izin notifikasi belum diberikan.')
  return permission
}

export function showLocalNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  navigator.serviceWorker?.ready.then(reg => {
    reg.showNotification(title, {
      badge: '/icons/icon-192.svg',
      icon: '/icons/icon-192.svg',
      ...options
    })
  })
}

export async function setupFcm(userId) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }
  if (!firebaseConfig.apiKey || !import.meta.env.VITE_FIREBASE_VAPID_KEY) {
    return { enabled: false, reason: 'Firebase env belum diisi.' }
  }
  if (!(await isSupported())) return { enabled: false, reason: 'Browser belum mendukung FCM.' }

  await requestBrowserNotificationPermission()
  const app = initializeApp(firebaseConfig)
  const messaging = getMessaging(app)
  const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY })
  if (token && userId) {
    await supabase.from('push_subscriptions').upsert({ user_id: userId, provider: 'fcm', token })
  }
  onMessage(messaging, payload => {
    showLocalNotification(payload.notification?.title || 'SpaceQ', {
      body: payload.notification?.body,
      data: payload.data
    })
  })
  return { enabled: true, token }
}

export function schedulePrayerLocalReminder(prayer, minutesBefore = 10) {
  const target = prayer.date.getTime() - minutesBefore * 60_000
  const delay = target - Date.now()
  if (delay <= 0) return
  window.setTimeout(() => {
    showLocalNotification(`Sebentar lagi ${prayer.name}`, {
      body: `${prayer.name} pada ${prayer.time}. Persiapkan diri ya.`,
      tag: `prayer-${prayer.key}`
    })
  }, delay)
}
