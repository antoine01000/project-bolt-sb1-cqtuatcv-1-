/*
  # Correction des totaux des cagnottes

  1. Modifications
    - Suppression de la vue matérialisée qui cause des problèmes de permissions
    - Utilisation d'une fonction simple pour calculer les totaux
    - Ajout des permissions nécessaires

  2. Sécurité
    - Fonction avec SECURITY DEFINER pour garantir l'accès aux données
    - Protection contre la suppression de la dernière sous-cagnotte
*/

-- Supprimer la vue matérialisée si elle existe
DROP MATERIALIZED VIEW IF EXISTS cagnotte_totals;

-- Fonction pour calculer le total d'une cagnotte
CREATE OR REPLACE FUNCTION get_cagnotte_total(cagnotte_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE((
    SELECT SUM(amount)
    FROM subcagnottes
    WHERE cagnotte_id = $1
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour empêcher la suppression de la dernière sous-cagnotte
CREATE OR REPLACE FUNCTION prevent_last_subcagnotte_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM subcagnottes
    WHERE cagnotte_id = OLD.cagnotte_id
  ) <= 1 THEN
    RAISE EXCEPTION 'Impossible de supprimer la dernière sous-cagnotte';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS prevent_last_subcagnotte_deletion_trigger ON subcagnottes;

-- Créer le trigger de protection
CREATE TRIGGER prevent_last_subcagnotte_deletion_trigger
  BEFORE DELETE ON subcagnottes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_subcagnotte_deletion();

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_cagnotte_total(uuid) TO authenticated;