import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getChapter, getChapters, searchQuran } from '../../lib/api/quran'
import LoadingState from '../../components/LoadingState.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { Bookmark, Headphones, Search } from 'lucide-react'

export default function QuranQ({ user, toast }) {
  const [chapters, setChapters] = useState([])
  const [selected, setSelected] = useState(null)
  const [surah, setSurah] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [chap, bm] = await Promise.all([
      getChapters(),
      supabase.from('quran_bookmarks').select('*').eq('user_id', user.id)
    ])
    setChapters(chap)
    setBookmarks(bm.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [user.id])

  async function openSurah(number) {
    setSelected(number)
    setLoading(true)
    try {
      const data = await getChapter(number)
      setSurah(data)
      await supabase.from('quran_progress').upsert({
        user_id: user.id,
        surah_number: number,
        ayah_number: 1,
        last_read_at: new Date().toISOString()
      })
    } catch (err) {
      toast(err.message || 'Gagal membuka surah.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function toggleBookmark(ayah) {
    const exists = bookmarks.find(b => b.ayah_number_global === ayah.number)
    if (exists) {
      await supabase.from('quran_bookmarks').delete().eq('id', exists.id).eq('user_id', user.id)
    } else {
      await supabase.from('quran_bookmarks').insert({
        user_id: user.id,
        surah_number: surah.number,
        ayah_number: ayah.numberInSurah,
        ayah_number_global: ayah.number,
        note: ''
      })
    }
    const { data } = await supabase.from('quran_bookmarks').select('*').eq('user_id', user.id)
    setBookmarks(data || [])
  }

  async function doSearch(e) {
    e.preventDefault()
    if (!query.trim()) return setResults([])
    try { setResults(await searchQuran(query)) }
    catch (err) { toast(err.message, 'error') }
  }

  if (loading && !chapters.length) return <LoadingState label="Memuat Al-Qur'an..." />

  return (
    <div className="stack">
      <section className="hero-card quran">
        <p className="muted tiny">TadarusQ / Qur'an</p>
        <h2>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم</h2>
        <p>Baca, dengarkan murottal, bookmark ayat, dan simpan progres.</p>
      </section>

      <form className="card search-field" onSubmit={doSearch}>
        <Search size={17} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari kata dalam terjemahan..." />
        <button>Cari</button>
      </form>

      {results.length > 0 && (
        <section className="card">
          <h3>Hasil Pencarian</h3>
          <div className="journal-list">
            {results.slice(0, 20).map(r => (
              <button className="journal-item text-left" key={r.number} onClick={() => openSurah(r.surah.number)}>
                <small>{r.surah.englishName} : {r.numberInSurah}</small>
                <p>{r.text}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {selected && surah ? (
        <section className="card">
          <div className="section-head">
            <div>
              <button className="pill-btn" onClick={() => { setSelected(null); setSurah(null) }}>← Daftar Surah</button>
              <h3>{surah.englishName} · {surah.name}</h3>
            </div>
          </div>
          <div className="ayah-list">
            {surah.ayahs.map(ayah => {
              const bookmarked = bookmarks.some(b => b.ayah_number_global === ayah.number)
              return (
                <article className="ayah-card" key={ayah.number}>
                  <div className="ayah-head">
                    <span>{surah.number}:{ayah.numberInSurah}</span>
                    <div>
                      <button className={bookmarked ? 'active icon-btn' : 'icon-btn'} onClick={() => toggleBookmark(ayah)}><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} /></button>
                      <button className="icon-btn" onClick={() => new Audio(ayah.audio).play()}><Headphones size={17} /></button>
                    </div>
                  </div>
                  <p className="arabic">{ayah.text}</p>
                  <p>{ayah.translation}</p>
                </article>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="card">
          <h3>Daftar Surah</h3>
          {chapters.length ? <div className="surah-grid">
            {chapters.map(ch => (
              <button className="surah-card" key={ch.number} onClick={() => openSurah(ch.number)}>
                <b>{ch.number}. {ch.englishName}</b>
                <small>{ch.englishNameTranslation} · {ch.numberOfAyahs} ayat</small>
                <span className="arabic-mini">{ch.name}</span>
              </button>
            ))}
          </div> : <EmptyState title="Daftar surah belum tersedia" />}
        </section>
      )}
    </div>
  )
}
