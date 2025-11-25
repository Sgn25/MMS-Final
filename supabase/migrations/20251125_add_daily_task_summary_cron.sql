-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- IMPORTANT: Before running this migration, replace the placeholders below:
-- 1. Replace YOUR_SUPABASE_PROJECT_URL with your actual Supabase project URL
--    Example: https://abcdefghijklmnop.supabase.co
-- 2. Replace YOUR_SUPABASE_ANON_KEY with your actual anon key
--    (Found in Project Settings > API > Project API keys > anon public)
-- ============================================================================

-- Create a cron job to run daily at 8:00 AM IST (2:30 AM UTC)
-- IST is UTC+5:30, so 8:00 AM IST = 2:30 AM UTC
-- Cron schedule: 30 2 * * * (minute hour day month weekday)
DO $$
BEGIN
  -- Delete existing job if it exists (for re-running migration)
  PERFORM cron.unschedule('daily-task-summary-8am-ist');
EXCEPTION
  WHEN undefined_object THEN
    NULL;  -- Job doesn't exist, that's fine
END $$;

SELECT cron.schedule(
  'daily-task-summary-8am-ist',  -- Job name
  '30 2 * * *',                   -- At 2:30 AM UTC (8:00 AM IST) every day
  $$
  SELECT
    net.http_post(
      url := 'YOUR_SUPABASE_PROJECT_URL/functions/v1/daily-task-summary',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SUPABASE_ANON_KEY'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
