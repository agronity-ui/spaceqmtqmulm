import { useEffect, useMemo, useState } from 'react'
import { FeatureGrid } from '../../components/Shell.jsx'
import { supabase, publicUrl } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { Heart, MessageCircle, Play } from 'lucide-react'

export default function Home({ user, profile, setView }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const stats = useMemo(() => ({
    salam: new Date().getHours() < 11 ? 'Pagi' : new Date().getHours() < 15 ? 'Siang' : new Date().getHours() < 18 ? 'Sore' : 'Malam'
  }), [])

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('posts')
        .select('id, caption, media_type, media_path, thumbnail_path, created_at, profiles:profile_id(display_name, username, avatar_url)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6)
      if (!ignore) {
        setPosts(data || [])
        setLoading(false)
      }
    }
    load()
    const channel = supabase.channel('home-social-preview').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, load).subscribe()
    return () => { ignore = true; supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="stack">
      <section className="hero-card">
        <div>
          <p className="muted tiny">Selamat {stats.salam}</p>
          <h2>Tingkatkan amal & ilmu hari ini.</h2>
          <p>Semua fitur SpaceQ sudah unlocked dan tersambung ke akunmu.</p>
        </div>
      </section>

      <FeatureGrid setView={setView} />

      <section className="card">
        <div className="section-head">
          <div>
            <p className="muted tiny">Preview SocialQ</p>
            <h3>Postingan bulat terbaru</h3>
          </div>
          <button className="pill-btn" onClick={() => setView('social')}>Lihat semua</button>
        </div>
        {loading ? <LoadingState label="Memuat feed..." /> : posts.length ? (
          <div className="round-preview-row">
            {posts.slice(0, 3).map(post => (
              <button className="round-preview" key={post.id} onClick={() => setView('social')}>
                <div className="round-media">
                  {post.media_type === 'video' ? (
                    <>
                      <video src={publicUrl('social-media', post.media_path)} muted playsInline />
                      <span className="round-play"><Play size={18} /></span>
                    </>
                  ) : <img src={publicUrl('social-media', post.media_path)} alt="" />}
                </div>
                <b>@{post.profiles?.username || 'spaceq'}</b>
                <small>{post.caption || 'Tanpa caption'}</small>
                <span className="round-actions"><Heart size={13} /> <MessageCircle size={13} /></span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState icon="🟢" title="Feed masih kosong" body="Upload postingan pertama di SocialQ." />
        )}
      </section>

      <section className="donation-card">
        <p className="muted tiny">Muhsinin</p>
        <h3>Dukungan opsional</h3>
        <p>Muhsinin di versi production ini hanya halaman dukungan. Tidak ada fitur yang dikunci.</p>
      </section>
    </div>
  )
}
