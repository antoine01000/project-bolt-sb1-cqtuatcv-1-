/*
  # Gestion des totaux des cagnottes et protection des sous-cagnottes

  1. Modifications
    - Création d'une fonction pour calculer le total d'une cagnotte
    - Ajout d'une protection pour la dernière sous-cagnotte
    - Utilisation d'une fonction au lieu d'une vue matérialisée

  2. Sécurité
    - Les fonctions sont accessibles uniquement aux utilisateurs authentifiés
    - Protection contre la suppression de la dernière sous-cagnotte
*/

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

-- Fonction pour mettre à jour le montant total d'une cagnotte
CREATE OR REPLACE FUNCTION update_subcagnotte_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- La fonction est vide car nous calculons maintenant le total à la demande
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS update_cagnotte_amount_trigger ON subcagnottes;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_cagnotte_total(uuid) TO authenticated;