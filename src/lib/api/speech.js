export function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function normalizeArabicLatin(input = '') {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function scoreTranscript(expected = '', actual = '') {
  const a = normalizeArabicLatin(expected)
  const b = normalizeArabicLatin(actual)
  if (!a || !b) return 0
  const dist = levenshtein(a, b)
  return Math.max(0, Math.round((1 - dist / Math.max(a.length, b.length)) * 100))
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i])
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
    }
  }
  return matrix[b.length][a.length]
}
