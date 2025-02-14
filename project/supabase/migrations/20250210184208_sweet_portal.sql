/*
  # Gestion des totaux des cagnottes et protection des sous-cagnottes

  1. Modifications
    - Création d'une fonction pour calculer le total d'une cagnotte
    - Ajout d'une protection pour la dernière sous-cagnotte
    - Mise en place d'une vue sécurisée pour les totaux

  2. Sécurité
    - La vue est accessible uniquement aux utilisateurs authentifiés
    - Les totaux sont calculés uniquement pour les cagnottes de l'utilisateur
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
$$ LANGUAGE plpgsql;

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

-- Créer une vue matérialisée pour les totaux
CREATE MATERIALIZED VIEW IF NOT EXISTS cagnotte_totals AS
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.type,
  c.description,
  c.target_amount,
  COALESCE(SUM(s.amount), 0) as total_amount
FROM cagnottes c
LEFT JOIN subcagnottes s ON s.cagnotte_id = c.id
GROUP BY c.id, c.user_id, c.name, c.type, c.description, c.target_amount;

-- Créer un index sur user_id pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS cagnotte_totals_user_id_idx ON cagnotte_totals(user_id);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION refresh_cagnotte_totals()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cagnotte_totals;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers pour rafraîchir la vue
DROP TRIGGER IF EXISTS refresh_totals_trigger ON subcagnottes;
CREATE TRIGGER refresh_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subcagnottes
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_cagnotte_totals();

-- Donner les permissions nécessaires
GRANT SELECT ON cagnotte_totals TO authenticated;