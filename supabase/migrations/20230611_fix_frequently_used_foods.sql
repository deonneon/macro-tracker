-- Check if the table already exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'frequently_used_foods') THEN
    -- Drop existing foreign key constraint if it exists
    ALTER TABLE frequently_used_foods DROP CONSTRAINT IF EXISTS frequently_used_foods_food_id_fkey;
    
    -- Add the correctly named foreign key constraint
    ALTER TABLE frequently_used_foods
      ADD CONSTRAINT fk_food
      FOREIGN KEY (food_id)
      REFERENCES foods(id)
      ON DELETE CASCADE;
  END IF;
END
$$; 