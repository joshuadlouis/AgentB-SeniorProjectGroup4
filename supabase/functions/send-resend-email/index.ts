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
    const RESEND_API_KEY = Deno.env.get('RESENT_API')
    if (!RESEND_API_KEY) {
      throw new Error('RESENT_API secret is not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    const { email, full_name, user_id } = payload

    if (!email || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing email or user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate confirmation token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase
      .from('email_confirmations')
      .insert({ user_id, email, token, expires_at: expiresAt })

    if (insertError) {
      console.error('Failed to insert confirmation token:', insertError)
      throw new Error('Failed to create confirmation record')
    }

    // Build confirmation URL — uses the app's origin
    const appOrigin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/+$/, '') || 'https://id-preview--2ff4f1e4-820f-4f1e-a272-8274a37c83d0.lovable.app'
    const confirmUrl = `${appOrigin}/confirm-email?token=${token}`

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
        <h2 style="color:#1a1a2e;margin-bottom:8px;">Welcome to AgentB! 🎓</h2>
        <p style="color:#555;font-size:15px;">Hi ${full_name || 'there'},</p>
        <p style="color:#555;font-size:15px;">Thanks for signing up. Please confirm your email address to get started:</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${confirmUrl}"
             style="background-color:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
            Confirm Email Address
          </a>
        </div>
        <p style="color:#999;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
      </div>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'AgentB <onboarding@resend.dev>',
        to: [email],
        subject: 'Confirm your AgentB email address',
        html: htmlBody,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData)
      return new Response(JSON.stringify({ error: 'Failed to send email', details: resendData }), {
        status: resendResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Confirmation email sent:', resendData)
    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in send-resend-email:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
