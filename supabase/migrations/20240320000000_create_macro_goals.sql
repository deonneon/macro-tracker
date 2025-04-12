-- Create macro_goals table
CREATE TABLE macro_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    calories INTEGER NOT NULL,
    protein DECIMAL(10,2) NOT NULL,
    carbs DECIMAL(10,2) NOT NULL,
    fat DECIMAL(10,2) NOT NULL,
    user_id UUID NOT NULL,
    CONSTRAINT positive_calories CHECK (calories >= 0),
    CONSTRAINT positive_protein CHECK (protein >= 0),
    CONSTRAINT positive_carbs CHECK (carbs >= 0),
    CONSTRAINT positive_fat CHECK (fat >= 0)
);

-- Create index for faster queries
CREATE INDEX idx_macro_goals_created_at ON macro_goals(created_at);
CREATE INDEX idx_macro_goals_user_id ON macro_goals(user_id);

-- Enable Row Level Security
ALTER TABLE macro_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON macro_goals
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON macro_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for goal owners" ON macro_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for goal owners" ON macro_goals
    FOR DELETE USING (auth.uid() = user_id); 