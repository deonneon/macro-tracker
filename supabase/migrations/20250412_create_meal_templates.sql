-- Create meal_templates table
CREATE TABLE meal_templates (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    foods_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_meal_templates_name ON meal_templates(name);
CREATE INDEX idx_meal_templates_user_id ON meal_templates(user_id);

-- Set up Row Level Security (RLS)
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON meal_templates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON meal_templates
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON meal_templates
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON meal_templates
    FOR DELETE USING (true);

-- Add a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_meal_templates_updated_at_trigger
BEFORE UPDATE ON meal_templates
FOR EACH ROW
EXECUTE FUNCTION update_meal_templates_updated_at(); 