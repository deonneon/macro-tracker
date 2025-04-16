-- Create the frequently_used_foods table
CREATE TABLE IF NOT EXISTS frequently_used_foods (
  id SERIAL PRIMARY KEY,
  food_id INTEGER NOT NULL,
  food_name TEXT NOT NULL,
  default_serving_size DECIMAL(10, 2) NOT NULL DEFAULT 1,
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_food
    FOREIGN KEY (food_id)
    REFERENCES foods(id)
    ON DELETE CASCADE
);

-- Add index on food_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_frequently_used_foods_food_id ON frequently_used_foods(food_id);

-- Add index on usage_count for sorting by frequency
CREATE INDEX IF NOT EXISTS idx_frequently_used_foods_usage_count ON frequently_used_foods(usage_count);

-- Add index on last_used_date for sorting by recency
CREATE INDEX IF NOT EXISTS idx_frequently_used_foods_last_used_date ON frequently_used_foods(last_used_date);

-- Create a function to increment usage count
CREATE OR REPLACE FUNCTION increment_usage_count(row_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  SELECT usage_count INTO current_count FROM frequently_used_foods WHERE food_id = row_id;
  RETURN current_count + 1;
END;
$$ LANGUAGE plpgsql; 