/*
  # Correction de la migration des cagnottes

  1. Modifications
    - Sauvegarde des montants existants avant suppression
    - Migration des données vers les sous-cagnottes
    - Suppression sécurisée de la colonne amount
    - Mise en place des triggers pour la gestion automatique

  2. Sécurité
    - Vérification de l'existence des données avant migration
    - Gestion des cas où la colonne amount n'existe pas déjà
*/

DO $$
BEGIN
  -- Vérifier si la colonne amount existe encore
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'cagnottes'
    AND column_name = 'amount'
  ) THEN
    -- Sauvegarder les montants existants
    CREATE TEMP TABLE cagnottes_amounts AS
    SELECT id, amount, name FROM cagnottes;

    -- Créer une sous-cagnotte par défaut pour chaque cagnotte qui n'en a pas
    INSERT INTO subcagnottes (cagnotte_id, name, amount)
    SELECT 
      c.id,
      'Principal',
      c.amount
    FROM cagnottes c
    LEFT JOIN subcagnottes s ON s.cagnotte_id = c.id
    WHERE s.id IS NULL;

    -- Supprimer la colonne amount
    ALTER TABLE cagnottes DROP COLUMN amount;
  END IF;
END $$;

-- Créer un trigger pour ajouter une sous-cagnotte par défaut
CREATE OR REPLACE FUNCTION ensure_default_subcagnotte()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subcagnottes (cagnotte_id, name, amount)
  VALUES (NEW.id, 'Principal', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS ensure_default_subcagnotte_trigger ON cagnottes;

-- Créer le trigger
CREATE TRIGGER ensure_default_subcagnotte_trigger
  AFTER INSERT ON cagnottes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_default_subcagnotte();

-- Fonction pour obtenir le montant total d'une cagnotte
CREATE OR REPLACE FUNCTION get_cagnotte_amount(cagnotte_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(amount)
    FROM subcagnottes
    WHERE cagnotte_id = $1
  ), 0);
END;
$$ LANGUAGE plpgsql;