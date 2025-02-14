/*
  # Ajout des colonnes manquantes à la table subcagnottes

  1. Modifications
    - Ajout de la colonne `description` (text, nullable)
    - Ajout de la colonne `target_amount` (numeric, default 0)
*/

-- Ajout des colonnes manquantes à la table subcagnottes
ALTER TABLE subcagnottes 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS target_amount numeric DEFAULT 0;