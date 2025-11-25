-- Fix duplicate notifications by ensuring only one trigger exists

-- 1. List all triggers BEFORE cleanup (for debugging)
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE '=== TRIGGERS BEFORE CLEANUP ===';
  FOR trigger_record IN 
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.tasks'::regclass
      AND tgname NOT LIKE 'pg_%'
      AND tgname NOT LIKE 'RI_%'
  LOOP
    RAISE NOTICE 'Found trigger: %', trigger_record.tgname;
  END LOOP;
END $$;

-- 2. Drop ALL triggers using dynamic SQL to ensure we get everything
DO $$
DECLARE
  trigger_name TEXT;
BEGIN
  FOR trigger_name IN 
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.tasks'::regclass
      AND tgname NOT LIKE 'pg_%'
      AND tgname NOT LIKE 'RI_%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.tasks CASCADE', trigger_name);
    RAISE NOTICE 'Dropped trigger: %', trigger_name;
  END LOOP;
END $$;

-- 3. Wait a moment to ensure all connections process the DROP
SELECT pg_sleep(1);

-- 4. Re-create the SINGLE trigger (this should be the ONLY trigger)
CREATE TRIGGER on_task_change
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.handle_task_changes();

-- 5. Verify only one trigger exists
DO $$
DECLARE
  trigger_count INTEGER;
  trigger_record RECORD;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger 
  WHERE tgrelid = 'public.tasks'::regclass
    AND tgname NOT LIKE 'pg_%'
    AND tgname NOT LIKE 'RI_%';
  
  RAISE NOTICE '=== TRIGGERS AFTER CLEANUP ===';
  FOR trigger_record IN 
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.tasks'::regclass
      AND tgname NOT LIKE 'pg_%'
      AND tgname NOT LIKE 'RI_%'
  LOOP
    RAISE NOTICE 'Trigger exists: %', trigger_record.tgname;
  END LOOP;
  
  RAISE NOTICE 'Total triggers: %', trigger_count;
  
  IF trigger_count = 1 THEN
    RAISE NOTICE 'SUCCESS: Exactly 1 trigger exists on tasks table';
  ELSE
    RAISE WARNING 'UNEXPECTED: Found % triggers instead of 1', trigger_count;
  END IF;
END $$;
