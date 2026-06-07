const banned = ['anjing', 'babi', 'bangsat', 'kontol', 'memek', 'goblok']

export function localModerateText(text = '') {
  const lowered = text.toLowerCase()
  const hits = banned.filter(word => lowered.includes(word))
  return {
    approved: hits.length === 0,
    labels: hits.map(word => `blocked:${word}`),
    score: hits.length ? 0.92 : 0.05
  }
}

export function isAllowedMedia(file) {
  if (!file) return true
  const ok = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/webm', 'audio/mp4']
  return ok.includes(file.type) && file.size <= 100 * 1024 * 1024
}
