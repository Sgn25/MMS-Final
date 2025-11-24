-- Update name for Febin
UPDATE public.profiles
SET name = 'Febin MT'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'wyd.de.mrcmpu@gmail.com');

-- Update name for Subin
UPDATE public.profiles
SET name = 'Subin DE'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'wyd.de1.mrcmpu@gmail.com');
