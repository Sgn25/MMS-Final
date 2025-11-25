
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
        // Create a Supabase client with service role key for full access
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        )

        console.log('Fetching daily task summary...')

        // Query pending tasks
        const { data: pendingTasks, error: pendingError } = await supabaseClient
            .from('tasks')
            .select('id, title')
            .eq('status', 'Pending')
            .order('created_at', { ascending: true })

        if (pendingError) {
            throw new Error(`Error fetching pending tasks: ${pendingError.message}`)
        }

        // Query in-progress tasks
        const { data: inProgressTasks, error: inProgressError } = await supabaseClient
            .from('tasks')
            .select('id, title')
            .eq('status', 'In Progress')
            .order('created_at', { ascending: true })

        if (inProgressError) {
            throw new Error(`Error fetching in-progress tasks: ${inProgressError.message}`)
        }

        console.log(`Found ${pendingTasks?.length || 0} pending and ${inProgressTasks?.length || 0} in-progress tasks`)

        // Prepare notification data
        const notifications = []

        // Notification 1: Pending tasks
        if (pendingTasks && pendingTasks.length > 0) {
            const pendingCount = pendingTasks.length
            const taskWord = pendingCount === 1 ? 'task' : 'tasks'
            const verbForm = pendingCount === 1 ? 'is' : 'are'
            const taskList = pendingTasks.map((task, index) => `${index + 1}. ${task.title}`).join('\n')

            notifications.push({
                title: `Total ${pendingCount} ${taskWord} ${verbForm} Pending`,
                body: taskList,
                type: 'PENDING_SUMMARY'
            })
        }

        // Notification 2: In Progress tasks
        if (inProgressTasks && inProgressTasks.length > 0) {
            const inProgressCount = inProgressTasks.length
            const taskWord = inProgressCount === 1 ? 'task' : 'tasks'
            const verbForm = inProgressCount === 1 ? 'is' : 'are'
            const taskList = inProgressTasks.map((task, index) => `${index + 1}. ${task.title}`).join('\n')

            notifications.push({
                title: `Total ${inProgressCount} ${taskWord} ${verbForm} In Progress`,
                body: taskList,
                type: 'IN_PROGRESS_SUMMARY'
            })
        }

        // Send notifications if there are any
        if (notifications.length > 0) {
            const sendNotificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`
            const results = []

            for (const notification of notifications) {
                try {
                    const response = await fetch(sendNotificationUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(notification),
                    })

                    const result = await response.json()
                    results.push({ notification: notification.title, result })

                    if (!response.ok) {
                        console.error(`Failed to send notification: ${notification.title}`, result)
                    } else {
                        console.log(`Successfully sent notification: ${notification.title}`)
                    }
                } catch (sendError) {
                    console.error(`Error sending notification: ${notification.title}`, sendError)
                    results.push({ notification: notification.title, error: sendError.message })
                }
            }

            return new Response(JSON.stringify({
                message: 'Daily task summary processed',
                pendingCount: pendingTasks?.length || 0,
                inProgressCount: inProgressTasks?.length || 0,
                notificationsSent: notifications.length,
                results
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        } else {
            return new Response(JSON.stringify({
                message: 'No tasks to report',
                pendingCount: 0,
                inProgressCount: 0,
                notificationsSent: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

    } catch (error) {
        console.error('Error in daily-task-summary function:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
