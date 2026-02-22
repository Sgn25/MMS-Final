-- Final Feature Completion & Recovery SQL
-- This script ensures all columns exist and fixes the RLS recursion

-- 1. Ensure columns exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS subname TEXT,
ADD COLUMN IF NOT EXISTS unit_id UUID,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Create a non-recursive RLS policy for profiles
-- Drop ALL existing select policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their unit" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create simple policies
-- Rule 1: Anyone authenticated can view profiles (simplest way to avoid recursion)
-- If privacy is a concern, we can restrict, but recursion usually happens when policy A queries the same table A.
CREATE POLICY "Allow authenticated Select" ON public.profiles
    FOR SELECT TO authenticated USING (true);

-- Rule 2: Users can only update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Rule 3: Allow insert during signup (handled by trigger usually, but for safetey)
DROP POLICY IF EXISTS "Allow insert for own profile" ON public.profiles;
CREATE POLICY "Allow insert for own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- 3. Update the handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, designation, subname, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'designation',
    NEW.raw_user_meta_data->>'designation',
    (NEW.raw_user_meta_data->>'unit_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    unit_id = EXCLUDED.unit_id,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
