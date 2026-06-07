// Supabase Edge Function: send-push
// Deploy: supabase functions deploy send-push
// Secret yang perlu diisi:
// supabase secrets set FCM_SERVER_KEY=...
// Catatan: contoh ini memakai FCM legacy HTTP agar setup awam lebih mudah. Untuk skala besar, pakai HTTP v1 + service account.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { user_id, title, body, data } = await req.json()

  const { data: tokens, error } = await supabase
    .from('push_subscriptions')
    .select('token')
    .eq('user_id', user_id)
    .eq('enabled', true)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!tokens?.length) return Response.json({ sent: 0 })

  const serverKey = Deno.env.get('FCM_SERVER_KEY')
  if (!serverKey) return Response.json({ error: 'FCM_SERVER_KEY belum diset.' }, { status: 500 })

  const results = await Promise.all(tokens.map(({ token }) => fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `key=${serverKey}`
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body, icon: '/icons/icon-192.svg' },
      data: data || {}
    })
  }).then(r => r.json())))

  return Response.json({ sent: results.length, results })
})
