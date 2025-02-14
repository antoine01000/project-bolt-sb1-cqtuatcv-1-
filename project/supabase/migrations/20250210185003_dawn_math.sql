/*
  # Simplification du schéma des cagnottes

  1. Modifications
    - Suppression de la table `subcagnottes`
    - Simplification de la table `cagnottes`
    - Mise à jour des triggers et fonctions

  2. Changements
    - Suppression des colonnes `description` et `target_amount` de la table `cagnottes`
    - Ajout de la colonne `amount` à la table `cagnottes`
    - Mise à jour des politiques de sécurité
*/

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS prevent_last_subcagnotte_deletion_trigger ON subcagnottes;
DROP TRIGGER IF EXISTS update_cagnotte_amount_trigger ON subcagnottes;
DROP TRIGGER IF EXISTS ensure_default_subcagnotte_trigger ON cagnottes;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS prevent_last_subcagnotte_deletion();
DROP FUNCTION IF EXISTS update_subcagnotte_amount();
DROP FUNCTION IF EXISTS ensure_default_subcagnotte();
DROP FUNCTION IF EXISTS get_cagnotte_total(uuid);
DROP FUNCTION IF EXISTS calculate_cagnotte_total();

-- Sauvegarder les montants des cagnottes
CREATE TEMP TABLE temp_cagnotte_amounts AS
SELECT c.id, COALESCE(SUM(s.amount), 0) as total_amount
FROM cagnottes c
LEFT JOIN subcagnottes s ON s.cagnotte_id = c.id
GROUP BY c.id;

-- Ajouter la colonne amount à la table cagnottes
ALTER TABLE cagnottes 
ADD COLUMN IF NOT EXISTS amount numeric DEFAULT 0,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS target_amount;

-- Mettre à jour les montants des cagnottes
UPDATE cagnottes c
SET amount = t.total_amount
FROM temp_cagnotte_amounts t
WHERE c.id = t.id;

-- Supprimer la table subcagnottes
DROP TABLE IF EXISTS subcagnottes;

-- Mettre à jour les politiques
DROP POLICY IF EXISTS "Users can view own cagnottes" ON cagnottes;
DROP POLICY IF EXISTS "Users can insert own cagnottes" ON cagnottes;
DROP POLICY IF EXISTS "Users can update own cagnottes" ON cagnottes;
DROP POLICY IF EXISTS "Users can delete own cagnottes" ON cagnottes;

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