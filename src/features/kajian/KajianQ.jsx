import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { MessageCircle, Plus, UsersRound, Video } from 'lucide-react'

export default function KajianQ({ user, profile, toast }) {
  const [rooms, setRooms] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRoom, setNewRoom] = useState({ title: '', description: '', scheduled_at: '', meeting_url: '' })
  const [message, setMessage] = useState('')

  async function loadRooms() {
    setLoading(true)
    const { data, error } = await supabase
      .from('kajian_rooms')
      .select('*, host:host_id(display_name, username, avatar_url), kajian_participants(user_id)')
      .order('scheduled_at', { ascending: true })
    if (error) toast(error.message, 'error')
    setRooms(data || [])
    setLoading(false)
  }

  async function loadMessages(roomId) {
    const { data } = await supabase
      .from('kajian_messages')
      .select('*, profiles:profile_id(display_name, username, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  useEffect(() => {
    loadRooms()
    const channel = supabase.channel('kajianq-rooms').on('postgres_changes', { event: '*', schema: 'public', table: 'kajian_rooms' }, loadRooms).subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    if (!active?.id) return
    loadMessages(active.id)
    const channel = supabase.channel(`kajian-room-${active.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kajian_messages', filter: `room_id=eq.${active.id}` }, () => loadMessages(active.id))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [active?.id])

  async function createRoom(e) {
    e.preventDefault()
    if (!newRoom.title.trim()) return toast('Judul room wajib diisi.', 'error')
    const { data, error } = await supabase.from('kajian_rooms').insert({
      ...newRoom,
      host_id: user.id,
      scheduled_at: newRoom.scheduled_at || new Date().toISOString(),
      status: 'scheduled'
    }).select().single()
    if (error) toast(error.message, 'error')
    else {
      toast('Room kajian dibuat.', 'success')
      setNewRoom({ title: '', description: '', scheduled_at: '', meeting_url: '' })
      setActive(data)
      await joinRoom(data)
    }
  }

  async function joinRoom(room) {
    await supabase.from('kajian_participants').upsert({ room_id: room.id, user_id: user.id, role: room.host_id === user.id ? 'host' : 'participant' })
    setActive(room)
    loadRooms()
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!message.trim() || !active) return
    const { error } = await supabase.from('kajian_messages').insert({ room_id: active.id, profile_id: user.id, body: message, message_type: 'text' })
    if (error) toast(error.message, 'error')
    else setMessage('')
  }

  return (
    <div className="stack">
      <section className="hero-card kajian">
        <p className="muted tiny">KajianQ</p>
        <h2>Room kajian realtime.</h2>
        <p>Chat room, peserta, host, dan meeting link tersimpan di backend.</p>
      </section>

      {!active && (
        <form className="card stack" onSubmit={createRoom}>
          <h3>Buat Room Kajian</h3>
          <input value={newRoom.title} onChange={e => setNewRoom({ ...newRoom, title: e.target.value })} placeholder="Judul kajian" />
          <textarea value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} placeholder="Deskripsi kajian" />
          <input type="datetime-local" value={newRoom.scheduled_at} onChange={e => setNewRoom({ ...newRoom, scheduled_at: e.target.value })} />
          <input value={newRoom.meeting_url} onChange={e => setNewRoom({ ...newRoom, meeting_url: e.target.value })} placeholder="Link Google Meet/Zoom/WebRTC opsional" />
          <button className="primary-btn"><Plus size={17} /> Buat Room</button>
        </form>
      )}

      {active ? (
        <section className="card stack kajian-room">
          <button className="pill-btn" onClick={() => setActive(null)}>← Kembali ke Lobby</button>
          <div className="section-head">
            <div>
              <p className="muted tiny">Room aktif</p>
              <h3>{active.title}</h3>
              <p>{active.description}</p>
            </div>
          </div>
          {active.meeting_url && <a className="primary-btn link-btn" href={active.meeting_url} target="_blank" rel="noreferrer"><Video size={17} /> Join Meeting</a>}
          <div className="chat-box">
            {messages.map(m => (
              <div className={`chat-msg ${m.profile_id === user.id ? 'mine' : ''}`} key={m.id}>
                <small>@{m.profiles?.username || 'user'}</small>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="comment-form">
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Tulis chat kajian..." />
            <button><MessageCircle size={16} /></button>
          </form>
        </section>
      ) : (
        <section className="card">
          <h3>Lobby Kajian</h3>
          {loading ? <LoadingState /> : rooms.length ? (
            <div className="journal-list">
              {rooms.map(room => (
                <article className="room-card" key={room.id}>
                  <div>
                    <small>{new Date(room.scheduled_at).toLocaleString('id-ID')} · Host @{room.host?.username || 'host'}</small>
                    <h4>{room.title}</h4>
                    <p>{room.description}</p>
                    <span><UsersRound size={14} /> {room.kajian_participants?.length || 0} peserta</span>
                  </div>
                  <button className="pill-btn" onClick={() => joinRoom(room)}>Join</button>
                </article>
              ))}
            </div>
          ) : <EmptyState icon="🎙️" title="Belum ada room" body="Buat room kajian pertama untuk mulai." />}
        </section>
      )}
    </div>
  )
}
