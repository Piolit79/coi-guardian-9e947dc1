
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  client TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on-hold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create subcontractor_cois table
CREATE TABLE public.subcontractor_cois (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  subcontractor TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  -- GL Policy
  gl_policy_number TEXT,
  gl_carrier TEXT,
  gl_effective_date DATE,
  gl_expiration_date DATE,
  gl_coverage_limit TEXT,
  -- GL Provisions
  labor_law_coverage TEXT NOT NULL DEFAULT 'unknown' CHECK (labor_law_coverage IN ('included', 'excluded', 'unknown')),
  action_over TEXT NOT NULL DEFAULT 'unknown' CHECK (action_over IN ('included', 'excluded', 'unknown')),
  hammer_clause TEXT NOT NULL DEFAULT 'unknown' CHECK (hammer_clause IN ('included', 'excluded', 'unknown')),
  -- WC Policy
  wc_policy_number TEXT,
  wc_carrier TEXT,
  wc_effective_date DATE,
  wc_expiration_date DATE,
  -- File paths
  coi_file_path TEXT,
  gl_policy_file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subcontractor_cois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own cois" ON public.subcontractor_cois FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cois_updated_at BEFORE UPDATE ON public.subcontractor_cois FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

CREATE POLICY "Users upload own certs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users view own certs" ON storage.objects FOR SELECT USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own certs" ON storage.objects FOR DELETE USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
