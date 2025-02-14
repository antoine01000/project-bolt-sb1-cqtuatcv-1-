/*
  # Mise à jour des politiques de sécurité pour les opérations

  1. Sécurité
    - Mise à jour des politiques RLS pour la table operations
    - Ajout de politiques pour la visualisation et l'insertion des opérations
*/

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view operations for own cagnottes" ON operations;
DROP POLICY IF EXISTS "Users can insert operations for own cagnottes" ON operations;

-- Créer les nouvelles politiques
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