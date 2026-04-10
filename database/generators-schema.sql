-- ============================================================
-- Phase 2 SEO Pages Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- AI Generators 表（对应 /ai-generators/[slug] 页面）
CREATE TABLE IF NOT EXISTS public.generators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  category text,
  keywords text,
  tool_slug text,
  meta_title text,
  meta_description text,
  content text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Use Case Pages 表（对应 /use-cases/[slug] 页面，generator-persona 维度）
CREATE TABLE IF NOT EXISTS public.use_case_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  generator_slug text REFERENCES public.generators(slug),
  title text NOT NULL,
  persona text,
  meta_title text,
  meta_description text,
  content text,
  keywords text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Prompt Pages 表（对应 /ai-prompts/[slug] 页面）
CREATE TABLE IF NOT EXISTS public.prompt_pages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  generator_slug text REFERENCES public.generators(slug),
  title text NOT NULL,
  prompt_text text,
  example_output text,
  meta_title text,
  meta_description text,
  keywords text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.use_case_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_pages ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read generators" ON public.generators FOR SELECT USING (true);
CREATE POLICY "Public read use_case_pages" ON public.use_case_pages FOR SELECT USING (true);
CREATE POLICY "Public read prompt_pages" ON public.prompt_pages FOR SELECT USING (true);

-- Service role write policies
CREATE POLICY "Service write generators" ON public.generators FOR ALL USING (true);
CREATE POLICY "Service write use_case_pages" ON public.use_case_pages FOR ALL USING (true);
CREATE POLICY "Service write prompt_pages" ON public.prompt_pages FOR ALL USING (true);

