import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export function useSession() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })
    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null)
        return
      }
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!cancelled) {
        if (error) console.warn('[profile]', error)
        setProfile(data || null)
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [session?.user?.id])

  return { session, user: session?.user || null, profile, setProfile, loading }
}
