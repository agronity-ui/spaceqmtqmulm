import { useEffect, useRef, useState } from 'react'
import { supabase, publicUrl, uploadFile } from '../../lib/supabase'
import LoadingState from '../../components/LoadingState.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { Bookmark, Flag, Heart, MessageCircle, MoreHorizontal, Trash2, Upload, Volume2, VolumeX } from 'lucide-react'
import { isAllowedMedia, localModerateText } from '../../lib/api/moderation'

export default function SocialQ({ user, profile, toast }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState(null)
  const [following, setFollowing] = useState(new Set())

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:profile_id(id, display_name, username, avatar_url),
        post_likes(user_id),
        post_saves(user_id),
        comments(id)
      `)
      .in('status', ['published', 'pending'])
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) toast(error.message, 'error')
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
    setFollowing(new Set((follows || []).map(f => f.following_id)))
    setPosts((data || []).map(p => ({
      ...p,
      liked: p.post_likes?.some(x => x.user_id === user.id),
      saved: p.post_saves?.some(x => x.user_id === user.id),
      like_count: p.post_likes?.length || 0,
      comment_count: p.comments?.length || 0
    })))
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
    const channel = supabase.channel('socialq-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, loadPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, loadPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, loadPosts)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user.id])

  async function createPost(e) {
    e.preventDefault()
    if (!file) return toast('Pilih foto atau video dulu.', 'error')
    if (!isAllowedMedia(file)) return toast('Format/ukuran media tidak didukung. Maksimal 100MB.', 'error')
    const moderation = localModerateText(caption)
    if (!moderation.approved) return toast('Caption terdeteksi tidak aman. Perbaiki dulu.', 'error')

    try {
      setBusy(true)
      const mediaType = file.type.startsWith('video') ? 'video' : 'image'
      const path = await uploadFile('social-media', user.id, file, mediaType)
      const { error } = await supabase.from('posts').insert({
        profile_id: user.id,
        caption,
        media_path: path,
        media_type: mediaType,
        status: 'published',
        moderation_score: moderation.score
      })
      if (error) throw error
      setCaption('')
      setFile(null)
      e.target.reset()
      toast('Postingan berhasil diupload.', 'success')
    } catch (err) {
      toast(err.message || 'Gagal upload postingan.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function toggleLike(post) {
    if (post.liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
      if (post.profile_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.profile_id,
          actor_id: user.id,
          type: 'like',
          title: 'Postinganmu disukai',
          body: `${profile?.display_name || 'Seseorang'} menyukai postinganmu.`,
          entity_id: post.id
        })
      }
    }
    loadPosts()
  }

  async function toggleSave(post) {
    if (post.saved) await supabase.from('post_saves').delete().eq('post_id', post.id).eq('user_id', user.id)
    else await supabase.from('post_saves').insert({ post_id: post.id, user_id: user.id })
    loadPosts()
  }

  async function editPost(post) {
    const next = prompt('Edit caption:', post.caption || '')
    if (next === null) return
    const moderation = localModerateText(next)
    if (!moderation.approved) return toast('Caption terdeteksi tidak aman.', 'error')
    const { error } = await supabase.from('posts').update({ caption: next }).eq('id', post.id).eq('profile_id', user.id)
    if (error) toast(error.message, 'error')
    else { toast('Caption diperbarui.', 'success'); loadPosts() }
  }

  async function toggleFollow(profileId) {
    if (!profileId || profileId === user.id) return
    if (following.has(profileId)) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId)
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId })
      await supabase.from('notifications').insert({
        user_id: profileId,
        actor_id: user.id,
        type: 'follow',
        title: 'Follower baru',
        body: `${profile?.display_name || 'Seseorang'} mulai mengikuti kamu.`
      })
    }
    loadPosts()
  }

  async function deletePost(post) {
    if (!confirm('Hapus postingan ini?')) return
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (error) toast(error.message, 'error')
    else toast('Postingan dihapus.', 'success')
  }

  async function reportPost(post) {
    const reason = prompt('Alasan report postingan ini?')
    if (!reason) return
    const { error } = await supabase.from('reports').insert({ reporter_id: user.id, post_id: post.id, reason })
    if (error) toast(error.message, 'error')
    else toast('Report terkirim ke moderator.', 'success')
  }

  return (
    <div className="stack socialq-screen">
      <div className="section-head">
        <div>
          <p className="muted tiny">SocialQ</p>
          <h2>Postingan bulat, realtime.</h2>
        </div>
      </div>

      <form className="composer card" onSubmit={createPost}>
        <input type="file" accept="image/*,video/mp4,video/webm" onChange={e => setFile(e.target.files?.[0] || null)} />
        <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Tulis caption islami atau aktivitas positif..." maxLength={700} />
        <button className="primary-btn" disabled={busy}><Upload size={17} /> {busy ? 'Mengupload...' : 'Upload Postingan'}</button>
      </form>

      {loading ? <LoadingState label="Memuat SocialQ..." /> : posts.length ? (
        <div className="feed">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLike={() => toggleLike(post)}
              onSave={() => toggleSave(post)}
              onDelete={() => deletePost(post)}
              onEdit={() => editPost(post)}
              onReport={() => reportPost(post)}
              onFollow={() => toggleFollow(post.profile_id)}
              isFollowing={following.has(post.profile_id)}
              onDetail={() => setDetail(post)}
            />
          ))}
        </div>
      ) : (
        <EmptyState icon="🟢" title="SocialQ masih kosong" body="Jadilah orang pertama yang mengupload foto/video." />
      )}

      {detail && <PostDetail post={detail} user={user} profile={profile} close={() => setDetail(null)} refresh={loadPosts} toast={toast} />}
    </div>
  )
}

function PostCard({ post, currentUser, onLike, onSave, onDelete, onEdit, onReport, onFollow, isFollowing, onDetail }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!videoRef.current) return
    const video = videoRef.current
    const obs = new IntersectionObserver(entries => {
      const entry = entries[0]
      if (entry.intersectionRatio >= 1) {
        video.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      } else {
        video.pause()
        setPlaying(false)
      }
    }, { threshold: [0, 0.01, 0.5, 1] })
    obs.observe(video)
    return () => obs.disconnect()
  }, [post.id])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted
  }, [muted])

  return (
    <article className="post-card">
      <header className="post-head">
        <img className="avatar" src={post.profiles?.avatar_url || '/icons/icon-192.svg'} alt="" />
        <div>
          <b>{post.profiles?.display_name || 'SpaceQ User'}</b>
          <small>@{post.profiles?.username || 'user'} · {new Date(post.created_at).toLocaleDateString('id-ID')}</small>
        </div>
        {post.profile_id !== currentUser.id && <button className="pill-btn mini" onClick={onFollow}>{isFollowing ? 'Following' : 'Follow'}</button>}
        <button className="icon-btn" onClick={onReport} aria-label="Report"><Flag size={18} /></button>
      </header>

      <div className="socialq-media-shell" onClick={onDetail}>
        {post.media_type === 'video' ? (
          <>
            <video ref={videoRef} src={publicUrl('social-media', post.media_path)} playsInline loop muted={muted} preload="metadata" />
            {!playing && <span className="video-play-dot">▶</span>}
            <button className="sound-btn" onClick={e => { e.stopPropagation(); setMuted(m => !m) }}>
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </>
        ) : <img src={publicUrl('social-media', post.media_path)} alt={post.caption || 'Postingan SocialQ'} />}
      </div>

      <p className="caption">{post.caption}</p>
      <footer className="post-actions">
        <button className={post.liked ? 'active' : ''} onClick={onLike}><Heart size={19} fill={post.liked ? 'currentColor' : 'none'} /> {post.like_count}</button>
        <button onClick={onDetail}><MessageCircle size={19} /> {post.comment_count}</button>
        <button className={post.saved ? 'active' : ''} onClick={onSave}><Bookmark size={19} fill={post.saved ? 'currentColor' : 'none'} /></button>
        {post.profile_id === currentUser.id && <button onClick={onEdit}><MoreHorizontal size={18} /></button>}
        {post.profile_id === currentUser.id && <button onClick={onDelete}><Trash2 size={18} /></button>}
      </footer>
    </article>
  )
}

function PostDetail({ post, user, profile, close, refresh, toast }) {
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:profile_id(display_name, username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  useEffect(() => {
    loadComments()
    const channel = supabase.channel(`comments-${post.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, loadComments).subscribe()
    return () => supabase.removeChannel(channel)
  }, [post.id])

  async function addComment(e) {
    e.preventDefault()
    if (!text.trim()) return
    const moderation = localModerateText(text)
    if (!moderation.approved) return toast('Komentar mengandung kata yang diblokir.', 'error')
    const { error } = await supabase.from('comments').insert({ post_id: post.id, profile_id: user.id, body: text })
    if (error) toast(error.message, 'error')
    else {
      setText('')
      refresh()
      if (post.profile_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.profile_id,
          actor_id: user.id,
          type: 'comment',
          title: 'Komentar baru',
          body: `${profile?.display_name || 'Seseorang'} mengomentari postinganmu.`,
          entity_id: post.id
        })
      }
    }
  }

  return (
    <div className="modal-backdrop" role="dialog">
      <div className="modal-sheet">
        <button className="close-btn" onClick={close}>Tutup</button>
        <h3>Detail Postingan</h3>
        <p className="caption">{post.caption}</p>
        <div className="comments">
          {comments.map(c => (
            <div className="comment" key={c.id}>
              <img className="avatar small" src={c.profiles?.avatar_url || '/icons/icon-192.svg'} alt="" />
              <div><b>@{c.profiles?.username || 'user'}</b><p>{c.body}</p></div>
            </div>
          ))}
        </div>
        <form onSubmit={addComment} className="comment-form">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Tulis komentar..." />
          <button>Kirim</button>
        </form>
      </div>
    </div>
  )
}
