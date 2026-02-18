-- 1. Drop ALL potential duplicate triggers
DROP TRIGGER IF EXISTS on_task_change ON public.tasks;
DROP TRIGGER IF EXISTS on_task_created ON public.tasks;
DROP TRIGGER IF EXISTS on_task_updated ON public.tasks;
DROP TRIGGER IF EXISTS on_task_deleted ON public.tasks;
DROP TRIGGER IF EXISTS task_notification_trigger ON public.tasks;

-- 2. Ensure pg_net extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- 3. Update the function to use assigned_to text directly
CREATE OR REPLACE FUNCTION public.handle_task_changes()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  notification_type TEXT;
  task_title TEXT;
  task_body TEXT;
  assignee_name TEXT;
  -- REPLACE THIS WITH YOUR ACTUAL SERVICE ROLE KEY
  service_role_key TEXT := 'YOUR_SERVICE_ROLE_KEY_HERE'; 
  -- Your Project ID
  function_url TEXT := 'https://pjnsesvcgjtrspxhhrvn.supabase.co/functions/v1/send-notification';
BEGIN
  -- Use the text from assigned_to column directly
  assignee_name := COALESCE(NEW.assigned_to, 'Unassigned');

  -- Determine operation type and set payload
  IF (TG_OP = 'INSERT') THEN
    notification_type := 'CREATE';
    task_title := 'New Task Created';
    task_body := 'A new task (' || NEW.title || ') has been created by (' || assignee_name || ') at (' || to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata', 'HH:12:MI AM on DD-MM-YYYY') || ')';
    
    payload := jsonb_build_object(
      'type', notification_type,
      'taskId', NEW.id,
      'title', task_title,
      'body', task_body,
      'unitId', NEW.unit_id
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only notify if status changed
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      notification_type := 'UPDATE';
      task_title := 'Task Status Updated';
      task_body := 'Status of (' || NEW.title || ') has been changed from (' || OLD.status || ') to (' || NEW.status || ') by (' || assignee_name || ') at (' || to_char(NEW.updated_at AT TIME ZONE 'Asia/Kolkata', 'HH:12:MI AM on DD-MM-YYYY') || ')';
      
      payload := jsonb_build_object(
        'type', notification_type,
        'taskId', NEW.id,
        'title', task_title,
        'body', task_body,
        'unitId', NEW.unit_id
      );
    ELSE
      -- If status didn't change, DO NOT send notification
      RETURN NEW;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    notification_type := 'DELETE';
    task_title := 'Task Deleted';
    task_body := 'Task (' || OLD.title || ') has been deleted.';
    payload := jsonb_build_object(
      'type', notification_type,
      'taskId', OLD.id,
      'title', task_title,
      'body', task_body,
      'unitId', OLD.unit_id
    );
  END IF;

  -- Call the Edge Function using net.http_post
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create the SINGLE trigger
CREATE TRIGGER on_task_change
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_changes();
