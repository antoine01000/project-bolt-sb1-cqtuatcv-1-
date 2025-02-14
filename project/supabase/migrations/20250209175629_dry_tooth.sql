/*
  # Add order field to categories table

  1. Changes
    - Add `order` column to categories table with default value
    - Update existing categories to set order based on name
    - Add index on order column for better performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add order column
ALTER TABLE categories ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;

-- Create index for order column
CREATE INDEX IF NOT EXISTS categories_order_idx ON categories ("order");

-- Update existing categories with order based on name
DO $$
DECLARE
  user_record RECORD;
  category_record RECORD;
  current_order integer;
BEGIN
  FOR user_record IN SELECT DISTINCT user_id FROM categories LOOP
    current_order := 0;
    FOR category_record IN 
      SELECT id 
      FROM categories 
      WHERE user_id = user_record.user_id 
      ORDER BY name
    LOOP
      UPDATE categories 
      SET "order" = current_order 
      WHERE id = category_record.id;
      current_order := current_order + 1;
    END LOOP;
  END LOOP;
END $$;