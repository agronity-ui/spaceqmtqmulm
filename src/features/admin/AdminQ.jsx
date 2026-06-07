import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { CheckCircle2, ShieldAlert, Trash2 } from 'lucide-react'

export default function AdminQ({ user, profile, toast }) {
  const [reports, setReports] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [{ data: r }, { data: p }] = await Promise.all([
      supabase.from('reports').select('*, posts(*), reporter:reporter_id(username, display_name)').order('created_at', { ascending: false }),
      supabase.from('posts').select('*, profiles:profile_id(username, display_name)').eq('status', 'pending').order('created_at', { ascending: false })
    ])
    setReports(r || [])
    setPending(p || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updatePost(postId, status) {
    const { error } = await supabase.from('posts').update({ status }).eq('id', postId)
    if (error) toast(error.message, 'error')
    else { toast(`Postingan ${status}.`, 'success'); load() }
  }

  async function deletePost(postId) {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) toast(error.message, 'error')
    else { toast('Postingan dihapus.', 'success'); load() }
  }

  if (profile?.role !== 'admin' && profile?.role !== 'moderator') {
    return (
      <section className="card">
        <ShieldAlert />
        <h2>Akses ditolak</h2>
        <p>Halaman ini hanya untuk admin/moderator.</p>
      </section>
    )
  }

  if (loading) return <LoadingState label="Memuat moderasi..." />

  return (
    <div className="stack">
      <section className="hero-card admin">
        <p className="muted tiny">Admin / Moderation</p>
        <h2>Sistem moderasi aktif.</h2>
        <p>Kelola report, pending post, dan aksi moderasi.</p>
      </section>

      <section className="card">
        <h3>Postingan Pending</h3>
        {pending.length ? <div className="journal-list">
          {pending.map(p => (
            <article className="journal-item" key={p.id}>
              <small>@{p.profiles?.username || 'user'}</small>
              <p>{p.caption}</p>
              <div className="button-row">
                <button className="pill-btn" onClick={() => updatePost(p.id, 'published')}><CheckCircle2 size={16} /> Publish</button>
                <button className="danger-btn" onClick={() => deletePost(p.id)}><Trash2 size={16} /> Hapus</button>
              </div>
            </article>
          ))}
        </div> : <EmptyState icon="✅" title="Tidak ada pending post" />}
      </section>

      <section className="card">
        <h3>Report Masuk</h3>
        {reports.length ? <div className="journal-list">
          {reports.map(r => (
            <article className="journal-item" key={r.id}>
              <small>Pelapor @{r.reporter?.username || 'user'} · {r.status}</small>
              <h4>{r.reason}</h4>
              <p>{r.posts?.caption}</p>
              {r.post_id && <div className="button-row">
                <button className="pill-btn" onClick={() => updatePost(r.post_id, 'hidden')}>Sembunyikan</button>
                <button className="danger-btn" onClick={() => deletePost(r.post_id)}>Hapus</button>
              </div>}
            </article>
          ))}
        </div> : <EmptyState icon="🛡️" title="Tidak ada report" />}
      </section>
    </div>
  )
}
