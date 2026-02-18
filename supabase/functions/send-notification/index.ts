
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@4.14.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Service Account details from environment variables
const getServiceAccount = () => {
  const projectId = Deno.env.get('FIREBASE_PROJECT_ID')
  const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL')
  const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)')
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, '\n'),
  }
}

// Helper to get access token
async function getAccessToken({ client_email, private_key }: { client_email: string, private_key: string }) {
  try {
    const alg = 'RS256'
    const privateKey = await importPKCS8(private_key, alg)

    const jwt = await new SignJWT({
      iss: client_email,
      sub: client_email,
      aud: "https://oauth2.googleapis.com/token",
      scope: 'https://www.googleapis.com/auth/firebase.messaging'
    })
      .setProtectedHeader({ alg, typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setIssuer(client_email)
      .setSubject(client_email)
      .setAudience("https://oauth2.googleapis.com/token")
      .sign(privateKey)

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(`Auth failed: ${JSON.stringify(data)}`)
    }
    return data.access_token
  } catch (err) {
    console.error("Error getting access token:", err)
    throw err
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Parse the request body
    const { taskId, title, body, type, unitId } = await req.json()

    if (!title || !body) {
      throw new Error('Missing required fields')
    }

    console.log(`Processing notification for unit ${unitId || 'all'}: ${title}`)

    // Get all users who have registered for notifications in the specified unit
    let query = supabaseClient
      .from('device_tokens')
      .select('token')

    if (unitId) {
      query = query.eq('unit_id', unitId)
    }

    const { data: deviceTokens, error: tokensError } = await query

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

    // Get Service Account and Access Token
    const serviceAccount = getServiceAccount()
    const accessToken = await getAccessToken(serviceAccount)

    if (!accessToken) {
      throw new Error('Failed to generate access token')
    }

    // Send notifications
    const projectId = serviceAccount.project_id
    const results = []

    for (const device of deviceTokens) {
      const token = device.token
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token: token,
                notification: {
                  title: title,
                  body: body,
                },
                data: {
                  taskId: taskId ? String(taskId) : '',
                  type: type || 'INFO',
                },
              },
            }),
          }
        )

        const result = await response.json()
        results.push({ token, result })

        if (!response.ok) {
          console.error(`Failed to send to ${token}:`, result)

          if (result.error?.details?.some((d: any) => d.errorCode === 'UNREGISTERED')) {
            console.log(`Deleting unregistered token: ${token}`)
            const { error: deleteError } = await supabaseClient
              .from('device_tokens')
              .delete()
              .eq('token', token)

            if (deleteError) {
              console.error(`Failed to delete unregistered token:`, deleteError)
            }
          }
        }
      } catch (sendError) {
        console.error(`Error sending to ${token}:`, sendError)
        results.push({ token, error: sendError.message })
      }
    }

    return new Response(JSON.stringify({
      message: 'Notifications processed',
      results
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
