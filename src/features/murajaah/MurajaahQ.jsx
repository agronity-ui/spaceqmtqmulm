import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getChapter, getChapters } from '../../lib/api/quran'
import { getSpeechRecognition, scoreTranscript } from '../../lib/api/speech'
import LoadingState from '../../components/LoadingState.jsx'
import { Mic, Square } from 'lucide-react'

export default function MurajaahQ({ user, toast }) {
  const [chapters, setChapters] = useState([])
  const [surahNo, setSurahNo] = useState(112)
  const [surah, setSurah] = useState(null)
  const [ayahIndex, setAyahIndex] = useState(0)
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(null)
  const [history, setHistory] = useState([])
  const recognitionRef = useRef(null)

  useEffect(() => {
    getChapters().then(setChapters)
    loadSurah(112)
    loadHistory()
  }, [])

  async function loadHistory() {
    const { data } = await supabase.from('murajaah_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    setHistory(data || [])
  }

  async function loadSurah(no) {
    setSurahNo(Number(no))
    setScore(null); setTranscript(''); setAyahIndex(0)
    try { setSurah(await getChapter(no)) }
    catch (err) { toast(err.message, 'error') }
  }

  function start() {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) return toast('SpeechRecognition belum tersedia di browser ini. Coba Chrome/Edge desktop atau Android.', 'error')
    const recognition = new SpeechRecognition()
    recognition.lang = 'ar-SA'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.onresult = event => {
      const text = Array.from(event.results).map(r => r[0].transcript).join(' ')
      setTranscript(text)
    }
    recognition.onerror = event => toast(`Speech error: ${event.error}`, 'error')
    recognition.onend = () => setRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
    setScore(null)
  }

  async function stop() {
    recognitionRef.current?.stop()
    setRecording(false)
    const ayah = surah?.ayahs?.[ayahIndex]
    if (!ayah) return
    const expected = ayah.translation // Browser speech-to-text Arabic tidak selalu memberi teks Arab yang stabil. Translation dipakai sebagai fallback scoring.
    const finalScore = scoreTranscript(expected, transcript)
    setScore(finalScore)
    await supabase.from('murajaah_attempts').insert({
      user_id: user.id,
      surah_number: surah.number,
      ayah_number: ayah.numberInSurah,
      target_text: ayah.text,
      transcript,
      score: finalScore,
      feedback: finalScore >= 70 ? 'Transkripsi cukup dekat. Lanjutkan latihan.' : 'Belum dekat. Ulangi dengan tempo pelan.'
    })
    loadHistory()
  }

  if (!surah) return <LoadingState label="Memuat MurajaahQ..." />
  const ayah = surah.ayahs[ayahIndex]

  return (
    <div className="stack">
      <section className="hero-card murajaah">
        <p className="muted tiny">MurajaahQ</p>
        <h2>Latihan hafalan berbasis suara.</h2>
        <p>Validasi memakai Web Speech API dan skor transkripsi. Ini belum setara koreksi tajwid ustadz.</p>
      </section>

      <section className="card stack">
        <label>Pilih Surah
          <select value={surahNo} onChange={e => loadSurah(e.target.value)}>
            {chapters.map(ch => <option key={ch.number} value={ch.number}>{ch.number}. {ch.englishName}</option>)}
          </select>
        </label>
        <label>Ayat
          <select value={ayahIndex} onChange={e => { setAyahIndex(Number(e.target.value)); setScore(null); setTranscript('') }}>
            {surah.ayahs.map((a, i) => <option key={a.number} value={i}>Ayat {a.numberInSurah}</option>)}
          </select>
        </label>
      </section>

      <section className="card ayah-card">
        <p className="muted tiny">{surah.englishName} : {ayah.numberInSurah}</p>
        <p className="arabic blur-on-hover">{ayah.text}</p>
        <p>{ayah.translation}</p>
      </section>

      <section className="card stack">
        <h3>Rekam Bacaan</h3>
        <div className="recorder-panel">
          <button className={`record-btn ${recording ? 'recording' : ''}`} onClick={recording ? stop : start}>
            {recording ? <Square size={28} /> : <Mic size={28} />}
          </button>
          <div>
            <b>{recording ? 'Mendengarkan...' : 'Siap merekam'}</b>
            <p className="muted">{transcript || 'Transkrip akan muncul di sini.'}</p>
          </div>
        </div>
        {score !== null && (
          <div className={`score-card ${score >= 70 ? 'ok' : 'warn'}`}>
            <b>Skor {score}%</b>
            <p>{score >= 70 ? 'Bagus. Simpan progres dan lanjut ayat berikutnya.' : 'Ulangi lagi. Sistem ini menilai kedekatan transkripsi, bukan tajwid penuh.'}</p>
            {ayahIndex < surah.ayahs.length - 1 && <button className="pill-btn" onClick={() => setAyahIndex(i => i + 1)}>Ayat berikutnya</button>}
          </div>
        )}
      </section>

      <section className="card">
        <h3>Riwayat Latihan</h3>
        <div className="journal-list">
          {history.map(h => (
            <article className="journal-item" key={h.id}>
              <small>Surah {h.surah_number}:{h.ayah_number}</small>
              <h4>Skor {h.score}%</h4>
              <p>{h.feedback}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
