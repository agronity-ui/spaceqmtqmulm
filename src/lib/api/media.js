export async function getCameraStream({ video = true, audio = false, facingMode = 'environment' } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Kamera tidak tersedia di browser ini.')
  return navigator.mediaDevices.getUserMedia({ video: video ? { facingMode } : false, audio })
}

export function capturePhoto(videoEl, type = 'image/jpeg', quality = 0.92) {
  const canvas = document.createElement('canvas')
  canvas.width = videoEl.videoWidth || 1080
  canvas.height = videoEl.videoHeight || 1080
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
  return new Promise(resolve => canvas.toBlob(blob => {
    resolve(new File([blob], `spaceq-photo-${Date.now()}.jpg`, { type }))
  }, type, quality))
}

export function createRecorder(stream, onData, mimeType = 'video/webm') {
  if (!window.MediaRecorder) throw new Error('Perekaman video tidak didukung browser ini.')
  const chunks = []
  const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined })
  recorder.ondataavailable = e => {
    if (e.data?.size) {
      chunks.push(e.data)
      onData?.(e.data)
    }
  }
  return {
    recorder,
    getFile: () => new File(chunks, `spaceq-video-${Date.now()}.webm`, { type: 'video/webm' })
  }
}
