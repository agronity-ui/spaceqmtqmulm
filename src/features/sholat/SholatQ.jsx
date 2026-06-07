import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatCountdown, getNextPrayer, getPrayerTimesByCity, getPrayerTimesByCoords, getQibla } from '../../lib/api/prayer'
import { requestBrowserNotificationPermission, schedulePrayerLocalReminder } from '../../lib/api/notifications'
import LoadingState from '../../components/LoadingState.jsx'
import { Compass, MapPin, RefreshCw } from 'lucide-react'

export default function SholatQ({ user, toast }) {
  const [city, setCity] = useState('Banjarmasin')
  const [times, setTimes] = useState(null)
  const [qibla, setQibla] = useState(null)
  const [checkins, setCheckins] = useState({})
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState('--:--:--')
  const [coords, setCoords] = useState(null)

  const nextPrayer = useMemo(() => times?.prayers ? getNextPrayer(times.prayers) : null, [times])

  useEffect(() => {
    loadSettingsAndCheckins()
    loadByCity(city)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (nextPrayer) setCountdown(formatCountdown(nextPrayer.date))
    }, 1000)
    return () => clearInterval(id)
  }, [nextPrayer?.date?.getTime()])

  useEffect(() => {
    if (!times?.prayers) return
    times.prayers.forEach(p => {
      const target = getNextPrayer([p]).date
      schedulePrayerLocalReminder({ ...p, date: target }, 10)
    })
  }, [times?.date])

  async function loadSettingsAndCheckins() {
    const today = new Date().toISOString().slice(0, 10)
    const [{ data: settings }, { data: rows }] = await Promise.all([
      supabase.from('prayer_settings').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('prayer_checkins').select('*').eq('user_id', user.id).eq('prayer_date', today)
    ])
    if (settings?.city) setCity(settings.city)
    setCheckins(Object.fromEntries((rows || []).map(r => [r.prayer_key, r])))
  }

  async function loadByCity(nextCity = city) {
    try {
      setLoading(true)
      const data = await getPrayerTimesByCity(nextCity)
      setTimes(data)
      await supabase.from('prayer_settings').upsert({ user_id: user.id, city: nextCity, calculation_method: Number(import.meta.env.VITE_DEFAULT_PRAYER_METHOD || 20) })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function useLocation() {
    if (!navigator.geolocation) return toast('Geolocation tidak didukung browser.', 'error')
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        setLoading(true)
        const c = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setCoords(c)
        const [data, direction] = await Promise.all([
          getPrayerTimesByCoords(c.lat, c.lon),
          getQibla(c.lat, c.lon)
        ])
        setTimes(data)
        setQibla(direction)
        await supabase.from('prayer_settings').upsert({ user_id: user.id, latitude: c.lat, longitude: c.lon })
        toast('Lokasi aktif. Jadwal dan kiblat diperbarui.', 'success')
      } catch (err) {
        toast(err.message, 'error')
      } finally {
        setLoading(false)
      }
    }, () => toast('Izin lokasi ditolak. Gunakan pilih kota manual.', 'error'), { enableHighAccuracy: true })
  }

  async function toggleCheckin(prayer) {
    const today = new Date().toISOString().slice(0, 10)
    const exists = checkins[prayer.key]
    if (exists) {
      await supabase.from('prayer_checkins').delete().eq('id', exists.id)
    } else {
      await supabase.from('prayer_checkins').insert({
        user_id: user.id,
        prayer_date: today,
        prayer_key: prayer.key,
        prayer_name: prayer.name,
        completed_at: new Date().toISOString()
      })
    }
    await loadSettingsAndCheckins()
  }

  async function enableNotifications() {
    try {
      await requestBrowserNotificationPermission()
      toast('Notifikasi browser aktif. Reminder lokal dibuat otomatis saat jadwal dimuat.', 'success')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  const completed = Object.keys(checkins).length
  const progress = Math.round((completed / 5) * 100)

  return (
    <div className="stack">
      <section className="hero-card prayer">
        <p className="muted tiny">SholatQ</p>
        <h2>{nextPrayer?.name || 'Memuat...'}</h2>
        <p>Countdown sholat berikutnya</p>
        <strong className="countdown">{countdown}</strong>
        <div className="progress-ring" style={{ '--p': `${progress}%` }}>{progress}%</div>
      </section>

      <section className="card">
        <div className="section-head">
          <h3>Lokasi & Notifikasi</h3>
        </div>
        <div className="input-row">
          <input value={city} onChange={e => setCity(e.target.value)} placeholder="Pilih kota manual" />
          <button onClick={() => loadByCity(city)}><RefreshCw size={17} /></button>
        </div>
        <div className="button-row">
          <button className="pill-btn" onClick={useLocation}><MapPin size={16} /> Pakai lokasi</button>
          <button className="pill-btn" onClick={enableNotifications}>Aktifkan notifikasi</button>
        </div>
        {qibla && <p className="muted"><Compass size={15} /> Arah kiblat: {Number(qibla).toFixed(2)}° dari utara.</p>}
      </section>

      {loading ? <LoadingState label="Mengambil jadwal sholat..." /> : times && (
        <section className="card">
          <p className="muted tiny">{times.date} · {times.timezone}</p>
          <h3>Jadwal Sholat Hari Ini</h3>
          <div className="prayer-list">
            {times.prayers.map(prayer => (
              <button className={`prayer-row ${checkins[prayer.key] ? 'done' : ''}`} key={prayer.key} onClick={() => toggleCheckin(prayer)}>
                <span>{prayer.emoji}</span>
                <b>{prayer.name}</b>
                <time>{prayer.time}</time>
                <small>{checkins[prayer.key] ? 'Selesai' : 'Checklist'}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h3>Statistik Ibadah</h3>
        <div className="stats-grid">
          <span><b>{completed}/5</b><small>Sholat hari ini</small></span>
          <span><b>{progress}%</b><small>Progress</small></span>
          <span><b>{city}</b><small>Kota aktif</small></span>
        </div>
      </section>
    </div>
  )
}
