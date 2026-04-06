-- ============================================================
-- AI Tools Hub — Complete Database Schema
-- Run this in Supabase SQL Editor (one-time setup)
-- ============================================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  plan TEXT DEFAULT 'free',       -- free | pro
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 订阅表（每个 Toolkit 独立订阅）
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  toolkit_slug TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active',   -- active | canceled | past_due
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 工具盒表
CREATE TABLE IF NOT EXISTS toolkits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  stripe_price_id TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 工具表（数据驱动，新增工具只需插入行）
CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toolkit_id UUID REFERENCES toolkits(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tool_type TEXT DEFAULT 'template',  -- template | config | custom
  prompt_file TEXT,                    -- e.g. "jobseeker/resume_optimizer.txt"
  inputs_schema JSONB,                 -- [{name, label, type, placeholder, required}]
  output_format TEXT DEFAULT 'text',  -- text | markdown | json
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Layer 2 工作流配置
CREATE TABLE IF NOT EXISTS tool_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id),
  step_order INTEGER,
  step_name TEXT,
  prompt_template TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 使用记录
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),  -- NULL = 未登录用户
  tool_slug TEXT,
  toolkit_slug TEXT,
  session_id TEXT,
  usage_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO 关键词
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT,
  tool TEXT,
  intent TEXT,                         -- informational | transactional | commercial
  status TEXT DEFAULT 'pending',       -- pending | published
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO 页面
CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  meta_description TEXT,
  content TEXT,
  keyword_id UUID REFERENCES seo_keywords(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 分析事件
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  tool_slug TEXT,
  toolkit_slug TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户反馈
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT,
  feedback_type TEXT,                  -- bug | feature_request | improvement | general
  rating INTEGER,                      -- 1-5
  message TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Voting
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  toolkit TEXT,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',          -- open | planned | in_progress | released
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_id, user_id)
);

-- 推荐系统
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',       -- pending | completed | rewarded
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  reward_type TEXT,                    -- free_month | discount
  reward_value TEXT,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 查询优化索引（Step 3 补充）
-- ============================================================
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS usage_date DATE DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_usage_logs_session_date ON usage_logs(session_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_date ON usage_logs(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_total ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_toolkit ON subscriptions(user_id, toolkit_slug, status);

-- tool_submissions: developer-submitted external AI tools (reviewed by admin)
CREATE TABLE IF NOT EXISTS tool_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  website text NOT NULL,
  description text,
  category text,
  pricing text,
  submitter_email text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
