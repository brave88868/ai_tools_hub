-- ============================================================
-- AI Tools Hub — Initial Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ── 5个 Toolkit ──────────────────────────────────────────────
INSERT INTO toolkits (slug, name, description, price_monthly, icon, sort_order) VALUES
('jobseeker',  'Jobseeker Toolkit',  'AI tools to optimize resumes, cover letters, and interview prep',     9,  '💼', 1),
('creator',    'Creator Toolkit',    'AI tools for YouTube, blog, podcast, and social media creators',       9,  '🎬', 2),
('marketing',  'Marketing Toolkit',  'AI tools for copywriting, ads, emails, and brand messaging',           9,  '📣', 3),
('business',   'Business Toolkit',   'AI tools for proposals, plans, emails, and business documents',        12, '🏢', 4),
('legal',      'Legal Toolkit',      'AI tools to analyze contracts and generate legal document templates',  19, '⚖️', 5)
ON CONFLICT (slug) DO NOTHING;

-- ── Jobseeker Toolkit 工具（10个）────────────────────────────
INSERT INTO tools (toolkit_id, slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
SELECT t.id, v.slug, v.name, v.description, v.tool_type, v.prompt_file, v.inputs_schema::jsonb, v.output_format, v.sort_order
FROM toolkits t,
(VALUES
  ('resume-optimizer', 'Resume Optimizer', 'Optimize your resume for a specific job description', 'template',
   'jobseeker/resume_optimizer.txt',
   '[{"name":"resume","label":"Your Resume","type":"textarea","placeholder":"Paste your resume here...","required":true},{"name":"job_description","label":"Job Description","type":"textarea","placeholder":"Paste the job description here...","required":true}]',
   'markdown', 1),

  ('ats-resume-checker', 'ATS Resume Checker', 'Check if your resume passes ATS screening systems', 'template',
   'jobseeker/ats_resume_checker.txt',
   '[{"name":"resume","label":"Your Resume","type":"textarea","placeholder":"Paste your resume here...","required":true},{"name":"job_description","label":"Job Description","type":"textarea","placeholder":"Paste the job description...","required":true}]',
   'markdown', 2),

  ('resume-bullet-generator', 'Resume Bullet Generator', 'Generate powerful, quantified resume bullet points', 'template',
   'jobseeker/resume_bullet_generator.txt',
   '[{"name":"job_title","label":"Job Title","type":"text","placeholder":"e.g. Software Engineer","required":true},{"name":"responsibilities","label":"Your Responsibilities","type":"textarea","placeholder":"Describe what you did in this role...","required":true}]',
   'markdown', 3),

  ('cover-letter-generator', 'Cover Letter Generator', 'Write a compelling, personalized cover letter', 'template',
   'jobseeker/cover_letter.txt',
   '[{"name":"name","label":"Your Name","type":"text","placeholder":"Your full name","required":true},{"name":"job_title","label":"Job Title","type":"text","placeholder":"e.g. Product Manager","required":true},{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. Google","required":true},{"name":"experience","label":"Key Experience","type":"textarea","placeholder":"Briefly describe your most relevant experience...","required":true},{"name":"job_description","label":"Job Description","type":"textarea","placeholder":"Paste the job description...","required":false}]',
   'markdown', 4),

  ('interview-answer-generator', 'Interview Answer Generator', 'Generate structured STAR method interview answers', 'template',
   'jobseeker/interview_answer.txt',
   '[{"name":"question","label":"Interview Question","type":"textarea","placeholder":"e.g. Tell me about a time you led a project under pressure","required":true},{"name":"job_title","label":"Role Applying For","type":"text","placeholder":"e.g. Senior Product Manager","required":true},{"name":"experience","label":"Relevant Experience","type":"textarea","placeholder":"Briefly describe your relevant background...","required":true}]',
   'markdown', 5),

  ('behavioral-interview-coach', 'Behavioral Interview Coach', 'Multi-step coaching for behavioral interview prep', 'config',
   NULL,
   '[{"name":"job_title","label":"Target Role","type":"text","placeholder":"e.g. Marketing Manager","required":true},{"name":"company","label":"Target Company","type":"text","placeholder":"e.g. Amazon","required":true},{"name":"background","label":"Your Background","type":"textarea","placeholder":"Summarize your career background...","required":true}]',
   'markdown', 6),

  ('linkedin-profile-optimizer', 'LinkedIn Profile Optimizer', 'Optimize every section of your LinkedIn profile', 'template',
   'jobseeker/linkedin_profile_optimizer.txt',
   '[{"name":"current_headline","label":"Current Headline","type":"text","placeholder":"e.g. Software Engineer at Startup","required":true},{"name":"current_summary","label":"Current Summary","type":"textarea","placeholder":"Paste your current About section...","required":true},{"name":"target_role","label":"Target Role","type":"text","placeholder":"e.g. Senior Product Manager","required":true}]',
   'markdown', 7),

  ('job-description-analyzer', 'Job Description Analyzer', 'Decode what employers really want from a job posting', 'template',
   'jobseeker/job_description_analyzer.txt',
   '[{"name":"job_description","label":"Job Description","type":"textarea","placeholder":"Paste the full job description here...","required":true}]',
   'markdown', 8),

  ('resume-keyword-scanner', 'Resume Keyword Scanner', 'Find missing keywords that ATS systems look for', 'template',
   'jobseeker/resume_keyword_scanner.txt',
   '[{"name":"resume","label":"Your Resume","type":"textarea","placeholder":"Paste your resume here...","required":true},{"name":"job_description","label":"Job Description","type":"textarea","placeholder":"Paste the job description...","required":true}]',
   'markdown', 9),

  ('salary-negotiation-script', 'Salary Negotiation Script', 'Get a word-for-word salary negotiation script', 'template',
   'jobseeker/salary_negotiation_script.txt',
   '[{"name":"current_offer","label":"Current Offer","type":"text","placeholder":"e.g. $85,000","required":true},{"name":"target_salary","label":"Target Salary","type":"text","placeholder":"e.g. $100,000","required":true},{"name":"job_title","label":"Job Title","type":"text","placeholder":"e.g. Data Analyst","required":true},{"name":"experience_years","label":"Years of Experience","type":"text","placeholder":"e.g. 5","required":true}]',
   'markdown', 10)
) AS v(slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
WHERE t.slug = 'jobseeker'
ON CONFLICT (slug) DO NOTHING;

-- ── Creator Toolkit 工具（10个）──────────────────────────────
INSERT INTO tools (toolkit_id, slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
SELECT t.id, v.slug, v.name, v.description, v.tool_type, v.prompt_file, v.inputs_schema::jsonb, v.output_format, v.sort_order
FROM toolkits t,
(VALUES
  ('youtube-title-generator', 'YouTube Title Generator', 'Generate 10 high-CTR YouTube titles with SEO optimization', 'template',
   'creator/youtube_title.txt',
   '[{"name":"topic","label":"Video Topic","type":"text","placeholder":"e.g. How to make money with AI in 2025","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. beginner entrepreneurs","required":true},{"name":"keyword","label":"Main Keyword","type":"text","placeholder":"e.g. make money with AI","required":true}]',
   'markdown', 1),

  ('youtube-description-gen', 'YouTube Description Generator', 'Write SEO-optimized YouTube video descriptions', 'template',
   'creator/youtube_description.txt',
   '[{"name":"title","label":"Video Title","type":"text","placeholder":"Your video title","required":true},{"name":"topic","label":"Video Topic","type":"textarea","placeholder":"What is this video about?","required":true},{"name":"keywords","label":"Target Keywords","type":"text","placeholder":"e.g. AI tools, productivity, automation","required":true}]',
   'markdown', 2),

  ('youtube-script-generator', 'YouTube Script Generator', 'Full video script with hook, body, and CTA', 'config',
   NULL,
   '[{"name":"title","label":"Video Title","type":"text","placeholder":"Your video title","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. small business owners","required":true},{"name":"key_points","label":"Key Points to Cover","type":"textarea","placeholder":"List the main points you want to cover...","required":true},{"name":"duration","label":"Target Duration (minutes)","type":"text","placeholder":"e.g. 10","required":true}]',
   'markdown', 3),

  ('blog-topic-generator', 'Blog Topic Generator', 'Generate 20 blog topic ideas with SEO potential', 'template',
   'creator/blog_topic_generator.txt',
   '[{"name":"niche","label":"Your Niche","type":"text","placeholder":"e.g. personal finance for millennials","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. 25-35 year olds saving for a house","required":true}]',
   'markdown', 4),

  ('seo-content-generator', 'SEO Content Generator', 'Full SEO blog post with keyword optimization', 'config',
   NULL,
   '[{"name":"keyword","label":"Target Keyword","type":"text","placeholder":"e.g. best productivity apps 2025","required":true},{"name":"topic","label":"Article Topic","type":"text","placeholder":"e.g. Top productivity apps for remote workers","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. remote workers and freelancers","required":true},{"name":"word_count","label":"Target Word Count","type":"text","placeholder":"e.g. 1500","required":true}]',
   'markdown', 5),

  ('article-outline-generator', 'Article Outline Generator', 'Create a detailed, SEO-structured article outline', 'template',
   'creator/article_outline_generator.txt',
   '[{"name":"topic","label":"Article Topic","type":"text","placeholder":"e.g. How to start a podcast in 2025","required":true},{"name":"keyword","label":"Target Keyword","type":"text","placeholder":"e.g. how to start a podcast","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. aspiring podcasters","required":true}]',
   'markdown', 6),

  ('newsletter-writer', 'AI Newsletter Writer', 'Write an engaging email newsletter in minutes', 'template',
   'creator/newsletter_writer.txt',
   '[{"name":"topic","label":"Newsletter Topic","type":"text","placeholder":"e.g. This week in AI tools","required":true},{"name":"audience","label":"Your Audience","type":"text","placeholder":"e.g. marketing professionals","required":true},{"name":"tone","label":"Tone","type":"select","placeholder":"casual","required":true,"options":["casual","professional","inspirational","educational"]}]',
   'markdown', 7),

  ('podcast-script-generator', 'Podcast Script Generator', 'Full podcast episode script with intro, segments, and outro', 'config',
   NULL,
   '[{"name":"episode_topic","label":"Episode Topic","type":"text","placeholder":"e.g. The future of remote work","required":true},{"name":"audience","label":"Your Audience","type":"text","placeholder":"e.g. HR professionals and team managers","required":true},{"name":"duration","label":"Target Duration (minutes)","type":"text","placeholder":"e.g. 20","required":true}]',
   'markdown', 8),

  ('tiktok-caption-generator', 'TikTok Caption Generator', 'Viral TikTok captions with hooks and hashtags', 'template',
   'creator/tiktok_caption_generator.txt',
   '[{"name":"video_topic","label":"Video Topic","type":"text","placeholder":"e.g. morning routine productivity hack","required":true},{"name":"niche","label":"Your Niche","type":"text","placeholder":"e.g. productivity & lifestyle","required":true}]',
   'markdown', 9),

  ('instagram-caption-gen', 'Instagram Caption Generator', 'Engaging Instagram captions with CTAs and hashtags', 'template',
   'creator/instagram_caption_generator.txt',
   '[{"name":"post_topic","label":"Post Topic","type":"text","placeholder":"e.g. behind the scenes of my workspace","required":true},{"name":"brand_tone","label":"Brand Tone","type":"select","placeholder":"casual","required":true,"options":["casual","inspirational","professional","humorous","educational"]}]',
   'markdown', 10)
) AS v(slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
WHERE t.slug = 'creator'
ON CONFLICT (slug) DO NOTHING;

-- ── Marketing Toolkit 工具（10个）────────────────────────────
INSERT INTO tools (toolkit_id, slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
SELECT t.id, v.slug, v.name, v.description, v.tool_type, v.prompt_file, v.inputs_schema::jsonb, v.output_format, v.sort_order
FROM toolkits t,
(VALUES
  ('marketing-copy-generator', 'Marketing Copy Generator', 'High-converting marketing copy for any channel', 'template',
   'marketing/marketing_copy_generator.txt',
   '[{"name":"product","label":"Product / Service","type":"text","placeholder":"e.g. AI writing assistant","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. freelance writers","required":true},{"name":"channel","label":"Marketing Channel","type":"select","placeholder":"website","required":true,"options":["website","email","social media","ads","brochure"]}]',
   'markdown', 1),

  ('sales-email-generator', 'Sales Email Generator', 'Personalized sales emails that get replies', 'template',
   'marketing/sales_email_generator.txt',
   '[{"name":"product","label":"Product / Service","type":"text","placeholder":"e.g. CRM software","required":true},{"name":"prospect_name","label":"Prospect Name","type":"text","placeholder":"e.g. Sarah","required":true},{"name":"prospect_company","label":"Prospect Company","type":"text","placeholder":"e.g. Acme Corp","required":true},{"name":"pain_point","label":"Pain Point to Address","type":"text","placeholder":"e.g. losing deals due to poor follow-up","required":true}]',
   'markdown', 2),

  ('cold-email-generator', 'Cold Email Generator', 'Cold outreach emails with high open and reply rates', 'template',
   'marketing/cold_email_generator.txt',
   '[{"name":"your_offer","label":"Your Offer","type":"text","placeholder":"e.g. free SEO audit","required":true},{"name":"target_industry","label":"Target Industry","type":"text","placeholder":"e.g. e-commerce brands","required":true},{"name":"key_benefit","label":"Key Benefit","type":"text","placeholder":"e.g. 3x more organic traffic in 90 days","required":true}]',
   'markdown', 3),

  ('facebook-ad-copy', 'Facebook Ad Copy Generator', 'Facebook and Instagram ad copy that converts', 'template',
   'marketing/facebook_ad_copy.txt',
   '[{"name":"product","label":"Product / Service","type":"text","placeholder":"e.g. online fitness coaching","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. busy moms who want to lose weight","required":true},{"name":"offer","label":"Offer / CTA","type":"text","placeholder":"e.g. Free 7-day trial","required":true}]',
   'markdown', 4),

  ('google-ads-copy', 'Google Ads Copy Generator', 'Google search ad headlines and descriptions', 'template',
   'marketing/google_ads_copy.txt',
   '[{"name":"product","label":"Product / Service","type":"text","placeholder":"e.g. accounting software","required":true},{"name":"keyword","label":"Target Keyword","type":"text","placeholder":"e.g. small business accounting software","required":true},{"name":"usp","label":"Unique Selling Point","type":"text","placeholder":"e.g. saves 5 hours per week","required":true}]',
   'markdown', 5),

  ('product-description-gen', 'Product Description Generator', 'Compelling product descriptions for e-commerce', 'template',
   'marketing/product_description_generator.txt',
   '[{"name":"product_name","label":"Product Name","type":"text","placeholder":"e.g. Ergonomic Office Chair Pro","required":true},{"name":"features","label":"Key Features","type":"textarea","placeholder":"List the main features...","required":true},{"name":"audience","label":"Target Customer","type":"text","placeholder":"e.g. remote workers with back pain","required":true}]',
   'markdown', 6),

  ('landing-page-copy', 'Landing Page Copy Generator', 'Full landing page copy with hero, benefits, and CTA', 'config',
   NULL,
   '[{"name":"product","label":"Product / Service","type":"text","placeholder":"e.g. project management tool","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. startup founders","required":true},{"name":"main_benefit","label":"Main Benefit","type":"text","placeholder":"e.g. ship projects 2x faster","required":true},{"name":"offer","label":"Offer / CTA","type":"text","placeholder":"e.g. Start free 14-day trial","required":true}]',
   'markdown', 7),

  ('brand-voice-generator', 'Brand Voice Generator', 'Define your brand voice, tone, and messaging guidelines', 'template',
   'marketing/brand_voice_generator.txt',
   '[{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. Notion","required":true},{"name":"industry","label":"Industry","type":"text","placeholder":"e.g. productivity software","required":true},{"name":"target_audience","label":"Target Audience","type":"text","placeholder":"e.g. knowledge workers and teams","required":true},{"name":"personality_words","label":"3 Brand Personality Words","type":"text","placeholder":"e.g. calm, smart, helpful","required":true}]',
   'markdown', 8),

  ('headline-generator', 'Headline Generator', '25 attention-grabbing headlines for any content', 'template',
   'marketing/headline_generator.txt',
   '[{"name":"topic","label":"Content Topic","type":"text","placeholder":"e.g. how to grow your email list","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. online business owners","required":true}]',
   'markdown', 9),

  ('value-proposition-gen', 'Value Proposition Generator', 'Craft a clear, compelling value proposition', 'template',
   'marketing/value_proposition_generator.txt',
   '[{"name":"product","label":"Product / Service","type":"text","placeholder":"e.g. AI customer support tool","required":true},{"name":"customer_problem","label":"Customer Problem","type":"text","placeholder":"e.g. spending 10+ hours a week on repetitive support tickets","required":true},{"name":"key_benefit","label":"Key Benefit","type":"text","placeholder":"e.g. automates 80% of support queries instantly","required":true}]',
   'markdown', 10)
) AS v(slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
WHERE t.slug = 'marketing'
ON CONFLICT (slug) DO NOTHING;

-- ── Business Toolkit 工具（10个）─────────────────────────────
INSERT INTO tools (toolkit_id, slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
SELECT t.id, v.slug, v.name, v.description, v.tool_type, v.prompt_file, v.inputs_schema::jsonb, v.output_format, v.sort_order
FROM toolkits t,
(VALUES
  ('business-proposal-gen', 'Business Proposal Generator', 'Professional business proposals that win clients', 'config',
   NULL,
   '[{"name":"your_company","label":"Your Company","type":"text","placeholder":"e.g. Apex Web Design","required":true},{"name":"client_name","label":"Client Name","type":"text","placeholder":"e.g. TechStart Inc.","required":true},{"name":"project_scope","label":"Project Scope","type":"textarea","placeholder":"Describe the project...","required":true},{"name":"budget","label":"Proposed Budget","type":"text","placeholder":"e.g. $15,000","required":true}]',
   'markdown', 1),

  ('invoice-email-generator', 'Invoice Email Generator', 'Professional invoice and payment reminder emails', 'template',
   'business/invoice_email_generator.txt',
   '[{"name":"client_name","label":"Client Name","type":"text","placeholder":"e.g. John Smith","required":true},{"name":"amount","label":"Invoice Amount","type":"text","placeholder":"e.g. $2,500","required":true},{"name":"due_date","label":"Due Date","type":"text","placeholder":"e.g. January 30, 2025","required":true},{"name":"email_type","label":"Email Type","type":"select","placeholder":"initial","required":true,"options":["initial invoice","friendly reminder","overdue notice"]}]',
   'markdown', 2),

  ('customer-support-reply', 'Customer Support Reply Generator', 'Professional, empathetic customer support responses', 'template',
   'business/customer_support_reply.txt',
   '[{"name":"customer_message","label":"Customer Message","type":"textarea","placeholder":"Paste the customer inquiry or complaint...","required":true},{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. TechCo","required":true},{"name":"resolution","label":"Resolution / Action Taken","type":"textarea","placeholder":"What has been done or will be done?","required":true}]',
   'markdown', 3),

  ('meeting-summary-gen', 'Meeting Summary Generator', 'Structured meeting summaries with action items', 'template',
   'business/meeting_summary_generator.txt',
   '[{"name":"meeting_notes","label":"Raw Meeting Notes","type":"textarea","placeholder":"Paste your messy meeting notes here...","required":true},{"name":"meeting_title","label":"Meeting Title","type":"text","placeholder":"e.g. Q1 Planning Session","required":true}]',
   'markdown', 4),

  ('business-plan-generator', 'Business Plan Generator', 'Comprehensive business plan for startups and SMBs', 'config',
   NULL,
   '[{"name":"business_name","label":"Business Name","type":"text","placeholder":"e.g. GreenLeaf Organics","required":true},{"name":"industry","label":"Industry","type":"text","placeholder":"e.g. organic food delivery","required":true},{"name":"target_market","label":"Target Market","type":"text","placeholder":"e.g. health-conscious urban professionals","required":true},{"name":"unique_value","label":"Unique Value Proposition","type":"text","placeholder":"e.g. farm-to-door delivery within 24 hours","required":true}]',
   'markdown', 5),

  ('swot-analysis-generator', 'SWOT Analysis Generator', 'In-depth SWOT analysis for any business or idea', 'config',
   NULL,
   '[{"name":"business","label":"Business / Product / Idea","type":"text","placeholder":"e.g. a SaaS project management tool for architects","required":true},{"name":"industry","label":"Industry","type":"text","placeholder":"e.g. construction tech","required":true},{"name":"competitors","label":"Main Competitors","type":"text","placeholder":"e.g. Autodesk, Procore","required":true}]',
   'markdown', 6),

  ('company-bio-generator', 'Company Bio Generator', 'Professional company bios for websites and profiles', 'template',
   'business/company_bio_generator.txt',
   '[{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. Apex Solutions","required":true},{"name":"founded","label":"Founded Year","type":"text","placeholder":"e.g. 2019","required":true},{"name":"what_you_do","label":"What You Do","type":"textarea","placeholder":"Describe your products/services and mission...","required":true},{"name":"length","label":"Bio Length","type":"select","placeholder":"medium","required":true,"options":["short (1 paragraph)","medium (2-3 paragraphs)","long (full page)"]}]',
   'markdown', 7),

  ('pitch-deck-outline', 'Pitch Deck Outline Generator', 'Investor-ready pitch deck outline with slide content', 'config',
   NULL,
   '[{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. DataVault AI","required":true},{"name":"problem","label":"Problem You Solve","type":"textarea","placeholder":"What problem does your startup solve?","required":true},{"name":"solution","label":"Your Solution","type":"textarea","placeholder":"How does your product solve it?","required":true},{"name":"traction","label":"Traction / Metrics","type":"text","placeholder":"e.g. $50K MRR, 200 customers, 20% MoM growth","required":false}]',
   'markdown', 8),

  ('client-followup-email', 'Client Follow-up Email Generator', 'Follow-up emails that re-engage prospects and clients', 'template',
   'business/client_followup_email.txt',
   '[{"name":"client_name","label":"Client Name","type":"text","placeholder":"e.g. Sarah Johnson","required":true},{"name":"last_interaction","label":"Last Interaction","type":"text","placeholder":"e.g. proposal sent 2 weeks ago","required":true},{"name":"goal","label":"Goal of Follow-up","type":"text","placeholder":"e.g. schedule a demo call","required":true}]',
   'markdown', 9),

  ('faq-generator', 'FAQ Generator', 'Generate comprehensive FAQs for any product or topic', 'template',
   'business/faq_generator.txt',
   '[{"name":"product_service","label":"Product / Service / Topic","type":"text","placeholder":"e.g. monthly meal prep subscription box","required":true},{"name":"audience","label":"Target Audience","type":"text","placeholder":"e.g. busy families","required":true},{"name":"num_questions","label":"Number of FAQs","type":"text","placeholder":"e.g. 15","required":true}]',
   'markdown', 10)
) AS v(slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
WHERE t.slug = 'business'
ON CONFLICT (slug) DO NOTHING;

-- ── Legal Toolkit 工具（10个）────────────────────────────────
INSERT INTO tools (toolkit_id, slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
SELECT t.id, v.slug, v.name, v.description, v.tool_type, v.prompt_file, v.inputs_schema::jsonb, v.output_format, v.sort_order
FROM toolkits t,
(VALUES
  ('nda-analyzer', 'NDA Analyzer', 'Analyze NDA agreements for risks and missing protections', 'config',
   NULL,
   '[{"name":"nda_text","label":"NDA Text","type":"textarea","placeholder":"Paste the full NDA text here...","required":true},{"name":"your_role","label":"Your Role","type":"select","placeholder":"disclosing_party","required":true,"options":["disclosing party","receiving party","mutual"]}]',
   'markdown', 1),

  ('contract-risk-analyzer', 'Contract Risk Analyzer', 'Identify risky clauses in any business contract', 'config',
   NULL,
   '[{"name":"contract_text","label":"Contract Text","type":"textarea","placeholder":"Paste the contract text here...","required":true}]',
   'markdown', 2),

  ('terms-of-service-gen', 'Terms of Service Generator', 'Generate comprehensive Terms of Service for websites and apps', 'config',
   NULL,
   '[{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. Acme Corp","required":true},{"name":"website_url","label":"Website URL","type":"text","placeholder":"e.g. https://acmecorp.com","required":true},{"name":"service_description","label":"Service Description","type":"textarea","placeholder":"Describe your product or service...","required":true}]',
   'markdown', 3),

  ('privacy-policy-gen', 'Privacy Policy Generator', 'GDPR and CCPA-aware privacy policy for your business', 'config',
   NULL,
   '[{"name":"company_name","label":"Company Name","type":"text","placeholder":"e.g. Acme Corp","required":true},{"name":"website_url","label":"Website URL","type":"text","placeholder":"e.g. https://acmecorp.com","required":true},{"name":"data_collected","label":"Data You Collect","type":"textarea","placeholder":"e.g. email addresses, payment info, usage data...","required":true}]',
   'markdown', 4),

  ('legal-doc-summarizer', 'Legal Document Summarizer', 'Plain-English summary of complex legal documents', 'template',
   'legal/contract_analyzer.txt',
   '[{"name":"contract_text","label":"Legal Document","type":"textarea","placeholder":"Paste the legal document text here...","required":true}]',
   'markdown', 5),

  ('employment-contract-gen', 'Employment Contract Generator', 'Standard employment contract template with key clauses', 'config',
   NULL,
   '[{"name":"employer_name","label":"Employer / Company Name","type":"text","placeholder":"e.g. TechCo Inc.","required":true},{"name":"employee_name","label":"Employee Name","type":"text","placeholder":"e.g. John Smith","required":true},{"name":"job_title","label":"Job Title","type":"text","placeholder":"e.g. Software Engineer","required":true},{"name":"salary","label":"Annual Salary","type":"text","placeholder":"e.g. $90,000","required":true},{"name":"start_date","label":"Start Date","type":"text","placeholder":"e.g. February 1, 2025","required":true}]',
   'markdown', 6),

  ('freelance-agreement-gen', 'Freelance Agreement Generator', 'Protect yourself with a solid freelance contract', 'config',
   NULL,
   '[{"name":"freelancer_name","label":"Freelancer Name","type":"text","placeholder":"e.g. Jane Doe","required":true},{"name":"client_name","label":"Client Name","type":"text","placeholder":"e.g. Acme Corp","required":true},{"name":"project_description","label":"Project Description","type":"textarea","placeholder":"Describe the scope of work...","required":true},{"name":"payment_terms","label":"Payment Terms","type":"text","placeholder":"e.g. $5,000 — 50% upfront, 50% on delivery","required":true}]',
   'markdown', 7),

  ('partnership-agreement-gen', 'Partnership Agreement Generator', 'Business partnership agreement template', 'config',
   NULL,
   '[{"name":"partner1_name","label":"Partner 1 Name","type":"text","placeholder":"e.g. Alice Johnson","required":true},{"name":"partner2_name","label":"Partner 2 Name","type":"text","placeholder":"e.g. Bob Williams","required":true},{"name":"business_name","label":"Business Name","type":"text","placeholder":"e.g. Johnson & Williams LLC","required":true},{"name":"equity_split","label":"Equity Split","type":"text","placeholder":"e.g. 60/40","required":true}]',
   'markdown', 8),

  ('non-compete-agreement-gen', 'Non-Compete Agreement Generator', 'Non-compete and non-solicitation agreement template', 'config',
   NULL,
   '[{"name":"employer_name","label":"Employer Name","type":"text","placeholder":"e.g. TechCorp Inc.","required":true},{"name":"employee_name","label":"Employee Name","type":"text","placeholder":"e.g. John Smith","required":true},{"name":"restriction_period","label":"Restriction Period","type":"text","placeholder":"e.g. 12 months","required":true},{"name":"geographic_area","label":"Geographic Area","type":"text","placeholder":"e.g. United States","required":true}]',
   'markdown', 9),

  ('contract-clause-explainer', 'Contract Clause Explainer', 'Get a plain-English explanation of any contract clause', 'template',
   'legal/contract_clause_explainer.txt',
   '[{"name":"clause_text","label":"Contract Clause","type":"textarea","placeholder":"Paste the specific clause you want explained...","required":true},{"name":"context","label":"Contract Type (optional)","type":"text","placeholder":"e.g. employment agreement, SaaS contract","required":false}]',
   'markdown', 10)
) AS v(slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order)
WHERE t.slug = 'legal'
ON CONFLICT (slug) DO NOTHING;
