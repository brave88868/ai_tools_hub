# PROJECT_CONTEXT.md — 项目进度与上下文

> **每次 Claude Code 会话开始时读取本文件。**
> 每完成一个模块后更新对应状态。

---

## 当前项目状态

**项目阶段**: 🟢 SPEC-SAAS-FACTORY 完成  
**当前里程碑**: 在 /admin/saas 输入关键词生成第一个 SaaS 项目，确认后 Activate；随后可推进 Stripe Live 切换（SPEC-11-C）  
**最后更新**: 2026-04-05 — AI SaaS Factory：saas_projects表 + /saas/* 落地页 + /admin/saas管理页 + cron自动生成

### 已完成修复（Bug Fix Log）

1. **Sign Out 无反应** — `<Link href="/auth/signout">` → `<button onClick>` + `supabase.auth.signOut()`
2. **邮件确认后跳回首页** — 更新 Supabase redirect URL 配置到 `/dashboard`
3. **72个工具 DB 配置错误** — 修复 null inputs_schema + 错误 prompt_file 路径 + config→template 类型
4. **Vercel PDF 上传失败** — pdf-parse v2→v1 + `serverExternalPackages` + `export const runtime = "nodejs"`
5. **下载格式 .txt→.docx** — ResultPanel 使用 `docx` 库 + `Packer.toBlob`
6. **Resume Optimizer 双区显示** — `DOC_TOOL_CONFIG` 模式 + `splitMarker` 分区渲染
7. **NDA/Contract Analyzer 错误归类** — 从 DOC_TOOL_CONFIG 移出，改为标准 ResultPanel（Mode B）
8. **全量 prompt 升级** — 62个工具 prompt 添加 STEP 1 内部分析 + 结构化输出格式
9. **匿名用户限制绕过（SPEC-11-A）** — token无效时正确fallback到匿名分支；IP+UA SHA256 fingerprint替代localStorage session_id；日期上界改为次日00:00:00.000Z
10. **移动端响应式（SPEC-11-B）** — pricing表格overflow-x-auto、工具页py-6 md:py-12、Hero按钮flex-wrap、Free Plan指标flex-wrap、UpgradeModal p-6 sm:p-8、Bundle横幅换行布局
11. **UpgradeModal 分流（SPEC-11）** — 未登录显示注册引导（Sign Up Free），已登录显示订阅流程；匿名限制改为1次/天
12. **Cover Letter Generator 升级（SPEC-12）** — CV上传（PDF/DOCX/TXT）+ 六字段输入 + 五段STAR结构prompt + ATS优化
13. **Cloudflare 源站保护（SPEC-SEC-01）** — 生产环境 `/api/tools/run` 无 `cf-ray` header → 403，阻止机器人绕过 Cloudflare 直打 Vercel 源站
16. **SPEC-10 Task 4–7** — Feedback Modal + API；Feature Voting Board（/features）+ vote/submit API；Referral System（middleware.ts ref cookie + auth callback 写入 referrals + webhook 触发奖励 + Dashboard 推荐区块）；Analytics（page_view 埋点 + /api/analytics/track + /api/admin/analytics）
17. **SPEC-10 Task 8–11** — Operator Dashboard（/operator/* 6页面 + 4个 operator API）；template-engine 支持 inline prompt_template fallback；scripts/discover-tools.mjs；Vercel Cron（/api/cron/daily 每日2点 UTC）+ vercel.json；sitemap.ts 更新（tools + use_cases + blog_posts）；robots.ts 禁止 /api/ /dashboard /auth/ /operator
18. **SPEC-FINAL** — /admin/* 完整 Admin Dashboard（layout 校验 users.role='admin' + 6页面：overview/tools/seo/blog/analytics/feedback）；3 独立 Cron 路由（discover-keywords 2am / generate-tools 3am / generate-blog 4am）；vercel.json 更新为 3 条 cron；Header 加 Features 链接；ReferralBlock 短码 = userId.slice(0,8)；auth/callback 用 UUID prefix range query 查找推荐人；analytics API 补全 totalUsers/todayToolUses/weekToolUses；middleware.ts 保护 /admin；robots.ts disallow /admin
14. **Checkout Invalid toolkit 修复（SPEC-FIX-06）** — `TOOLKIT_PRICE_IDS` 类型改为 `string | undefined`（移除 `!` 断言）；失败时打印完整诊断日志（received slug + 每个 env var 是否已设置）到 Vercel 函数日志
15. **Dashboard 订阅显示修复 + 退订（SPEC-FIX-07）** — 新增 `SubscriptionList` 客户端组件（Cancel 按钮 + window.confirm 确认）；Dashboard 查询新增 `stripe_subscription_id`，status 扩展为 `['active','canceling']`，Plan 字段显示实际 toolkit 名；新建 `POST /api/subscription/cancel`（cancel_at_period_end=true）；新建 `/terms` 和 `/privacy` 占位页面

### 当前技术状态

- 72 active tools（6 toolkits，每个 10 tools，+ 12 额外工具）
- All tools: tool_type=template, inputs_schema 已填充, prompt_file 已验证
- File upload: PDF/DOCX/PPTX/TXT，Vercel nodejs runtime（FileUploadInput → /api/tools/extract-text）
- Download: 所有工具输出 .docx 格式
- Auth: Supabase email + Google OAuth，sign-out 正常
- Billing: Stripe checkout + webhook (price.updated) + Supabase 同步（**仍在 Test 模式**）
- Prompt 质量: 所有工具含 STEP 1 内部分析 + 结构化输出
- Rate limiting: 匿名1次/天（IP+UA fingerprint）/ 登录免费3次/天+30次终身 / 付费/pro角色100次/天 / admin无限制
- 角色系统: users.role = user(默认)/pro(付费，可手动授予)/admin；users.plan = free/pro（set-role API同步）
- Growth Engine: growth_keywords/tool_opportunities 两张新表；tools 表新增 auto_generated/seo_title/seo_description/prompt_template 列；tool_use_cases 表新增
- SEO页面: /tools/[slug]/[usecase] (use-case落地页), /ai-tools-for/[profession] (职业聚合页)
- 内链系统: lib/internal-linking.ts 自动在博客文章注入工具链接
- 增长控制台: /admin/growth（4模块：关键词/机会/自动工具/流量报告）
- Cron 增强: discover-keywords 同时生成 growth_keywords + 发现机会；generate-tools 同时自动创建 score≥80 的工具
- Cover Letter: 6字段（cv_text_file/job_description/name/hiring_manager/company/job_title），Supabase inputs_schema已更新

---

## 模块完成状态

### Phase 1 — MVP 基础架构

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目初始化（Next.js + Supabase + Stripe） | ✅ 完成 | Next.js 15 + TS + Tailwind + 完整目录结构 |
| 数据库 Schema（所有核心表） | ✅ 完成 | database/schema.sql + seed.sql（需在 Supabase 执行）|
| Supabase Auth（Google + Email） | ✅ 完成 | @supabase/ssr + Google OAuth + 邮箱密码 + /auth/callback + /auth/signout |
| 三层 Tool Engine | ✅ 完成 | template / config / custom 引擎全部实现 |
| `/api/tools/run` 主路由 | ✅ 完成 | 权限检查 + 引擎路由 + 日志记录 |
| Prompt 文件系统（/prompts/） | ✅ 完成 | 62个工具 Prompt 文件，含 Legal 合规 Disclaimer |
| 首页 UI | ✅ 完成 | Hero + Popular Tools + Toolkits + How It Works + Pricing CTA |
| Toolkit 页面（/toolkits/[slug]） | ✅ 完成 | 工具列表 + generateMetadata + Legal disclaimer |
| 工具页面（/tools/[slug]） | ✅ 完成 | InputForm + ResultPanel + UpgradeModal |
| 用户权限系统（1次免费匿名 + 3次/天登录 + 订阅） | ✅ 完成 | IP+UA SHA256 fingerprint + /api/tools/run 统一判断；UpgradeModal 分流 |
| Stripe 订阅（per-toolkit） | ✅ 完成 | Checkout Session + Webhook 自动更新订阅状态 |
| 用户 Dashboard | ✅ 完成 | 订阅状态 + 使用次数 + 快捷链接 |
| Admin 后台 | ⬜ 未开始 | |

### Phase 2 — 5个工具盒内容

| Toolkit | 工具数 | 状态 |
|---------|--------|------|
| Jobseeker Toolkit | 10 tools | ✅ 完成 | Prompt 文件 + DB 数据已就绪 |
| Creator Toolkit | 10 tools | ✅ 完成 | Prompt 文件 + DB 数据已就绪 |
| Marketing Toolkit | 10 tools | ✅ 完成 | Prompt 文件 + DB 数据已就绪 |
| Business Toolkit | 10 tools | ✅ 完成 | Prompt 文件 + DB 数据已就绪 |
| Legal Toolkit | 10 tools | ✅ 完成 | Prompt 文件（合规版）+ DB 数据已就绪 |

### Phase 3 — 增长系统

| 模块 | 状态 | 说明 |
|------|------|------|
| Stripe Live 切换（SPEC-11-C） | 🔲 待手动操作 | Stripe Dashboard + Vercel 环境变量更新 |
| Programmatic SEO 2.0（SPEC-SEO-20） | ✅ 完成 | 5类页面矩阵：/compare/[slug] + /alternatives/[slug] + /problems/[slug] + /workflows/[slug] + /ai-tools-for/[slug]（DB优先）；5张新表；5个grow API；5个scripts；Cron每日自动生成；InternalLinks组件；Sitemap全更新 |
| SEO 关键词数据库（1000+条） | ⬜ 未开始 | |
| Blog 页面（/blog/[slug]） | ✅ 完成 | 列表页 + 详情页 + ReactMarkdown + SEO metadata |
| Referral System（推荐系统） | ✅ 完成 | ref cookie + auth callback + webhook 奖励 + Dashboard ReferralBlock；短码 = user.id.slice(0,8)；anti-abuse（signup_ip + 24h同IP封锁）；/api/referral/stats API；enhanced ReferralBlock client-side fetch；/admin/referrals 管理页 |
| Feedback 模块 | ✅ 完成 | FeedbackModal 完整版 + /api/feedback/submit |
| Feature Voting Board | ✅ 完成 | /features 页 + vote/submit API；排序 Tabs（Most Votes/Newest/Trending）；Admin AI Analyze 按钮（GPT-4o-mini 分析 Top Needs / Pain Points / Suggested Tools）|
| Analytics Dashboard | ✅ 完成 | /api/admin/analytics（totalUsers/todayToolUses/weekToolUses + top10 tools）|
| Admin Dashboard（/admin/*） | ✅ 完成 | 11页面：overview/users/toolkits/tools-manage/tools/seo/blog/analytics/feedback/pricing/revenue；所有 API 改用 Bearer token |
| Product Roadmap（/roadmap） | ✅ 完成 | 服务端组件，4列看板（Planned/In Progress/Released/Open），读 features 表按 status 分组，Header + sitemap 已接入 |
| Revenue Dashboard（/admin/revenue） | ✅ 完成 | MRR / 活跃订阅 / 本月收入 / Top Toolkit KPI 卡片；Toolkit 分布表格；最近 5 笔 subscriptions；Stripe best-effort 活跃数；/api/admin/revenue（Bearer token）|
| Revenue Engine（SPEC-REVENUE-ENGINE） | ✅ 完成 | UpgradeCTA（动态文案+7天抑制）+ EmailCapture（匿名用户线索捕获）+ upgrade-prompt API + leads capture/list API + affiliate/stats（30%佣金）+ pricing-experiment（IP哈希A/B）+ pricing-convert + send-welcome（Resend）+ webhook自动写affiliate_commissions + auth/callback新用户触发欢迎邮件 + tool页/dashboard页 CTA注入 + /admin/revenue完整收入仪表盘重构（6区块）|
| Weekly Insights（SPEC-WEEKLY-INSIGHTS） | ✅ 完成 | weekly_insights表 + lib/insights/generate.ts核心逻辑 + cron每周一 + 手动API + WeeklyInsightsBlock组件 + admin/analytics集成 |
| AI SaaS Factory（SPEC-SAAS-FACTORY） | ✅ 完成 | saas_projects表 + generate-saas/generate-saas-pages API + /saas/[slug]落地页 + /saas列表页 + /admin/saas管理页 + cron Step 8 + sitemap |
| Programmatic SEO Core（SPEC-PROGRAMMATIC-SEO-CORE） | ✅ 完成 | lib/seo-keywords.ts常量库 + /use-cases/[slug]服务端页面 + /use-cases列表页 + 5个/api/seo/generate-*统一API（写seo_pages主表+同步分散表）+ /api/seo/generate批量入口（~22页/次，一年~8000页）+ sitemap 5类新路径 + admin/seo顶部汇总看板+青色生成按钮 |
| SEO Flat Routes（SPEC-SEO-FLAT-ROUTES） | ✅ 完成 | app/[slug]/page.tsx根路径统一分发（-vs-/alternatives/how-to-/ai-for-）+ seo_use_cases表 + 4个生成API + proxy.ts 301重定向 + sitemap 4类扁平路径 + admin/seo 绿色统计+按钮 |
| Google Traffic Capture（SPEC-GROWTH-CAPTURE） | ✅ 完成 | google-autocomplete + extract-paa（GPT-4o-mini）+ expand-keywords + detect-intent + generate-from-intents + ranking-monitor + import-rankings + optimize-content；/admin/growth Section 5 增加7个操作卡片；discover-keywords cron扩展4步 |
| SEO Multiplier（SPEC-SEO-MULTIPLIER） | ✅ 完成 | 5类新页面（/templates /examples /guides /best-ai-tools /tools/keyword）+ 5张DB表 + 5个API + KEYWORD_MODIFIERS + INTENT_SLUGS + InternalLinks多表支持 + sitemap全覆盖 + cron每次+26页 + admin/seo第三行stats |

### Phase 4 — 自动化运营

| 模块 | 状态 | 说明 |
|------|------|------|
| Tool Discovery Agent | ✅ 完成 | /api/cron/generate-tools（每日3am UTC）|
| SEO Growth Agent | ✅ 完成 | /api/cron/discover-keywords（每日2am UTC）|
| Content Publishing Agent | ✅ 完成 | /api/cron/generate-blog（每日4am UTC）|
| Analytics Agent | ✅ 完成 | /api/analytics/track + /api/admin/analytics |

---

## 数据库 Schema（参考）

### 已确认的 Supabase 表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  plan TEXT DEFAULT 'free',       -- free | pro
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 订阅表（每个 Toolkit 独立订阅）
CREATE TABLE subscriptions (
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
CREATE TABLE toolkits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,       -- jobseeker | creator | marketing | business | legal
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
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toolkit_id UUID REFERENCES toolkits(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tool_type TEXT DEFAULT 'template',  -- template | config | custom
  prompt_file TEXT,                    -- prompts/jobseeker/resume_optimizer.txt
  inputs_schema JSONB,                 -- [{name, label, type, placeholder, required}]
  output_format TEXT DEFAULT 'text',  -- text | markdown | json
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Layer 2 工作流配置
CREATE TABLE tool_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id),
  step_order INTEGER,
  step_name TEXT,
  prompt_template TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 使用记录
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),  -- NULL = 未登录用户
  tool_slug TEXT,
  toolkit_slug TEXT,
  session_id TEXT,                     -- 未登录用户的会话标识
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO 关键词
CREATE TABLE seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT,                       -- jobseeker | creator | marketing | business | legal
  tool TEXT,
  intent TEXT,                         -- informational | transactional | commercial
  status TEXT DEFAULT 'pending',       -- pending | published
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEO 页面
CREATE TABLE seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  meta_description TEXT,
  content TEXT,
  keyword_id UUID REFERENCES seo_keywords(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 所有分析事件
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,            -- signup | tool_use | subscription_created | page_view | referral_signup | feedback_submitted
  user_id UUID,
  tool_slug TEXT,
  toolkit_slug TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 用户反馈
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT,
  feedback_type TEXT,                  -- bug | feature_request | improvement | general
  rating INTEGER,                      -- 1-5
  message TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Voting
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  toolkit TEXT,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',          -- open | planned | in_progress | released
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_id, user_id)
);

-- 推荐系统
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',       -- pending | completed | rewarded
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  reward_type TEXT,                    -- free_month | discount
  reward_value TEXT,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 工具盒初始数据（5个 Toolkit + 50个工具）

### Jobseeker Toolkit（$9/month）
```
1  resume-optimizer          Resume Optimizer               template
2  ats-resume-checker        ATS Resume Checker             template
3  resume-bullet-generator   Resume Bullet Generator        template
4  cover-letter-generator    Cover Letter Generator         template
5  interview-answer-generator Interview Answer Generator   template
6  behavioral-interview-coach Behavioral Interview Coach   config
7  linkedin-profile-optimizer LinkedIn Profile Optimizer   template
8  job-description-analyzer  Job Description Analyzer      template
9  resume-keyword-scanner    Resume Keyword Scanner         template
10 salary-negotiation-script Salary Negotiation Script     template
```

### Creator Toolkit（$9/month）
```
11 youtube-title-generator   YouTube Title Generator        template
12 youtube-description-gen   YouTube Description Generator  template
13 youtube-script-generator  YouTube Script Generator       config
14 blog-topic-generator      Blog Topic Generator           template
15 seo-content-generator     SEO Content Generator          config
16 article-outline-generator Article Outline Generator      template
17 newsletter-writer         AI Newsletter Writer           template
18 podcast-script-generator  Podcast Script Generator       config
19 tiktok-caption-generator  TikTok Caption Generator       template
20 instagram-caption-gen     Instagram Caption Generator    template
```

### Marketing Toolkit（$9/month）
```
21 marketing-copy-generator  Marketing Copy Generator       template
22 sales-email-generator     Sales Email Generator          template
23 cold-email-generator      Cold Email Generator           template
24 facebook-ad-copy          Facebook Ad Copy Generator     template
25 google-ads-copy           Google Ads Copy Generator      template
26 product-description-gen   Product Description Generator  template
27 landing-page-copy         Landing Page Copy Generator    config
28 brand-voice-generator     Brand Voice Generator          template
29 headline-generator        Headline Generator             template
30 value-proposition-gen     Value Proposition Generator    template
```

### Business Toolkit（$12/month）
```
31 business-proposal-gen     Business Proposal Generator    config
32 invoice-email-generator   Invoice Email Generator        template
33 customer-support-reply    Customer Support Reply Gen     template
34 meeting-summary-gen       Meeting Summary Generator      template
35 business-plan-generator   Business Plan Generator        config
36 swot-analysis-generator   SWOT Analysis Generator        config
37 company-bio-generator     Company Bio Generator          template
38 pitch-deck-outline        Pitch Deck Outline Generator   config
39 client-followup-email     Client Follow-up Email Gen     template
40 faq-generator             FAQ Generator                  template
```

### Legal Toolkit（$19/month）⚠️ 必须带合规 Disclaimer
```
41 nda-analyzer              NDA Analyzer                   config
42 contract-risk-analyzer    Contract Risk Analyzer         config
43 terms-of-service-gen      Terms of Service Generator     config
44 privacy-policy-gen        Privacy Policy Generator       config
45 legal-doc-summarizer      Legal Document Summarizer      template
46 employment-contract-gen   Employment Contract Generator  config
47 freelance-agreement-gen   Freelance Agreement Generator  config
48 partnership-agreement-gen Partnership Agreement Gen      config
49 non-compete-agreement-gen Non-Compete Agreement Gen      config
50 contract-clause-explainer Contract Clause Explainer      template
```

---

## 定价配置

```typescript
// Stripe Price IDs（需在 .env.local 配置）
STRIPE_JOBSEEKER_PRICE_ID=price_xxx    // $9/month
STRIPE_CREATOR_PRICE_ID=price_xxx      // $9/month
STRIPE_MARKETING_PRICE_ID=price_xxx    // $9/month
STRIPE_BUSINESS_PRICE_ID=price_xxx     // $12/month
STRIPE_LEGAL_PRICE_ID=price_xxx        // $19/month
```

---

## 环境变量清单（.env.local）

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_JOBSEEKER_PRICE_ID=
STRIPE_CREATOR_PRICE_ID=
STRIPE_MARKETING_PRICE_ID=
STRIPE_BUSINESS_PRICE_ID=
STRIPE_LEGAL_PRICE_ID=

# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://aitoolshub.com
```

---

## API 路由规范

```
POST /api/tools/run
  body: { tool_slug, inputs }
  headers: Authorization: Bearer <token>（可选，未登录时不传）
  → 服务端解析 Bearer token → user=null 走匿名分支（IP+UA fingerprint）
  → 检查权限 → 路由到对应 Engine → 返回结果

POST /api/subscription/checkout
  body: { toolkit_slug, user_id }
  → 创建 Stripe Checkout Session → 返回 url

POST /api/subscription/webhook
  → 处理 Stripe 事件 → 更新 subscriptions 表

POST /api/feedback/submit
  body: { tool_slug, feedback_type, rating, message, email? }

POST /api/features/vote
  body: { feature_id }
  → 需要登录
```

---

## 开发优先级（MVP 7天）

```
Day 1  项目初始化 + 数据库 Schema + 环境变量
Day 2  三层 Tool Engine + /api/tools/run
Day 3  首页 + Toolkit 页 + 工具页 UI
Day 4  Auth（Google + Email）+ 3次免费逻辑
Day 5  Stripe 订阅系统（5个 Toolkit）
Day 6  Prompt 文件（50个工具）+ 数据库初始数据
Day 7  Admin 后台 + 部署 Vercel + 测试
```

---

## 已知问题与注意事项

- Legal Toolkit 所有工具**必须**在结果页底部显示 Disclaimer：
  > "This tool provides general informational analysis only. It does not constitute legal advice. Please consult a qualified attorney for legal matters."
- Stripe Webhook 必须用 `stripe.webhooks.constructEvent` 验签
- 未登录用户限制：服务端 SHA256(IP:UA) fingerprint，存 `usage_logs.session_id`，1次/天
- 已登录未付费：3次/天 + 30次终身，通过 `user_id` 查 `usage_logs`
- Bearer token 无效时必须走匿名分支（不可跳过限制）
- SEO 页面必须有 `generateMetadata()` 导出静态 metadata
- 批量 SEO 内容生成使用便宜模型（GPT-4o-mini 或 Claude Haiku）降低成本
- `InputForm` 中 `type:"file"` 字段通过 `FileUploadInput` → `/api/tools/extract-text` 提取文本；字段名 `xyz_file` 提取后以 `xyz` 传入 prompt

---

## 上线后第一批推广平台

1. Futurepedia（AI工具目录）
2. Product Hunt
3. Indie Hackers
4. Reddit: r/Entrepreneur, r/startups, r/SideProject, r/AItools
5. X (Twitter)

---

*本文件由 Claude 维护，每次会话结束后更新模块完成状态*
