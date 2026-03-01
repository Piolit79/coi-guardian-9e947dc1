
-- Add coverage limit fields (occurrence + aggregate), umbrella, certificate holder, description
ALTER TABLE public.subcontractor_cois
  ADD COLUMN IF NOT EXISTS gl_per_occurrence_limit text,
  ADD COLUMN IF NOT EXISTS gl_aggregate_limit text,
  ADD COLUMN IF NOT EXISTS umbrella_policy_number text,
  ADD COLUMN IF NOT EXISTS umbrella_carrier text,
  ADD COLUMN IF NOT EXISTS umbrella_limit text,
  ADD COLUMN IF NOT EXISTS umbrella_effective_date date,
  ADD COLUMN IF NOT EXISTS umbrella_expiration_date date,
  ADD COLUMN IF NOT EXISTS certificate_holder text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS description_of_operations text;

-- Add GC identity fields to gc_settings for verification
ALTER TABLE public.gc_settings
  ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'SLAB Builders',
  ADD COLUMN IF NOT EXISTS property_address text,
  ADD COLUMN IF NOT EXISTS owner_info text;
