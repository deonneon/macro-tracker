-- Create an RPC function to create the frequently_used_foods table
CREATE OR REPLACE FUNCTION create_frequently_used_foods_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'frequently_used_foods') THEN
    -- Create the table
    CREATE TABLE frequently_used_foods (
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

    -- Add indexes
    CREATE INDEX idx_frequently_used_foods_food_id ON frequently_used_foods(food_id);
    CREATE INDEX idx_frequently_used_foods_usage_count ON frequently_used_foods(usage_count);
    CREATE INDEX idx_frequently_used_foods_last_used_date ON frequently_used_foods(last_used_date);
    
    -- Create the increment_usage_count function
    CREATE OR REPLACE FUNCTION increment_usage_count(row_id INTEGER)
    RETURNS INTEGER AS $inc_func$
    DECLARE
      current_count INTEGER;
    BEGIN
      SELECT usage_count INTO current_count FROM frequently_used_foods WHERE food_id = row_id;
      RETURN current_count + 1;
    END;
    $inc_func$ LANGUAGE plpgsql;
    
    RETURN TRUE;
  ELSE
    -- Table already exists - check if the constraint needs updating
    IF NOT EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE constraint_name = 'fk_food'
      AND table_name = 'frequently_used_foods'
    ) THEN
      -- Drop existing foreign key if any
      ALTER TABLE frequently_used_foods DROP CONSTRAINT IF EXISTS frequently_used_foods_food_id_fkey;
      
      -- Add correctly named constraint
      ALTER TABLE frequently_used_foods
        ADD CONSTRAINT fk_food
        FOREIGN KEY (food_id)
        REFERENCES foods(id)
        ON DELETE CASCADE;
    END IF;
    
    RETURN TRUE;
  END IF;
END;
$$; 