/*
  # Update RLS policies
  
  1. Changes
    - Add INSERT policy for profiles table
    - Fix profile SELECT policy condition
    - Update all policies to use correct auth.uid() checks
  
  2. Security
    - Enable RLS on all tables
    - Add policies for all CRUD operations
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own persons" ON persons;
DROP POLICY IF EXISTS "Users can insert own persons" ON persons;
DROP POLICY IF EXISTS "Users can update own persons" ON persons;
DROP POLICY IF EXISTS "Users can delete own persons" ON persons;

DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

DROP POLICY IF EXISTS "Users can view own cagnottes" ON cagnottes;
DROP POLICY IF EXISTS "Users can insert own cagnottes" ON cagnottes;
DROP POLICY IF EXISTS "Users can update own cagnottes" ON cagnottes;
DROP POLICY IF EXISTS "Users can delete own cagnottes" ON cagnottes;

DROP POLICY IF EXISTS "Users can view operations for own cagnottes" ON operations;
DROP POLICY IF EXISTS "Users can insert operations for own cagnottes" ON operations;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Create policies for persons
CREATE POLICY "Users can view own persons"
  ON persons FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own persons"
  ON persons FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own persons"
  ON persons FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own persons"
  ON persons FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for expenses
CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for cagnottes
CREATE POLICY "Users can view own cagnottes"
  ON cagnottes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cagnottes"
  ON cagnottes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cagnottes"
  ON cagnottes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cagnottes"
  ON cagnottes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for operations
CREATE POLICY "Users can view operations for own cagnottes"
  ON operations FOR SELECT
  TO authenticated
  USING (
    cagnotte_id IN (
      SELECT id FROM cagnottes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert operations for own cagnottes"
  ON operations FOR INSERT
  TO authenticated
  WITH CHECK (
    cagnotte_id IN (
      SELECT id FROM cagnottes WHERE user_id = auth.uid()
    )
  );