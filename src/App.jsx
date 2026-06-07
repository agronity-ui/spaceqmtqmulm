import AuthPage from './features/auth/AuthPage.jsx'
import Home from './features/home/Home.jsx'
import SocialQ from './features/social/SocialQ.jsx'
import SholatQ from './features/sholat/SholatQ.jsx'
import JurnalQ from './features/jurnal/JurnalQ.jsx'
import QuranQ from './features/quran/QuranQ.jsx'
import MurajaahQ from './features/murajaah/MurajaahQ.jsx'
import KajianQ from './features/kajian/KajianQ.jsx'
import CameraQ from './features/camera/CameraQ.jsx'
import ProfileQ from './features/profile/ProfileQ.jsx'
import AdminQ from './features/admin/AdminQ.jsx'
import LoadingState from './components/LoadingState.jsx'
import { AppShell } from './components/Shell.jsx'
import { ToastHost, useToastState } from './components/Toast.jsx'
import { useSession } from './lib/hooks/useSession'
import { useEffect, useState } from 'react'

export default function App() {
  const { user, profile, setProfile, loading } = useSession()
  const [view, setView] = useState('home')
  const { toasts, push } = useToastState()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-fcm.js').catch(() => {})
    }
  }, [])

  if (loading) return <LoadingState label="Menyiapkan SpaceQ..." />

  if (!user) {
    return <>
      <AuthPage toast={push} />
      <ToastHost toasts={toasts} />
    </>
  }

  const common = { user, profile, setProfile, setView, toast: push }

  return (
    <>
      <AppShell view={view} setView={setView} profile={profile}>
        {view === 'home' && <Home {...common} />}
        {view === 'social' && <SocialQ {...common} />}
        {view === 'sholat' && <SholatQ {...common} />}
        {view === 'jurnal' && <JurnalQ {...common} />}
        {view === 'quran' && <QuranQ {...common} />}
        {view === 'murajaah' && <MurajaahQ {...common} />}
        {view === 'kajian' && <KajianQ {...common} />}
        {view === 'camera' && <CameraQ {...common} />}
        {view === 'profile' && <ProfileQ {...common} />}
        {view === 'admin' && <AdminQ {...common} />}
        {view === 'notifications' && <ProfileQ {...common} startTab="notifications" />}
      </AppShell>
      <ToastHost toasts={toasts} />
    </>
  )
}
