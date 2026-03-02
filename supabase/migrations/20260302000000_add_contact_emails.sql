ALTER TABLE subcontractor_cois
ADD COLUMN IF NOT EXISTS contact_email_1 TEXT,
ADD COLUMN IF NOT EXISTS contact_email_2 TEXT;
