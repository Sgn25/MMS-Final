-- Create units table
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read units
CREATE POLICY "Allow authenticated users to read units" ON public.units
    FOR SELECT TO authenticated USING (true);

-- Insert initial units
INSERT INTO public.units (name, location)
VALUES 
    ('Wayanad Dairy', 'Kalpetta'),
    ('Kasaragod Dairy', 'Kanhangad'),
    ('Kannur Dairy', 'Kannur'),
    ('Pattom Dairy', 'Trivandrum')
ON CONFLICT (name) DO NOTHING;
