
-- Drop user-scoped policies
DROP POLICY "Users manage own projects" ON public.projects;
DROP POLICY "Users manage own cois" ON public.subcontractor_cois;
DROP POLICY "Users upload own certs" ON storage.objects;
DROP POLICY "Users view own certs" ON storage.objects;
DROP POLICY "Users delete own certs" ON storage.objects;

-- Make user_id nullable (not needed anymore)
ALTER TABLE public.projects ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.subcontractor_cois ALTER COLUMN user_id DROP NOT NULL;

-- Public access policies
CREATE POLICY "Public access projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access cois" ON public.subcontractor_cois FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public upload certs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates');
CREATE POLICY "Public view certs" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
CREATE POLICY "Public delete certs" ON storage.objects FOR DELETE USING (bucket_id = 'certificates');
