-- Track which expiration reminders have been sent
CREATE TABLE public.coi_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coi_id UUID NOT NULL REFERENCES public.subcontractor_cois(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- '30_day', '15_day', '3_day'
  policy_type TEXT NOT NULL,   -- 'gl' or 'wc'
  expiration_date DATE NOT NULL, -- the expiration date at time of reminder
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coi_id, reminder_type, policy_type, expiration_date)
);

ALTER TABLE public.coi_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access coi_reminders"
  ON public.coi_reminders
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add notification_email to gc_settings so user can set where reminders go
ALTER TABLE public.gc_settings ADD COLUMN IF NOT EXISTS notification_email TEXT;