-- ============================================================
-- Seed: 20 AI Generators
-- ============================================================
INSERT INTO public.generators (slug, title, description, category, keywords, tool_slug, meta_title, meta_description) VALUES
  ('resume',              'AI Resume Generator',              'Create a professional resume in minutes with AI',             'career',    'ai resume generator, resume builder, resume maker',                          'resume-optimizer',                   'AI Resume Generator — Free Online | AI Tools Station',              'Generate a professional resume instantly with AI. Free, no signup required. Used by 100,000+ job seekers.'),
  ('cover-letter',        'AI Cover Letter Generator',        'Write a tailored cover letter for any job in seconds',       'career',    'ai cover letter generator, cover letter writer, cover letter maker',          'cover-letter-generator',             'AI Cover Letter Generator — Free | AI Tools Station',               'Generate a personalized cover letter in seconds. AI-powered, free to use. No signup required.'),
  ('business-plan',       'AI Business Plan Generator',       'Create a complete business plan with AI assistance',         'business',  'ai business plan generator, business plan writer, startup plan',              'business-plan-generator',            'AI Business Plan Generator — Free | AI Tools Station',              'Create a professional business plan with AI. Free to start. Used by entrepreneurs worldwide.'),
  ('blog-post',           'AI Blog Post Generator',           'Generate SEO-optimized blog posts on any topic',             'content',   'ai blog post generator, blog writer, content generator',                     'seo-blog-post-generator',            'AI Blog Post Generator — Free | AI Tools Station',                  'Generate a complete SEO blog post in seconds. AI-powered writing tool, free to use.'),
  ('social-media',        'AI Social Media Post Generator',   'Create engaging posts for LinkedIn, Twitter, Instagram',     'marketing', 'ai social media generator, social media post writer, caption generator',      'linkedin-post-generator',            'AI Social Media Post Generator — Free | AI Tools Station',          'Generate engaging social media posts for any platform. AI-powered, free to use.'),
  ('email',               'AI Email Generator',               'Write professional emails in seconds with AI',               'business',  'ai email generator, email writer, professional email',                        'professional-email-generator',       'AI Email Generator — Free Professional Emails | AI Tools Station',  'Write professional emails in seconds with AI. Free, no signup. Copy-paste ready.'),
  ('product-description', 'AI Product Description Generator', 'Create compelling product descriptions that convert',        'marketing', 'ai product description generator, product copy, ecommerce copywriting',       'product-description-generator',      'AI Product Description Generator — Free | AI Tools Station',        'Generate compelling product descriptions with AI. Increase conversions. Free to use.'),
  ('job-description',     'AI Job Description Generator',     'Write clear, compelling job postings with AI',               'hr',        'ai job description generator, job posting writer, recruitment',               'job-description-generator',          'AI Job Description Generator — Free | AI Tools Station',            'Create professional job descriptions with AI. Attract top talent. Free, no signup.'),
  ('linkedin-profile',    'AI LinkedIn Profile Generator',    'Optimize your LinkedIn profile with AI for maximum impact',  'career',    'ai linkedin profile generator, linkedin optimizer, linkedin bio generator',    'linkedin-profile-optimizer',         'AI LinkedIn Profile Generator — Free | AI Tools Station',           'Optimize your LinkedIn profile with AI. Stand out to recruiters. Free to use.'),
  ('marketing-copy',      'AI Marketing Copy Generator',      'Write high-converting ad copy, landing pages, and CTAs',     'marketing', 'ai marketing copy generator, copywriting ai, ad copy generator',              'social-media-ad-copy-generator',     'AI Marketing Copy Generator — Free | AI Tools Station',             'Generate high-converting marketing copy with AI. Ads, landing pages, CTAs. Free.'),
  ('proposal',            'AI Proposal Generator',            'Create professional business proposals in minutes',          'business',  'ai proposal generator, business proposal writer, proposal template',          'business-proposal-generator',        'AI Proposal Generator — Free Business Proposals | AI Tools Station','Generate professional proposals with AI. Win more clients. Free to use.'),
  ('press-release',       'AI Press Release Generator',       'Write newsworthy press releases with AI',                    'content',   'ai press release generator, press release writer, pr generator',              'press-release-generator',            'AI Press Release Generator — Free | AI Tools Station',              'Generate professional press releases with AI. Get media coverage. Free.'),
  ('seo-meta',            'AI SEO Meta Tag Generator',        'Generate optimized title tags and meta descriptions',        'seo',       'ai meta tag generator, seo title generator, meta description generator',       'meta-title-description-optimizer',   'AI SEO Meta Tag Generator — Free | AI Tools Station',               'Generate SEO-optimized meta tags with AI. Improve click-through rates. Free.'),
  ('meeting-notes',       'AI Meeting Notes Generator',       'Transform meeting recordings into structured notes',         'productivity','ai meeting notes generator, meeting summary, meeting minutes ai',            'meeting-notes-optimizer',            'AI Meeting Notes Generator — Free | AI Tools Station',              'Convert meeting recordings to structured notes with AI. Save hours every week. Free.'),
  ('study-guide',         'AI Study Guide Generator',         'Create comprehensive study guides and summaries with AI',    'education', 'ai study guide generator, study notes generator, learning ai',                'study-guide-generator',              'AI Study Guide Generator — Free | AI Tools Station',                'Generate comprehensive study guides with AI. Learn faster. Free to use.'),
  ('cold-email',          'AI Cold Email Generator',          'Write cold emails that get replies with AI',                 'sales',     'ai cold email generator, cold outreach generator, sales email ai',            'cold-email-generator',               'AI Cold Email Generator — Free | AI Tools Station',                 'Write cold emails that get replies with AI. Boost response rates. Free.'),
  ('youtube-script',      'AI YouTube Script Generator',      'Create engaging YouTube video scripts with AI',              'content',   'ai youtube script generator, video script writer, youtube content ai',        'youtube-script-generator',           'AI YouTube Script Generator — Free | AI Tools Station',             'Generate engaging YouTube scripts with AI. Grow your channel. Free to use.'),
  ('presentation',        'AI Presentation Generator',        'Create compelling presentation outlines and slides with AI', 'business',  'ai presentation generator, slide generator, powerpoint ai, pitch deck ai',    'presentation-outline-generator',     'AI Presentation Generator — Free | AI Tools Station',               'Generate professional presentations with AI. Impress your audience. Free.'),
  ('contract',            'AI Contract Generator',            'Draft professional contracts and legal documents with AI',   'legal',     'ai contract generator, contract writer, legal document generator',            'contract-analyzer',                  'AI Contract Generator — Free | AI Tools Station',                   'Generate professional contracts with AI. Disclaimer: Not legal advice. Free.'),
  ('interview-questions', 'AI Interview Questions Generator', 'Generate targeted interview questions for any role',         'hr',        'ai interview questions generator, interview prep ai, hiring questions',        'interview-question-generator',       'AI Interview Questions Generator — Free | AI Tools Station',        'Generate targeted interview questions with AI. Hire the right people. Free.')
ON CONFLICT (slug) DO NOTHING;
