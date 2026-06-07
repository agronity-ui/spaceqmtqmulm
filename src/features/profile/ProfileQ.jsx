import { useEffect, useState } from 'react'
import { supabase, uploadFile } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import { setupFcm } from '../../lib/api/notifications'
import { LogOut, Upload } from 'lucide-react'

export default function ProfileQ({ user, profile, setProfile, toast, setView, startTab = 'profile' }) {
  const [tab, setTab] = useState(startTab)
  const [form, setForm] = useState({ display_name: '', username: '', bio: '' })
  const [avatar, setAvatar] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name || '', username: profile.username || '', bio: profile.bio || '' })
  }, [profile?.id])

  useEffect(() => {
    if (tab === 'notifications') loadNotifications()
  }, [tab])

  async function loadNotifications() {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
    setNotifications(data || [])
  }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      setBusy(true)
      let avatar_url = profile?.avatar_url
      if (avatar) {
        const path = await uploadFile('avatars', user.id, avatar, 'profile')
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatar_url = data.publicUrl
      }
      const { data, error } = await supabase.from('profiles').update({ ...form, avatar_url }).eq('id', user.id).select().single()
      if (error) throw error
      setProfile(data)
      toast('Profil diperbarui.', 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function enablePush() {
    const result = await setupFcm(user.id)
    toast(result.enabled ? 'Push notification aktif.' : result.reason, result.enabled ? 'success' : 'info')
  }

  if (!profile) return <LoadingState label="Memuat profil..." />

  return (
    <div className="stack">
      <section className="hero-card profile-hero">
        <img className="profile-avatar" src={profile.avatar_url || '/icons/icon-192.svg'} alt="" />
        <div>
          <p className="muted tiny">My SpaceQ</p>
          <h2>{profile.display_name || user.email}</h2>
          <p>@{profile.username || 'user'} · Role {profile.role}</p>
        </div>
      </section>

      <div className="tabs">
        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>Profil</button>
        <button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>Notifikasi</button>
        <button className={tab === 'support' ? 'active' : ''} onClick={() => setTab('support')}>Muhsinin</button>
      </div>

      {tab === 'profile' && (
        <form className="card stack" onSubmit={saveProfile}>
          <label>Nama tampil<input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} /></label>
          <label>Username<input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
          <label>Bio<textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></label>
          <label>Avatar<input type="file" accept="image/*" onChange={e => setAvatar(e.target.files?.[0] || null)} /></label>
          <button className="primary-btn" disabled={busy}><Upload size={17} /> Simpan Profil</button>
          {profile.role === 'admin' && <button type="button" className="pill-btn" onClick={() => setView('admin')}>Buka Admin/Moderasi</button>}
          <button type="button" className="danger-btn" onClick={logout}><LogOut size={17} /> Logout</button>
        </form>
      )}

      {tab === 'notifications' && (
        <section className="card stack">
          <div className="section-head">
            <h3>Notifikasi</h3>
            <button className="pill-btn" onClick={enablePush}>Aktifkan Push</button>
          </div>
          <div className="journal-list">
            {notifications.map(n => (
              <article className="journal-item" key={n.id}>
                <small>{new Date(n.created_at).toLocaleString('id-ID')}</small>
                <h4>{n.title}</h4>
                <p>{n.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'support' && (
        <section className="donation-card">
          <p className="muted tiny">Muhsinin</p>
          <h3>Dukung SpaceQ</h3>
          <p>Di versi ini tidak ada paywall. Donasi hanya dukungan operasional opsional.</p>
          <button className="primary-btn" onClick={() => toast('Hubungkan payment gateway di tabel support_donations/Edge Function bila sudah siap.', 'info')}>Saya ingin mendukung</button>
        </section>
      )}
    </div>
  )
}
