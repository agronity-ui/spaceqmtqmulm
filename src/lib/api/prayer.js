const BASE = import.meta.env.VITE_ALADHAN_BASE || 'https://api.aladhan.com/v1'
const DEFAULT_METHOD = Number(import.meta.env.VITE_DEFAULT_PRAYER_METHOD || 20)

export async function getPrayerTimesByCoords(latitude, longitude, date = new Date(), method = DEFAULT_METHOD) {
  const day = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
  const url = `${BASE}/timings/${day}?latitude=${latitude}&longitude=${longitude}&method=${method}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Gagal mengambil jadwal sholat dari AlAdhan.')
  const json = await res.json()
  return normalizeTiming(json.data)
}

export async function getPrayerTimesByCity(city, country = 'Indonesia', method = DEFAULT_METHOD) {
  const url = `${BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Gagal mengambil jadwal sholat kota.')
  const json = await res.json()
  return normalizeTiming(json.data)
}

export async function getQibla(latitude, longitude) {
  const res = await fetch(`${BASE}/qibla/${latitude}/${longitude}`)
  if (!res.ok) throw new Error('Gagal mengambil arah kiblat.')
  const json = await res.json()
  return json.data?.direction
}

function normalizeTiming(data) {
  const t = data.timings || {}
  return {
    date: data.date?.readable,
    hijri: data.date?.hijri?.date,
    timezone: data.meta?.timezone,
    raw: data,
    prayers: [
      { key: 'fajr', name: 'Subuh', time: clean(t.Fajr), emoji: '🌅' },
      { key: 'dhuhr', name: 'Dzuhur', time: clean(t.Dhuhr), emoji: '☀️' },
      { key: 'asr', name: 'Ashar', time: clean(t.Asr), emoji: '🌤️' },
      { key: 'maghrib', name: 'Maghrib', time: clean(t.Maghrib), emoji: '🌇' },
      { key: 'isha', name: 'Isya', time: clean(t.Isha), emoji: '🌙' }
    ]
  }
}

function clean(value = '') {
  return value.split(' ')[0]
}

export function getNextPrayer(prayers, now = new Date()) {
  const today = new Date(now)
  const list = prayers.map(p => {
    const [h, m] = p.time.split(':').map(Number)
    const date = new Date(today)
    date.setHours(h, m, 0, 0)
    return { ...p, date }
  })
  return list.find(p => p.date > now) || { ...list[0], date: new Date(list[0].date.getTime() + 86400000) }
}

export function formatCountdown(targetDate) {
  const diff = Math.max(0, targetDate.getTime() - Date.now())
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}
