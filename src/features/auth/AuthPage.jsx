import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MoonStar } from 'lucide-react'

export default function AuthPage({ toast }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', displayName: '', username: '' })

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.email) return toast('Email wajib diisi.', 'error')
    if (mode !== 'forgot' && form.password.length < 6) return toast('Password minimal 6 karakter.', 'error')

    try {
      setLoading(true)
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { display_name: form.displayName, username: form.username }
          }
        })
        if (error) throw error
        toast('Akun dibuat. Cek email jika konfirmasi aktif.', 'success')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: window.location.origin
        })
        if (error) throw error
        toast('Link reset password dikirim ke email.', 'success')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
        toast('Berhasil masuk.', 'success')
      }
    } catch (err) {
      toast(err.message || 'Auth gagal.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark"><MoonStar size={32} /></div>
        <p className="muted tiny">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</p>
        <h1>{mode === 'register' ? 'Buat Akun SpaceQ' : mode === 'forgot' ? 'Reset Password' : 'Masuk ke SpaceQ'}</h1>
        <p className="muted">Semua fitur terbuka. Muhsinin hanya dukungan opsional, bukan paywall.</p>

        <form onSubmit={submit} className="stack">
          {mode === 'register' && (
            <>
              <label>Nama tampil<input name="displayName" value={form.displayName} onChange={update} placeholder="Ahmad Nafis" required /></label>
              <label>Username<input name="username" value={form.username} onChange={update} placeholder="nafis" required /></label>
            </>
          )}
          <label>Email<input type="email" name="email" value={form.email} onChange={update} placeholder="nama@email.com" required /></label>
          {mode !== 'forgot' && <label>Password<input type="password" name="password" value={form.password} onChange={update} placeholder="Minimal 6 karakter" required /></label>}
          <button className="primary-btn" disabled={loading}>{loading ? 'Memproses...' : mode === 'register' ? 'Daftar' : mode === 'forgot' ? 'Kirim reset' : 'Masuk'}</button>
        </form>

        <div className="auth-switch">
          {mode !== 'login' && <button onClick={() => setMode('login')}>Sudah punya akun</button>}
          {mode !== 'register' && <button onClick={() => setMode('register')}>Buat akun</button>}
          {mode !== 'forgot' && <button onClick={() => setMode('forgot')}>Lupa password</button>}
        </div>
      </section>
    </main>
  )
}
