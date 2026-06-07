import { Bell, BookOpen, Camera, Home, MessageCircle, MoonStar, PenLine, Search, Settings, UsersRound } from 'lucide-react'

const items = [
  { key: 'home', label: 'Beranda', icon: Home },
  { key: 'social', label: 'SocialQ', icon: UsersRound },
  { key: 'camera', label: 'Kamera', icon: Camera, center: true },
  { key: 'quran', label: 'Quran', icon: BookOpen },
  { key: 'profile', label: 'Profil', icon: Settings }
]

export function AppShell({ view, setView, profile, children }) {
  return (
    <main className="device">
      <div className="device-glow" />
      <header className="topbar">
        <div>
          <p className="muted tiny">Assalamu’alaikum</p>
          <h1>{profile?.display_name || 'SpaceQ'}</h1>
        </div>
        <button className="icon-btn" onClick={() => setView('notifications')} aria-label="Notifikasi"><Bell size={20} /></button>
      </header>

      <section className="screen">
        {children}
      </section>

      <nav className="bottom-nav" aria-label="Navigasi utama">
        {items.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              className={`nav-btn ${view === item.key ? 'active' : ''} ${item.center ? 'center' : ''}`}
              onClick={() => setView(item.key)}
            >
              <Icon size={item.center ? 26 : 20} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </main>
  )
}

export function FeatureGrid({ setView }) {
  const cards = [
    { key: 'sholat', title: 'SholatQ', body: 'Jadwal, kiblat, checklist', icon: MoonStar },
    { key: 'jurnal', title: 'JurnalQ', body: 'Mood, kalender, streak', icon: PenLine },
    { key: 'kajian', title: 'KajianQ', body: 'Room, chat, peserta', icon: MessageCircle },
    { key: 'murajaah', title: 'MurajaahQ', body: 'Rekam suara & skor', icon: Search }
  ]
  return <div className="feature-grid">
    {cards.map(card => {
      const Icon = card.icon
      return (
        <button className="feature-card" key={card.key} onClick={() => setView(card.key)}>
          <span className="feature-icon"><Icon size={24} /></span>
          <b>{card.title}</b>
          <small>{card.body}</small>
        </button>
      )
    })}
  </div>
}
