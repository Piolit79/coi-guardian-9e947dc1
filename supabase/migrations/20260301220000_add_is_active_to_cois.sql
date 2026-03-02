ALTER TABLE subcontractor_cois
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
