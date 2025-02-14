/*
  # Ajout des sous-cagnottes

  1. Nouvelles Tables
    - `subcagnottes`
      - `id` (uuid, primary key)
      - `cagnotte_id` (uuid, foreign key)
      - `name` (text)
      - `amount` (numeric)
      - `created_at` (timestamp)

  2. Sécurité
    - Enable RLS sur `subcagnottes`
    - Ajout des politiques pour les sous-cagnottes
*/

-- Création de la table subcagnottes
CREATE TABLE subcagnottes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id uuid REFERENCES cagnottes ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subcagnottes ENABLE ROW LEVEL SECURITY;

-- Policies pour subcagnottes
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

-- Trigger pour mettre à jour le montant total de la cagnotte
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