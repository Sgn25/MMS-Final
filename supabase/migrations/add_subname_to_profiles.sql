-- 1. Add subname column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subname TEXT;

-- 2. Update profiles for specific users
-- Sarath
UPDATE public.profiles
SET name = 'Sarath', subname = 'Engineer'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'wyd.eng@malabarmilma.coop');

-- Subin
UPDATE public.profiles
SET name = 'Subin DE', subname = 'Engineer'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'wyd.de1.mrcmpu@gmail.com');

-- Febin
UPDATE public.profiles
SET name = 'Febin MT', subname = 'Trainee'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'wyd.de.mrcmpu@gmail.com');

-- Dineesh
UPDATE public.profiles
SET name = 'Dineesh', subname = 'Engineer'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'wyd.tsengg@gmail.com');
