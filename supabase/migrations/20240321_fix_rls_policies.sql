-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to update tasks" ON tasks;
DROP POLICY IF EXISTS "Allow authenticated users to delete tasks" ON tasks;

DROP POLICY IF EXISTS "Allow authenticated users to read status history" ON status_history;
DROP POLICY IF EXISTS "Allow authenticated users to insert status history" ON status_history;
DROP POLICY IF EXISTS "Allow authenticated users to delete status history" ON status_history;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks table
CREATE POLICY "Enable read access for authenticated users" ON tasks
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON tasks
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON tasks
    FOR DELETE
    TO authenticated
    USING (true);

-- Enable RLS on status_history table
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Create policies for status_history table
CREATE POLICY "Enable read access for authenticated users" ON status_history
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON status_history
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" ON status_history
    FOR DELETE
    TO authenticated
    USING (true); 