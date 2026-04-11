-- ============================================================
-- Phase 3 Schema — template_pages only
-- (comparison_pages / alternative_pages 使用现有 seo_comparisons / seo_alternatives 表)
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.template_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  generator_id uuid REFERENCES public.generators(id),
  title text NOT NULL,
  template_content text,
  meta_title text,
  meta_description text,
  keywords text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.template_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read template_pages" ON public.template_pages FOR SELECT USING (true);
CREATE POLICY "Service write template_pages" ON public.template_pages FOR ALL TO service_role USING (true);
