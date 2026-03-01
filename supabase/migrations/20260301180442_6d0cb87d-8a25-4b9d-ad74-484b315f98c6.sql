
-- Global GC settings table for subcontractor agreement & min coverage requirements
CREATE TABLE public.gc_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_file_path text,
  min_gl_coverage_limit text DEFAULT '',
  wc_required boolean NOT NULL DEFAULT true,
  additional_insured_required boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gc_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public access gc_settings" ON public.gc_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_gc_settings_updated_at
  BEFORE UPDATE ON public.gc_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default row
INSERT INTO public.gc_settings (min_gl_coverage_limit, wc_required, additional_insured_required)
VALUES ('1000000', true, true);

-- Add additional_insured column to subcontractor_cois
ALTER TABLE public.subcontractor_cois
  ADD COLUMN additional_insured text NOT NULL DEFAULT 'unknown';
