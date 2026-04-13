import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Look up token
    const { data: confirmation, error: fetchError } = await supabase
      .from('email_confirmations')
      .select('*')
      .eq('token', token)
      .single()

    if (fetchError || !confirmation) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (confirmation.confirmed) {
      return new Response(JSON.stringify({ success: true, message: 'Email already confirmed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (new Date(confirmation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Token has expired. Please request a new confirmation email.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark token as confirmed
    await supabase
      .from('email_confirmations')
      .update({ confirmed: true })
      .eq('id', confirmation.id)

    // Mark profile as email_confirmed
    await supabase
      .from('profiles')
      .update({ email_confirmed: true })
      .eq('id', confirmation.user_id)

    return new Response(JSON.stringify({ success: true, message: 'Email confirmed!' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in confirm-email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
