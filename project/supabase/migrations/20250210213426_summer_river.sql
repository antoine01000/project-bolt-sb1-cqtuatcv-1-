/*
  # Correction de la structure de la table des opérations

  1. Modifications
    - Ajout de la colonne subcagnotte_id
    - Suppression de la colonne cagnotte_id
    - Mise à jour des politiques de sécurité

  2. Sécurité
    - Mise à jour des politiques RLS pour utiliser subcagnotte_id
*/

-- Sauvegarder les données existantes
CREATE TEMP TABLE temp_operations AS
SELECT * FROM operations;

-- Supprimer les politiques existantes
DROP POLICY IF EXISTS "Users can view operations for own cagnottes" ON operations;
DROP POLICY IF EXISTS "Users can insert operations for own cagnottes" ON operations;

-- Modifier la structure de la table
ALTER TABLE operations 
DROP COLUMN IF EXISTS cagnotte_id,
ADD COLUMN IF NOT EXISTS subcagnotte_id uuid REFERENCES subcagnottes ON DELETE CASCADE;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view operations for own subcagnottes"
  ON operations FOR SELECT
  TO authenticated
  USING (
    subcagnotte_id IN (
      SELECT s.id 
      FROM subcagnottes s
      JOIN cagnottes c ON s.cagnotte_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert operations for own subcagnottes"
  ON operations FOR INSERT
  TO authenticated
  WITH CHECK (
    subcagnotte_id IN (
      SELECT s.id 
      FROM subcagnottes s
      JOIN cagnottes c ON s.cagnotte_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );