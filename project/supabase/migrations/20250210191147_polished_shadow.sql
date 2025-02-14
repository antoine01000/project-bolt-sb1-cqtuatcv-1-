/*
  # Add subcagnottes support
  
  1. Changes
    - Add description and target_amount to cagnottes table
    - Create subcagnottes table if not exists
    - Add RLS policies for subcagnottes
    - Add trigger for updating cagnotte total amount
*/

-- Add columns to cagnottes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cagnottes' AND column_name = 'description') THEN
    ALTER TABLE cagnottes ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cagnottes' AND column_name = 'target_amount') THEN
    ALTER TABLE cagnottes ADD COLUMN target_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Create subcagnottes table if it doesn't exist
CREATE TABLE IF NOT EXISTS subcagnottes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id uuid REFERENCES cagnottes ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  amount numeric DEFAULT 0,
  target_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
ALTER TABLE subcagnottes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view subcagnottes for own cagnottes" ON subcagnottes;
DROP POLICY IF EXISTS "Users can insert subcagnottes for own cagnottes" ON subcagnottes;
DROP POLICY IF EXISTS "Users can update subcagnottes for own cagnottes" ON subcagnottes;
DROP POLICY IF EXISTS "Users can delete subcagnottes for own cagnottes" ON subcagnottes;

-- Create new policies
CREATE POLICY "Users can view subcagnottes for own cagnottes"
  ON subcagnottes FOR SELECT
  TO authenticated
  USING (
    cagnotte_id IN (
      SELECT id FROM cagnottes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subcagnottes for own cagnottes"
  ON subcagnottes FOR INSERT
  TO authenticated
  WITH CHECK (
    cagnotte_id IN (
      SELECT id FROM cagnottes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subcagnottes for own cagnottes"
  ON subcagnottes FOR UPDATE
  TO authenticated
  USING (
    cagnotte_id IN (
      SELECT id FROM cagnottes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subcagnottes for own cagnottes"
  ON subcagnottes FOR DELETE
  TO authenticated
  USING (
    cagnotte_id IN (
      SELECT id FROM cagnottes WHERE user_id = auth.uid()
    )
  );

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_cagnotte_amount_trigger ON subcagnottes;
DROP FUNCTION IF EXISTS update_cagnotte_amount();

-- Create function and trigger for updating cagnotte amount
CREATE OR REPLACE FUNCTION update_cagnotte_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE cagnottes
    SET amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM subcagnottes
      WHERE cagnotte_id = NEW.cagnotte_id
    )
    WHERE id = NEW.cagnotte_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cagnottes
    SET amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM subcagnottes
      WHERE cagnotte_id = OLD.cagnotte_id
    )
    WHERE id = OLD.cagnotte_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cagnotte_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subcagnottes
  FOR EACH ROW
  EXECUTE FUNCTION update_cagnotte_amount();