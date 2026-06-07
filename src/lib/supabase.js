import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SpaceQ] Supabase env belum diisi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env.local')
}

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'dev-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

export function publicUrl(bucket, path) {
  if (!path) return ''
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFile(bucket, userId, file, folder = '') {
  if (!file) return null
  const safeName = file.name.replace(/[^\w.\-]+/g, '_').toLowerCase()
  const filePath = `${userId}/${folder ? `${folder}/` : ''}${crypto.randomUUID()}-${safeName}`
  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type
  })
  if (error) throw error
  return data.path
}

export function subscribeTable(table, callback, filter = '*') {
  const channel = supabase
    .channel(`spaceq-${table}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, callback)
    .subscribe()
  return () => supabase.removeChannel(channel)
}
