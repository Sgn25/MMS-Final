
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

        console.log('Fetching units for daily task summary...')
        const { data: units, error: unitsError } = await supabaseClient
            .from('units')
            .select('id, name')

        if (unitsError) throw unitsError
        if (!units || units.length === 0) {
            return new Response(JSON.stringify({ message: 'No units found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        const overallResults = []

        for (const unit of units) {
            console.log(`Processing summary for unit: ${unit.name} (${unit.id})`)

            // Query pending tasks for this unit
            const { data: pendingTasks, error: pendingError } = await supabaseClient
                .from('tasks')
                .select('id, title')
                .eq('status', 'Pending')
                .eq('unit_id', unit.id)
                .order('created_at', { ascending: true })

            if (pendingError) {
                console.error(`Error fetching pending tasks for unit ${unit.name}:`, pendingError)
                continue
            }

            // Query in-progress tasks for this unit
            const { data: inProgressTasks, error: inProgressError } = await supabaseClient
                .from('tasks')
                .select('id, title')
                .eq('status', 'In Progress')
                .eq('unit_id', unit.id)
                .order('created_at', { ascending: true })

            if (inProgressError) {
                console.error(`Error fetching in-progress tasks for unit ${unit.name}:`, inProgressError)
                continue
            }

            // Prepare notification data
            const notifications = []

            // Notification 1: Pending tasks
            if (pendingTasks && pendingTasks.length > 0) {
                const pendingCount = pendingTasks.length
                const taskWord = pendingCount === 1 ? 'task' : 'tasks'
                const verbForm = pendingCount === 1 ? 'is' : 'are'
                const taskList = pendingTasks.map((task, index) => `${index + 1}. ${task.title}`).join('\n')

                notifications.push({
                    title: `[${unit.name}] ${pendingCount} ${taskWord} Pending`,
                    body: taskList,
                    type: 'PENDING_SUMMARY',
                    unitId: unit.id
                })
            }

            // Notification 2: In Progress tasks
            if (inProgressTasks && inProgressTasks.length > 0) {
                const inProgressCount = inProgressTasks.length
                const taskWord = inProgressCount === 1 ? 'task' : 'tasks'
                const verbForm = inProgressCount === 1 ? 'is' : 'are'
                const taskList = inProgressTasks.map((task, index) => `${index + 1}. ${task.title}`).join('\n')

                notifications.push({
                    title: `[${unit.name}] ${inProgressCount} ${taskWord} In Progress`,
                    body: taskList,
                    type: 'IN_PROGRESS_SUMMARY',
                    unitId: unit.id
                })
            }

            // Send notifications if there are any
            if (notifications.length > 0) {
                const sendNotificationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`

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
                        overallResults.push({ unit: unit.name, notification: notification.title, result })
                        console.log(`Sent notification for ${unit.name}: ${notification.title}`)
                    } catch (sendError) {
                        console.error(`Error sending notification for ${unit.name}:`, sendError)
                        overallResults.push({ unit: unit.name, notification: notification.title, error: sendError.message })
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            message: 'Daily task summaries processed',
            results: overallResults
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error in daily-task-summary function:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
