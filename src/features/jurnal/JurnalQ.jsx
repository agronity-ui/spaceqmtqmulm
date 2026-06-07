import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { Download, PenLine, Search, Trash2 } from 'lucide-react'

const moods = ['Tenang', 'Bahagia', 'Bersyukur', 'Sedih', 'Cemas', 'Semangat']

export default function JurnalQ({ user, toast }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState({ title: '', body: '', mood: 'Bersyukur', tags: '', entry_date: new Date().toISOString().slice(0, 10) })

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('journals').select('*').eq('user_id', user.id).order('entry_date', { ascending: false })
    if (error) toast(error.message, 'error')
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user.id])

  function reset() {
    setEditing(null)
    setForm({ title: '', body: '', mood: 'Bersyukur', tags: '', entry_date: new Date().toISOString().slice(0, 10) })
  }

  function edit(entry) {
    setEditing(entry)
    setForm({
      title: entry.title || '',
      body: entry.body || '',
      mood: entry.mood || 'Bersyukur',
      tags: (entry.tags || []).join(', '),
      entry_date: entry.entry_date
    })
  }

  async function save(e) {
    e.preventDefault()
    if (!form.body.trim()) return toast('Isi jurnal belum boleh kosong.', 'error')
    const payload = {
      user_id: user.id,
      title: form.title || 'Catatan Hari Ini',
      body: form.body,
      mood: form.mood,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      entry_date: form.entry_date
    }
    const { error } = editing
      ? await supabase.from('journals').update(payload).eq('id', editing.id).eq('user_id', user.id)
      : await supabase.from('journals').insert(payload)
    if (error) toast(error.message, 'error')
    else {
      toast(editing ? 'Jurnal diperbarui.' : 'Jurnal disimpan.', 'success')
      reset()
      load()
    }
  }

  async function remove(entry) {
    if (!confirm('Hapus jurnal ini?')) return
    const { error } = await supabase.from('journals').delete().eq('id', entry.id).eq('user_id', user.id)
    if (error) toast(error.message, 'error')
    else { toast('Jurnal dihapus.', 'success'); load() }
  }

  function exportJson() {
    const data = JSON.stringify(entries, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spaceq-jurnal-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = entries.filter(e => {
    const q = filter.toLowerCase()
    return !q || e.title?.toLowerCase().includes(q) || e.body?.toLowerCase().includes(q) || e.mood?.toLowerCase().includes(q) || (e.tags || []).join(' ').toLowerCase().includes(q)
  })

  const insight = useMemo(() => {
    const streakDates = new Set(entries.map(e => e.entry_date))
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      if (streakDates.has(d.toISOString().slice(0, 10))) streak++
      else break
    }
    const moodMap = entries.reduce((acc, e) => ({ ...acc, [e.mood]: (acc[e.mood] || 0) + 1 }), {})
    const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    return { streak, topMood, count: entries.length }
  }, [entries])

  return (
    <div className="stack">
      <section className="hero-card journal">
        <p className="muted tiny">JurnalQ</p>
        <h2>Ruang refleksi pribadimu.</h2>
        <div className="stats-grid">
          <span><b>{insight.streak}</b><small>Streak</small></span>
          <span><b>{insight.topMood}</b><small>Mood dominan</small></span>
          <span><b>{insight.count}</b><small>Catatan</small></span>
        </div>
      </section>

      <form className="card stack" onSubmit={save}>
        <h3>{editing ? 'Edit Jurnal' : 'Tulis Jurnal'}</h3>
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Judul jurnal" />
        <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Apa yang kamu rasakan hari ini?" rows={6} />
        <div className="input-row">
          <select value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })}>
            {moods.map(m => <option key={m}>{m}</option>)}
          </select>
          <input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} />
        </div>
        <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Tag, pisahkan koma: syukur, kuliah, keluarga" />
        <div className="button-row">
          <button className="primary-btn"><PenLine size={17} /> Simpan</button>
          {editing && <button type="button" className="pill-btn" onClick={reset}>Batal</button>}
        </div>
      </form>

      <section className="card">
        <div className="section-head">
          <h3>Riwayat Jurnal</h3>
          <button className="pill-btn" onClick={exportJson}><Download size={15} /> Export</button>
        </div>
        <label className="search-field"><Search size={16} /><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Cari mood, tag, isi jurnal..." /></label>
        {loading ? <LoadingState /> : filtered.length ? (
          <div className="journal-list">
            {filtered.map(entry => (
              <article className="journal-item" key={entry.id}>
                <button className="text-left" onClick={() => edit(entry)}>
                  <small>{new Date(entry.entry_date).toLocaleDateString('id-ID')} · {entry.mood}</small>
                  <h4>{entry.title}</h4>
                  <p>{entry.body}</p>
                  <div className="tag-row">{(entry.tags || []).map(t => <span key={t}>#{t}</span>)}</div>
                </button>
                <button className="icon-btn" onClick={() => remove(entry)}><Trash2 size={17} /></button>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="📝" title="Belum ada jurnal" body="Tuliskan refleksi pertama kamu hari ini." />
        )}
      </section>
    </div>
  )
}
