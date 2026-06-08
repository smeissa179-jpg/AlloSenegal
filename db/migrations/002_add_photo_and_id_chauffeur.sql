-- Migration: add photo_url and id_chauffeur to Véhicule
-- Created: 2026-06-02

ALTER TABLE IF EXISTS public."Véhicule"
  ADD COLUMN IF NOT EXISTS photo_url character varying NULL,
  ADD COLUMN IF NOT EXISTS id_chauffeur uuid NULL;

-- Optionally add a foreign key to profiles(id) if profiles.id is uuid
-- ALTER TABLE public."Véhicule"
--   ADD CONSTRAINT fk_vehicule_chauffeur FOREIGN KEY (id_chauffeur) REFERENCES public.profiles(id);
