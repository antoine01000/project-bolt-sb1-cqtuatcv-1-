/*
  # Correction du schéma des cagnottes

  1. Modifications
    - Ajout de la colonne amount temporaire si elle n'existe pas
    - Migration sécurisée des données
    - Mise à jour des triggers

  2. Sécurité
    - Vérification de l'existence des colonnes
    - Gestion des cas d'erreur
*/

-- Ajouter la colonne amount temporairement si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cagnottes'
    AND column_name = 'amount'
  ) THEN
    ALTER TABLE cagnottes ADD COLUMN amount numeric DEFAULT 0;
  END IF;
END $$;

-- Créer une sous-cagnotte par défaut pour chaque cagnotte qui n'en a pas
INSERT INTO subcagnottes (cagnotte_id, name, amount)
SELECT 
  c.id,
  'Principal',
  COALESCE(c.amount, 0)
FROM cagnottes c
LEFT JOIN subcagnottes s ON s.cagnotte_id = c.id
WHERE s.id IS NULL;

-- Supprimer la colonne amount
ALTER TABLE cagnottes DROP COLUMN IF EXISTS amount;

-- Recréer les fonctions et triggers
CREATE OR REPLACE FUNCTION ensure_default_subcagnotte()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subcagnottes (cagnotte_id, name, amount)
  VALUES (NEW.id, 'Principal', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_default_subcagnotte_trigger ON cagnottes;

CREATE TRIGGER ensure_default_subcagnotte_trigger
  AFTER INSERT ON cagnottes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_default_subcagnotte();

-- Mettre à jour la fonction de calcul du montant total
CREATE OR REPLACE FUNCTION calculate_cagnotte_total()
RETURNS TRIGGER AS $$
BEGIN
  -- La fonction est vide car nous n'avons plus besoin de mettre à jour
  -- le montant total dans la table cagnottes
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS update_cagnotte_amount_trigger ON subcagnottes;