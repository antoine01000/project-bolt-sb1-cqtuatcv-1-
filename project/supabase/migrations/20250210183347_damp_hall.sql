/*
  # Mise à jour de la logique des cagnottes

  1. Modifications
    - Suppression de la colonne amount de la table cagnottes (le montant sera calculé)
    - Ajout d'un trigger pour créer une sous-cagnotte par défaut
    - Mise à jour du trigger de calcul du montant total

  2. Données
    - Migration des montants existants vers des sous-cagnottes par défaut
*/

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

-- Supprimer la colonne amount de la table cagnottes
ALTER TABLE cagnottes DROP COLUMN amount;

-- Créer un trigger pour ajouter une sous-cagnotte par défaut
CREATE OR REPLACE FUNCTION ensure_default_subcagnotte()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subcagnottes (cagnotte_id, name, amount)
  VALUES (NEW.id, 'Principal', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_default_subcagnotte_trigger
  AFTER INSERT ON cagnottes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_default_subcagnotte();

-- Mettre à jour le trigger de calcul du montant total
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