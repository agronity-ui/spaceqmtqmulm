const ALQURAN_BASE = import.meta.env.VITE_QURAN_API_BASE || 'https://api.alquran.cloud/v1'

// Fallback kecil agar app tetap terbuka saat API offline. Dataset penuh bisa ditambah di public/quran/*.json.
export const fallbackChapters = [
  { number: 1, englishName: 'Al-Fatihah', name: 'الفاتحة', englishNameTranslation: 'Pembukaan', numberOfAyahs: 7 },
  { number: 112, englishName: 'Al-Ikhlas', name: 'الإخلاص', englishNameTranslation: 'Ikhlas', numberOfAyahs: 4 },
  { number: 113, englishName: 'Al-Falaq', name: 'الفلق', englishNameTranslation: 'Waktu Subuh', numberOfAyahs: 5 },
  { number: 114, englishName: 'An-Nas', name: 'الناس', englishNameTranslation: 'Manusia', numberOfAyahs: 6 }
]

export async function getChapters() {
  try {
    const res = await fetch(`${ALQURAN_BASE}/surah`)
    if (!res.ok) throw new Error('API Quran tidak merespons.')
    const json = await res.json()
    return json.data
  } catch (err) {
    console.warn('[Quran fallback]', err)
    return fallbackChapters
  }
}

export async function getChapter(number) {
  const [arabic, id] = await Promise.all([
    fetch(`${ALQURAN_BASE}/surah/${number}/quran-uthmani`).then(r => r.json()),
    fetch(`${ALQURAN_BASE}/surah/${number}/id.indonesian`).then(r => r.json())
  ])
  const ayahs = arabic.data.ayahs.map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    juz: a.juz,
    text: a.text,
    translation: id.data.ayahs[i]?.text || '',
    audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.number}.mp3`
  }))
  return { ...arabic.data, ayahs }
}

export async function searchQuran(keyword) {
  if (!keyword) return []
  const res = await fetch(`${ALQURAN_BASE}/search/${encodeURIComponent(keyword)}/all/id.indonesian`)
  if (!res.ok) throw new Error('Pencarian Quran gagal.')
  const json = await res.json()
  return json.data?.matches || []
}
