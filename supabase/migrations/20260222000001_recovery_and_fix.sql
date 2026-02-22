-- Recovery Migration: Ensure columns exist and fix RLS recursion

-- 1. Ensure columns exist in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS subname TEXT,
ADD COLUMN IF NOT EXISTS unit_id UUID;

-- 2. Fix infinite recursion in profiles RLS policy
DROP POLICY IF EXISTS "Users can view profiles in their unit" ON public.profiles;

CREATE POLICY "Users can view profiles in their unit" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() 
        OR 
        unit_id = (
            SELECT p.unit_id 
            FROM public.profiles p 
            WHERE p.id = auth.uid()
            LIMIT 1
        )
    );

-- 3. Fix the handle_new_user function to be robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, designation, subname, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'designation',
    NEW.raw_user_meta_data->>'designation', -- Use as subname fallback
    (NEW.raw_user_meta_data->>'unit_id')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    designation = EXCLUDED.designation,
    unit_id = EXCLUDED.unit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
