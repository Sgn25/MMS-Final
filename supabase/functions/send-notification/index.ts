
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the current session to check if the user is authenticated
    const {
      data: { session },
    } = await supabaseClient.auth.getSession()

    if (!session) {
      throw new Error('Not authenticated')
    }

    // Parse the request body
    const { taskId, title, body, type } = await req.json()

    if (!taskId || !title || !body || !type) {
      throw new Error('Missing required fields')
    }

    // Log the notification information
    console.log(`Sending notification for task ${taskId}: ${title} - ${body}`)

    // Get all users who have registered for notifications
    // In a real app, you might want to filter by user role or task assignment
    const { data: deviceTokens, error: tokensError } = await supabaseClient
      .from('device_tokens')
      .select('token')

    if (tokensError) {
      throw new Error(`Error fetching device tokens: ${tokensError.message}`)
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No registered devices found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Found ${deviceTokens.length} registered devices`)

    // Extract all tokens
    const tokens = deviceTokens.map(device => device.token)

    // This could be a call to Firebase FCM API in a production setup
    // For now, we'll just log that we would send notifications
    console.log(`Would send notification to ${tokens.length} devices`)
    console.log('Tokens:', tokens)
    console.log('Title:', title)
    console.log('Body:', body)

    // In a complete implementation, you would:
    // 1. Call the Firebase FCM HTTP v1 API to send notifications
    // 2. Handle any errors from the FCM API
    // 3. Log the results

    return new Response(JSON.stringify({ 
      message: 'Notifications would be sent (FCM implementation required)' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in notification function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
