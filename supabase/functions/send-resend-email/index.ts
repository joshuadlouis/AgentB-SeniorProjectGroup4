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

    const payload = await req.json()
    const { email, full_name, user_id, created_at } = payload

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email in payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const htmlBody = `
      <h2>Welcome to AgentB! 🎓</h2>
      <p>A new account has been created with the following details:</p>
      <table style="border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;font-weight:bold;">Name</td><td style="padding:8px;">${full_name || 'N/A'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">User ID</td><td style="padding:8px;">${user_id}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;">Signed Up</td><td style="padding:8px;">${created_at}</td></tr>
      </table>
      <p>Welcome aboard!</p>
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
        subject: 'Welcome to AgentB!',
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

    console.log('Email sent successfully:', resendData)
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
