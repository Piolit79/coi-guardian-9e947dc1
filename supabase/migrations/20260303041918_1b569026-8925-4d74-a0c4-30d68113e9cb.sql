ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS reminder_subject TEXT,
  ADD COLUMN IF NOT EXISTS reminder_body TEXT;