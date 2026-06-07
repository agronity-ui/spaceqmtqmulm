import { useEffect, useRef, useState } from 'react'
import { capturePhoto, createRecorder, getCameraStream } from '../../lib/api/media'
import { supabase, publicUrl, uploadFile } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import { Camera, Circle, Square, Upload } from 'lucide-react'

export default function CameraQ({ user, toast }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [recording, setRecording] = useState(false)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [assets, setAssets] = useState([])

  useEffect(() => {
    loadAssets()
    return () => stopCamera()
  }, [])

  async function loadAssets() {
    const { data } = await supabase.from('media_assets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12)
    setAssets(data || [])
  }

  async function startCamera() {
    try {
      const stream = await getCameraStream({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setStreaming(true)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks?.().forEach(t => t.stop())
    streamRef.current = null
    setStreaming(false)
  }

  async function takePhoto() {
    if (!videoRef.current) return
    const file = await capturePhoto(videoRef.current)
    setPreview({ file, url: URL.createObjectURL(file), type: 'image' })
  }

  function startRecording() {
    try {
      if (!streamRef.current) return toast('Aktifkan kamera dulu.', 'error')
      const { recorder, getFile } = createRecorder(streamRef.current)
      recorderRef.current = { recorder, getFile }
      recorder.start()
      setRecording(true)
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  function stopRecording() {
    const ref = recorderRef.current
    if (!ref) return
    ref.recorder.onstop = () => {
      const file = ref.getFile()
      setPreview({ file, url: URL.createObjectURL(file), type: 'video' })
      setRecording(false)
    }
    ref.recorder.stop()
  }

  async function uploadPreview() {
    if (!preview?.file) return
    try {
      setBusy(true)
      const bucket = preview.type === 'video' ? 'camera-media' : 'camera-media'
      const path = await uploadFile(bucket, user.id, preview.file, preview.type)
      const { error } = await supabase.from('media_assets').insert({
        user_id: user.id,
        bucket,
        path,
        media_type: preview.type,
        mime_type: preview.file.type,
        size_bytes: preview.file.size
      })
      if (error) throw error
      toast('Media kamera berhasil diupload.', 'success')
      setPreview(null)
      loadAssets()
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <section className="hero-card camera-hero">
        <p className="muted tiny">Kamera / Media</p>
        <h2>Kamera browser nyata.</h2>
        <p>Ambil foto, rekam video, preview, lalu upload ke Supabase Storage.</p>
      </section>

      <section className="card camera-panel">
        <video ref={videoRef} autoPlay playsInline muted />
        {!streaming && <button className="primary-btn" onClick={startCamera}><Camera size={17} /> Aktifkan Kamera</button>}
        {streaming && (
          <div className="button-row center">
            <button className="pill-btn" onClick={takePhoto}><Camera size={17} /> Foto</button>
            <button className="pill-btn" onClick={recording ? stopRecording : startRecording}>{recording ? <Square size={17} /> : <Circle size={17} />} {recording ? 'Stop' : 'Rekam'}</button>
            <button className="pill-btn" onClick={stopCamera}>Matikan</button>
          </div>
        )}
      </section>

      {preview && (
        <section className="card">
          <h3>Preview</h3>
          {preview.type === 'video' ? <video src={preview.url} controls playsInline /> : <img src={preview.url} alt="Preview kamera" />}
          <button className="primary-btn" onClick={uploadPreview} disabled={busy}><Upload size={17} /> {busy ? 'Uploading...' : 'Upload ke Storage'}</button>
        </section>
      )}

      <section className="card">
        <h3>Media Kamu</h3>
        {assets.length ? <div className="media-grid">
          {assets.map(a => a.media_type === 'video'
            ? <video key={a.id} src={publicUrl(a.bucket, a.path)} controls />
            : <img key={a.id} src={publicUrl(a.bucket, a.path)} alt="" />
          )}
        </div> : <LoadingState label="Belum ada media tersimpan." />}
      </section>
    </div>
  )
}
