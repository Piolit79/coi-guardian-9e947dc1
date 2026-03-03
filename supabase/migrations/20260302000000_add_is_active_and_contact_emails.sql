-- Add is_active flag and contact emails to subcontractor_cois
ALTER TABLE public.subcontractor_cois
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_email1 TEXT,
  ADD COLUMN IF NOT EXISTS contact_email2 TEXT;
