-- 1. Add unit_id and designation to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id),
ADD COLUMN IF NOT EXISTS designation TEXT;

-- 2. Add unit_id to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- 3. Add unit_id to device_tokens
ALTER TABLE public.device_tokens
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id);

-- 4. Update RLS policies for tasks
-- Drop existing broad policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON tasks;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON tasks;

-- Create unit-specific policies
CREATE POLICY "Users can view tasks in their unit" ON tasks
    FOR SELECT TO authenticated
    USING (
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert tasks to their unit" ON tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update tasks in their unit" ON tasks
    FOR UPDATE TO authenticated
    USING (
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    )
    WITH CHECK (
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete tasks in their unit" ON tasks
    FOR DELETE TO authenticated
    USING (
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    );

-- 5. Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can view profiles in their unit" ON profiles
    FOR SELECT TO authenticated
    USING (
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
        OR id = auth.uid()
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 6. Trigger for profile creation (if not already handled)
-- Ensure newly signed up users are assigned a unit handled by auth hook or client-side metadata
