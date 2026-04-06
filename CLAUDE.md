# CLAUDE.md — AI Tools Hub Master Context

> **Claude Code 每次新会话必须首先读取本文件和 PROJECT_CONTEXT.md**
> 读取后确认已完成的模块和当前任务，然后等待指令。

---

## 项目概述

**项目名称**: AI Tools Hub  
**项目路径**: `E:\Projects\AI_Tools_Hub`  
**定位**: AI 工具盒订阅平台（AI SaaS Factory）  
**目标**: 多工具盒平台，每个 Toolkit 独立订阅，后期自由扩展工具和工具盒  
**核心理念**: 三层工具架构 + 程序化 SEO + 全自动运营

---

## 技术栈（不可变更）

| 层级 | 技术 |
|------|------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes (Serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| Payments | Stripe (月订阅，per-toolkit) |
| AI | OpenAI API + Claude API (claude-sonnet-4-20250514) |
| Hosting | Vercel |
| Prompts | `/prompts/` 目录下 `.txt` 文件（数据驱动） |

---

## 三层工具系统（核心设计，不可改变）

```
Layer 1 — Template Tools   数据库驱动 + Prompt 模板 + 自动UI  无需写代码
Layer 2 — Config Tools     多步骤 AI 工作流 + 可配置 Pipeline
Layer 3 — Custom Tools     完全自定义逻辑 + 外部 API
```

**执行入口**: `POST /api/tools/run` → 根据 `tool_type` 路由到对应 Engine

新增工具只需：
1. 在 `tools` 表插入一条记录
2. 在 `/prompts/[toolkit]/[tool].txt` 添加 Prompt 文件
3. Layer 1 工具无需任何代码

---

## 项目目录结构

```
E:\Projects\AI_Tools_Hub\
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # 首页
│   ├── toolkits/
│   │   ├── page.tsx                      # 所有工具盒列表
│   │   └── [slug]/page.tsx               # 单个工具盒页面
│   ├── tools/
│   │   └── [slug]/page.tsx               # 单个工具页面
│   ├── blog/
│   │   └── [slug]/page.tsx               # SEO 文章页
│   ├── tool-packs/
│   │   └── [slug]/page.tsx
│   ├── dashboard/page.tsx                # 用户仪表盘
│   ├── admin/page.tsx                    # 管理员后台
│   ├── features/page.tsx                 # Feature Voting Board
│   ├── pricing/page.tsx
│   └── api/
│       ├── tools/run/route.ts            # 工具执行主入口（唯一）
│       ├── seo/generate/route.ts
│       ├── seo/keywords/route.ts
│       ├── subscription/checkout/route.ts
│       ├── subscription/webhook/route.ts
│       ├── feedback/submit/route.ts
│       └── features/vote/route.ts
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── ToolkitCard.tsx
│   ├── ToolCard.tsx
│   ├── InputForm.tsx
│   ├── ResultPanel.tsx
│   ├── PricingTable.tsx
│   ├── FeedbackModal.tsx
│   └── Footer.tsx
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   ├── openai.ts
│   └── claude.ts
├── services/
│   ├── tool-engine/
│   │   ├── template-engine.ts
│   │   ├── config-engine.ts
│   │   └── custom-engine.ts
│   ├── seo-engine/
│   └── automation/
│       ├── tool-discovery-agent.ts
│       ├── seo-growth-agent.ts
│       └── analytics-agent.ts
├── prompts/
│   ├── jobseeker/
│   │   ├── resume_optimizer.txt
│   │   ├── cover_letter.txt
│   │   └── interview_answer.txt
│   ├── creator/
│   │   ├── youtube_title.txt
│   │   └── seo_content_generator.txt
│   ├── marketing/
│   ├── business/
│   └── legal/
│       └── contract_analyzer.txt
├── types/
│   └── index.ts
├── public/
├── styles/
│   └── globals.css
├── middleware.ts
├── CLAUDE.md                             # 本文件
└── PROJECT_CONTEXT.md
```

---

## 五大工具盒（初始版本）

| # | Toolkit | 订阅价格 | 包含工具数 |
|---|---------|---------|-----------|
| 1 | Jobseeker Toolkit | $9/month | 10 tools |
| 2 | Creator Toolkit | $9/month | 10 tools |
| 3 | Marketing Toolkit | $9/month | 10 tools |
| 4 | Business Toolkit | $12/month | 10 tools |
| 5 | Legal Toolkit | $19/month | 10 tools |

每个 Toolkit 独立订阅，用户可以只买需要的。

---

## 用户权限系统（必须严格实现）

```
未登录用户   →  服务端 IP+UA SHA256 fingerprint 计数，免费使用 1 次
             →  超过后弹 UpgradeModal（isLoggedIn=false）显示注册引导
             →  message: "Sign up for free to get 3 uses per day"
已登录未付费 →  3次/天 + 30次终身上限，超过弹 UpgradeModal（isLoggedIn=true）
付费用户     →  对应 Toolkit 100次/天
登录方式     →  Google OAuth 或 邮箱+密码
计费方式     →  Stripe 月订阅（按 Toolkit 单独订阅）
权限检查     →  统一在 /api/tools/run 入口执行，不在页面层分散

关键实现细节：
- Bearer token 存在但 getUser() 返回 null → 归入匿名分支（不跳过限制）
- 日期范围：gte today T00:00:00.000Z / lt tomorrow T00:00:00.000Z
- session_id 字段存储 fingerprint = SHA256(ip:ua)，64位十六进制
```

---

## 数据库核心表

```sql
users              -- 用户表（id, email, plan, usage_count）
subscriptions      -- 订阅表（user_id, toolkit_slug, stripe_subscription_id, status）
usage_logs         -- 使用记录
toolkits           -- 工具盒配置
tools              -- 工具配置（tool_type, prompt_file, inputs_schema）
tool_workflows     -- Layer 2 工作流配置
seo_keywords       -- SEO关键词库
seo_pages          -- 生成的SEO页面
analytics_events   -- 所有事件（signup, tool_use, subscription_created, page_view）
feedback           -- 用户反馈
features           -- Feature voting
feature_votes      -- 投票记录
referrals          -- 推荐记录
referral_rewards   -- 奖励记录
```

---

## 核心开发原则

1. **数据驱动** — 工具配置全部来自数据库，不硬编码
2. **Prompt 文件化** — 每个工具的 Prompt 存放在 `/prompts/` 目录，独立 `.txt` 文件，用 `{variable}` 占位符
3. **Serverless 优先** — 所有后端逻辑用 Next.js API Routes，不用独立服务器
4. **单一入口** — Tool Engine 只有 `/api/tools/run` 一个入口，内部路由
5. **SEO 内置** — 所有工具页、工具盒页必须有 `generateMetadata()` 和结构化数据
6. **法律合规** — Legal Toolkit 工具必须带 disclaimer，不说"法律建议"
7. **成本控制** — 优先用 Claude Haiku/OpenAI GPT-4o-mini 处理 SEO 批量生成

---

## ⚠️ 强制开发顺序（不可跳步，不可并行）

> 每次会话只做当前 Step，完成后更新 PROJECT_CONTEXT.md，再进入下一步。
> 不要一次性生成整个平台。

```
Step 1  项目初始化
        Next.js (App Router) + TypeScript + Tailwind
        建立完整目录结构（含 prompts/ 子目录）

Step 2  Supabase 数据库
        lib/supabase.ts 客户端配置
        执行完整 SQL Schema（见 PROJECT_CONTEXT.md）

Step 3  Tool Engine
        /api/tools/run  ← 唯一工具执行入口，必须只有这一个
        services/tool-engine/template-engine.ts
        services/tool-engine/config-engine.ts
        services/tool-engine/custom-engine.ts

Step 4  Tool UI
        /tools/[slug]/page.tsx  动态工具页（从数据库加载配置）
        InputForm + ResultPanel 组件
        3次免费逻辑（localStorage）

Step 5  AI API 接入
        lib/openai.ts + lib/claude.ts
        Prompt 从 /prompts/[toolkit]/[tool].txt 读取并替换变量

Step 6  SEO 系统
        /blog/[slug]/page.tsx
        所有页面必须有 generateMetadata()

Step 7  Stripe 订阅
        /api/subscription/checkout/route.ts
        /api/subscription/webhook/route.ts
        Pricing 页面
        更新 subscriptions 表
```

---

## 🚫 Claude Code 常见错误——必须避免

### 错误 1：创建多个工具执行入口
```
❌ /api/tools/resume/run
❌ /api/tools/youtube/run
❌ if (slug === "resume") { callResumeAPI() }

✅ 只允许：POST /api/tools/run
✅ 内部根据 tool_type 路由到对应 Engine
```

### 错误 2：工具逻辑硬编码
```
❌ if (slug === "resume-optimizer") { buildResumePrompt() }
❌ switch (slug) { case "cover-letter": ... }

✅ 从 tools 表加载 tool 配置（prompt_file, inputs_schema, tool_type）
✅ 从 /prompts/[toolkit]/[tool].txt 读取 Prompt 模板
✅ 引擎统一处理所有 Layer 1 工具，新工具零代码
```

### 错误 3：拆分成独立服务
```
❌ 单独起 Python FastAPI 服务
❌ 单独起 Express 服务

✅ 全部用 Next.js API Routes（Serverless）
```

### 错误 4：Prompt 内联写死在代码里
```
❌ const prompt = `You are a resume expert... resume: ${resume}` （写在 .ts 文件）

✅ 读取 /prompts/jobseeker/resume_optimizer.txt
✅ 用 {resume}、{job_description} 占位符，引擎运行时替换
```

### 错误 5：权限判断逻辑分散在各页面
```
❌ 在每个工具页面各自判断订阅状态

✅ 统一在 /api/tools/run 入口做权限检查
✅ 查 subscriptions 表中对应 toolkit_slug 是否 active
```

---

## Step 1 初始化指令（可直接粘贴给 Claude Code）

```
Create a Next.js 14 project using App Router.

Requirements:
- TypeScript
- Tailwind CSS
- App Router
- Serverless friendly

Project name: ai-tools-hub

Create the following folder structure:
app/
components/
services/
  tool-engine/
lib/
types/
prompts/
  jobseeker/
  creator/
  marketing/
  business/
  legal/
public/

Also create placeholder files:
- lib/supabase.ts
- lib/openai.ts
- lib/claude.ts
- lib/stripe.ts
- types/index.ts
- services/tool-engine/template-engine.ts
- services/tool-engine/config-engine.ts
- services/tool-engine/custom-engine.ts

Do NOT implement logic yet. Only scaffold the structure.
```

---

## 自动化运营模块（Phase 4，后期启用）

```
Tool Discovery Agent     →  自动发现新工具机会
SEO Growth Agent         →  自动生成 SEO 关键词和文章
Content Publishing Agent →  自动发布内容
Analytics Agent          →  自动分析数据
Optimization Agent       →  自动优化产品
```

---

## UI 设计规范

- **风格**: 极简 SaaS（参考 Vercel/Notion）
- **背景**: 白色，卡片：圆角 + 软阴影
- **固定 Header**: Logo + Toolkits + Blog + Pricing + Sign In + Get Started
- **移动端友好**: 响应式布局
- **免费转付费**: 3 次用完后弹 Upgrade Modal（不跳转离开页面）

---

## SEO 策略

- **URL 模板**: `/blog/[tool]-for-[use-case]`
- **页面类型**: Use Case / Industry / Comparison / Programmatic
- **目标**: 10,000–50,000 SEO 页面（自动生成）
- **关键词比例**: Tool 20% / Guide 20% / Comparison 20% / Programmatic 40%

---

## 会话开始标准流程

```
1. 读取 CLAUDE.md（本文件）
2. 读取 PROJECT_CONTEXT.md
3. 报告：当前已完成 Step / 下一个 Step 是什么
4. 等待 Max 的具体指令
5. 只做当前 Step，完成后更新 PROJECT_CONTEXT.md
```

---

## 重要约定

- 语言：Claude Code 会话使用**中文**
- TypeScript：提交前确保无类型错误
- 每完成一个 Step：更新 PROJECT_CONTEXT.md 的 ✅ 状态
- 环境变量：全部放 `.env.local`，不硬编码 API Key
- 新增工具：只需数据库一行 + Prompt 文件，**不修改任何现有代码**
- 每个 Step 完成后：把目录结构或关键文件内容发给 Max 确认，再进行下一步

---

## 项目状态（最新）

- Phase 1 ✅ Tool Engine + UI + 6 Toolkits + 72 tools
- Phase 2 ✅ Auth + Stripe Billing + Dashboard
- SPEC-07 ✅ UI upgrade (indigo gradient theme)
- SPEC-08 ✅ File upload + download (mammoth + pdf-parse v1 + officeparser)
- SPEC-08b ✅ Stripe price sync to Supabase
- SPEC-FIX-01 ✅ 72 tools DB config fixed (inputs_schema, prompt_file, tool_type)
- SPEC-FIX-02 ✅ Download format → .docx
- SPEC-FIX-03 ✅ File upload Vercel fix (nodejs runtime + serverExternalPackages)
- SPEC-FIX-03 ✅ Resume Optimizer dual-view + DOC_TOOL_CONFIG pattern
- SPEC-FIX-04 ✅ Tool display modes corrected + resume prompt quality upgrade
- SPEC-FIX-05 ✅ All 62 tool prompts upgraded (STEP 1 internal analysis + structured output)
- SPEC-11 ✅ Rate limit fix + mobile responsive + UpgradeModal signup flow
- SPEC-12 ✅ Cover Letter Generator — CV upload + 5-paragraph STAR prompt
- SPEC-SEC-01 ✅ Cloudflare cf-ray 源站保护（生产环境无 cf-ray → 403）
- SPEC-FIX-06 ✅ Checkout "Invalid toolkit" 修复（env var 诊断日志 + TOOLKIT_PRICE_IDS 类型修正）
- SPEC-FIX-07 ✅ Dashboard 订阅显示修复 + 退订功能 + Terms/Privacy 页面
- SPEC-10 ✅ 完整自动化系统（Task 2-11）：SEO + Blog + Feedback + Feature Voting + Referral + Analytics + Operator Dashboard + Auto Tool Generator + Vercel Cron + Sitemap/robots
- SPEC-FINAL ✅ Admin 路由重构 + 3 独立 Cron + Referral 短码修复 + Analytics 完整字段
- SPEC-TEST-01 ✅ Task 2（72/72）+ Task 8（build 通过）；proxy.ts 函数名修复（middleware→proxy）
- SPEC-ADMIN-02 ✅ Bearer token auth修复 + /admin/users/toolkits/tools-manage/pricing 全功能后台
- SPEC-ADMIN-03 ✅ 三级角色系统（user/pro/admin）+ admin无限制 + pro角色=付费权限 + set-role同步plan
- SPEC-GROWTH-01 ✅ Growth Engine 8模块：关键词发现→工具机会→AI自动建工具→SEO页面→内链→流量分析→SEO优化→增长控制台
- SPEC-REFERRAL-02 ✅ Referral 防作弊（同IP 24h限制 + signup_ip写入）+ stats API + ReferralBlock增强 + /admin/referrals
- SPEC-UX-01 ✅ /roadmap 产品路线图（4列看板）+ /features 排序Tabs + Admin AI Analyze + /admin/revenue 收入面板
- SPEC-SEO-20 ✅ Programmatic SEO 2.0：5类页面矩阵（compare/alternatives/problems/workflows/industries）+ 5张DB表 + 5个admin API + 5个scripts + cron自动生成 + InternalLinks组件 + sitemap全覆盖
- SPEC-SEO-MULTIPLIER ✅ SEO流量倍增：5新页面类型（templates/examples/guides/best-ai-tools/tools/keyword）+ 5张DB表 + 5个admin API + KEYWORD_MODIFIERS + INTENT_SLUGS + InternalLinks多表支持 + cron扩展 + admin第三行stats
- SPEC-GROWTH-CAPTURE ✅ 7模块流量捕获飞轮：google-autocomplete + extract-paa + expand-keywords + detect-intent + generate-from-intents + ranking-monitor/import-rankings + optimize-content；3张新表（growth_questions/keyword_intents/seo_rankings）；/admin/growth Section 5 + cron Step 4-7
- SPEC-REVENUE-ENGINE ✅ 7模块收入引擎：UpgradeCTA（动态文案+7天抑制）+ EmailCapture（匿名线索）+ upgrade-prompt/track-upgrade-view API + leads capture/list + affiliate/stats（30%佣金）+ pricing-experiment（IP哈希A/B）+ pricing-convert + send-welcome（Resend）+ webhook自动affiliate_commissions + auth/callback欢迎邮件 + /admin/revenue全量重构（6区块）
- SPEC-SEO-FLAT-ROUTES ✅ 扁平根路径SEO：app/[slug]/page.tsx统一分发（-vs-/- alternatives/how-to-/ai-...-for-）+ seo_use_cases表 + 4个生成API（use-cases-flat/comparisons-flat/alternatives-flat/problems-flat）+ proxy.ts 301重定向 + sitemap扩展 + admin/seo 4个新计数+4个绿色按钮
- SPEC-PROGRAMMATIC-SEO-CORE ✅ 统一SEO生成系统：lib/seo-keywords.ts常量库（30职业/24竞品/30问题）+ /use-cases/[slug]页面（SoftwareApplication JSON-LD）+ /use-cases列表页 + 5个统一生成API（/api/seo/generate-*）+ /api/seo/generate批量入口（~22页/次）+ seo_pages统一表（type字段分类）+ sitemap 5类新路径 + admin/seo顶部汇总看板+6个青色按钮
- SPEC-WEEKLY-INSIGHTS ✅ AI周报系统：weekly_insights表 + lib/insights/generate.ts（聚合7天数据→GPT-4o-mini→Resend邮件）+ /api/cron/weekly-insights（每周一6am UTC）+ /api/admin/generate-insights（手动强制生成）+ WeeklyInsightsBlock客户端组件 + admin/analytics底部集成
- SPEC-LANDING-V2 ✅ 首页高转化改造：9区块（Hero+SocialProof+Toolkits+PopularTools+HowItWorks+ExampleResults+PricingPreview+FAQ+FinalCTA）+ components/home/* 目录 + Header "Start Free →" 按钮 + metadata优化
- SPEC-VIRAL-GROWTH-ENGINE ✅ 病毒增长闭环：referral_rewards表+users.bonus_uses列 + auth/callback奖励发放（新用户+10/邀请者+20/5邀里程碑+100/20邀里程碑Pro1月）+ /api/tools/run识别bonus_uses提升终身限制 + ReferralCapture组件（?ref=→cookie）+ /dashboard/referrals页面（邀请链接+统计3格+里程碑进度条+邀请历史）+ /api/referral/detail API + InviteBanner组件（可关闭，Dashboard顶部）+ 工具结果页病毒提示（已登录free用户）+ UpgradeModal推荐链接
- SPEC-STARTUP-GENERATOR ✅ AI创业流水线：startup_opportunities/analysis/ideas 3张表 + discover-opportunities/analyze-market/generate-startup/generate-landing-page/generate-product-seo/launch-product 6个operator API + /admin/startup管理页（统计+6步流水线+全流水线按钮+机会表+产品表）+ startup-list/admin API + admin导航"Startup Gen" + vercel.json cron每周一9am + /api/cron/weekly-startup
- SPEC-SAAS-FACTORY ✅ AI SaaS工厂：saas_projects表 + /api/operator/generate-saas（GPT-4o-mini生成name/slug/domain/tagline→DB→异步触发SEO页面）+ /api/operator/generate-saas-pages（20关键词变体→seo_pages type=saas_page）+ /saas/[slug]落地页（Hero渐变+Features+Pricing Free/Pro+SEO Pages+Footer CTA，SoftwareApplication JSON-LD）+ /saas列表页（status=active）+ /admin/saas管理页（统计4卡片+生成表单+项目表格，Gen SEO/Activate/Archive/Delete操作）+ 3辅助API（saas-list/saas-update-status/saas-delete）+ admin导航"SaaS Factory" + sitemap /saas/* priority 0.8 + cron Step 8自动生成SaaS草稿
- SPEC-AUTONOMOUS-COMPANY-SYSTEM ✅ 自循环闭环：market_signals/opportunity_scores/revenue_metrics 3张新表 + seo_pages.view_count列 + scan-market/score-opportunities/record-metrics/optimize-pages 4个 intelligence API + /api/seo/ping（Google+Bing sitemap ping）+ /api/cron/daily 重写为8步全自动流水线（市场扫描→机会评分→SEO生成→博客→Startup→页面优化→收入记录→sitemap ping，每步90s timeout+独立try-catch）+ vercel.json 新增每日6am UTC cron + /admin/intelligence仪表盘（4统计+5手动按钮+流水线进度+信号列表+MRR折线图）+ admin导航"Intelligence"
- SPEC-SEO-INDEXING-ACCELERATOR ✅ 加速收录：app/sitemap.ts简化为4个子sitemap入口 + app/sitemap-index.xml（真正<sitemapindex>格式，提交给GSC）+ sitemap-main/tools/seo/blog.xml 4个Route Handler子sitemap + /api/seo/ping改为无鉴权GET（pings sitemap-index.xml）+ 5个SEO生成API末尾追加fire-and-forget ping + tools/[slug]页面底部新增"Use Cases for This Tool"区块（6条，client-side fetch）+ 首页sr-only导航（Google crawl discovery）
- SPEC-APR07 ✅ Admin增强+Compliance+Auth修复（2026-04-07）：Admin Add User（Toolkit下拉+写入subscriptions）+ Admin Users表新增Toolkits badge列+Expiry到期日列 + Dashboard plan实时从subscriptions查询（含canceling）+ Cancel订阅跳过Stripe（manual_/referral_reward_前缀）+ Webhook补全invoice.payment_succeeded/failed事件 + Referral奖励5邀=Bundle1月写subscriptions（移除旧20邀Pro逻辑）+ Compliance Toolkit免责声明三处覆盖（toolkit页+tool页+API输出）+ robots.txt移除/auth/屏蔽+sitemap指向www+sitemap-index.xml + 首页150+数字统一+hero badge隐私说明 + Google OAuth session丢失修复（proxy.ts 3个bug）+ Google Cloud Console加生产域名
- SPEC-APR08-TOOLS ✅ 全平台工具扩展（2026-04-08）：文件上传改造（InputForm所有textarea加Upload file按钮，支持PDF/DOCX/PPTX/TXT）+ Mode A双区显示（template-engine.ts结构化输出格式，page.tsx双区渲染）+ A类工具DOC_TOOL_CONFIG注册（12个：resume-optimizer/linkedin-profile-optimizer + 10个新工具）+ 字体调整（InputForm text-sm→text-base，globals.css .prose font-size: 1rem）+ 新增6个Toolkit（data-analytics/sales/social-media/document/productivity/ai-prompts，各20工具）+ 15个现有Toolkit各新增10个工具全部达到20个 + lib/stripe.ts加入6个新Price ID映射（STRIPE_Data_Analytics_PRICE_ID等）+ Admin Users TOOLKIT_COLORS新增6个颜色映射 + 首页400+数字更新
- SPEC-11-C 🔲 Stripe Live 切换（手动操作，见下方步骤）
- SPEC-09 🔲 Programmatic SEO Engine

## Tool Display Modes

- **Mode A (dual-view)**: `resume-optimizer`, `linkedin-profile-optimizer`, `essay-writing-feedback-generator`, `meta-title-description-optimizer`, `blog-post-seo-optimizer`, `meeting-notes-optimizer`, `reading-notes-to-action-items-converter`, `board-meeting-minutes-generator`, `meeting-notes-to-project-plan-converter`, `email-copywriting-optimizer`, `job-posting-optimizer`, `customer-feedback-response-optimizer`
  → Summary section (what changed + why) + collapsible document preview + Download .docx
- **Mode B (single-view + download)**: all other tools
  → Full result rendered as Markdown + Download .docx button

## Key Files

- `app/tools/[slug]/page.tsx` — tool page with `DOC_TOOL_CONFIG` for dual-view tools, `isLoggedIn` state
- `components/ResultPanel.tsx` — standard result display with .docx download
- `components/UpgradeModal.tsx` — signup flow (isLoggedIn=false) or subscribe flow (isLoggedIn=true)
- `components/InputForm.tsx` — file fields use `FileUploadInput`; extracted text passed as `{field}_text`
- `app/api/tools/run/route.ts` — single entry point; IP+UA fingerprint; correct auth fallback
- `app/api/tools/extract-text/route.ts` — file upload parser (pdf-parse v1 + mammoth + officeparser)
- `prompts/jobseeker/cover_letter.txt` — 5-paragraph STAR cover letter prompt
- `prompts/` — all tool prompts organized by toolkit (all upgraded with STEP 1)
- `scripts/test-all-tools.mjs` — validates all 72 tools (72/72 pass)
- `proxy.ts` — Next.js 16 proxy（原 middleware）: session refresh + referral cookie + protect /dashboard + /admin；导出函数必须命名为 `proxy`

## Architecture Notes

- Next.js 16.2.2 (App Router) + Supabase + Stripe + OpenAI
- All 72 tools: `tool_type: template`, `inputs_schema` populated, `prompt_file` verified
- File parsing: `pdf-parse@1` + `mammoth` + `officeparser` (all in `serverExternalPackages`)
- Stripe webhook: `price.updated` → auto-sync to Supabase `toolkits.price_monthly`
- Sign Out: `<button>` with `supabase.auth.signOut()` + `router.push("/")` (not `<Link>`)
- Rate limiting: anonymous = 1/day via SHA256(IP:UA); logged-in free = 3/day+30 lifetime; paid/pro = 100/day; admin = unlimited
- Role system: `users.role` = user(default) / pro(paid, manual) / admin；`users.plan` = free/pro（与role联动，set-role API自动同步）
- Growth Engine: `growth_keywords` + `tool_opportunities` 表；`tools.auto_generated/seo_title/seo_description/prompt_template` 列；`tool_use_cases` 表
- Internal linking: `lib/internal-linking.ts` → `injectInternalLinks(content, tools)` 注入博客内链
- Referral 防作弊: auth/callback 记录 signup_ip；同 IP 24h 内已有注册 → 忽略 referral；users.signup_ip 列
- Referral stats API: GET /api/referral/stats → {invited_count, paid_count, rewards_count}（Bearer token auth）
- ReferralBlock: 客户端 fetch /api/referral/stats，显示 Invited/Paid/Rewards 三项
- /admin/referrals: 服务端组件，显示所有推荐记录 + 4个统计卡片
- OG Meta: `app/layout.tsx` 默认 openGraph；`app/tools/[slug]/layout.tsx` 工具页 OG；`app/blog/[slug]/page.tsx` 文章 OG
- Growth API: `/api/growth/discover-keywords|find-opportunities|auto-create-tool|traffic-report|optimize-seo`（全部 requireAdmin）
- `/ai-tools-for/[slug]/page.tsx`：职业聚合页，lib/seo/loaders getProfession(slug)；[profession] 路由已删除（冲突修复）
- `/admin/growth`：增长控制台（关键词/机会/自动工具/流量报告 4区块）
- `/roadmap`：服务端组件，4列看板（Planned/In Progress/Released/Open），从 features 表按 status 读取
- `/features`：排序 Tabs（Most Votes/Newest/Trending，trending = votes*2 + 1/(days+1)）；admin 可见 AI Analyze 按钮
- `/api/features/analyze`：POST，requireAdmin，GPT-4o-mini 分析 features（votes>5），返回 Top Needs/Pain Points/Suggested Tools
- `/admin/revenue`：MRR/活跃订阅/本月收入/Top Toolkit KPI；toolkit 分布表；最近5笔 subscriptions；Stripe best-effort
- `/api/admin/revenue`：GET，requireAdmin，返回完整收入 JSON
- `InputForm` file fields: `name: "xyz_file", type: "file"` → extracts text → submits as `xyz`
- Referral short code = `user.id.slice(0, 8)`；callback 用 UUID prefix range query 查找推荐人
- Admin 路由: `/admin/*`（layout 校验 users.role='admin'），12 页面：overview/users/toolkits/tools-manage/tools(AI)/seo/blog/analytics/feedback/pricing/revenue/saas
- SEO 2.0 路由: `/compare/[slug]`（DB+static fallback）`/alternatives/[slug]` `/problems/[slug]` `/workflows/[slug]`；`/ai-tools-for/[slug]` 优先读 seo_industries，fallback 到 getProfession()
- SEO 2.0 常量: `lib/seo/seo-constants.ts` — 30 competitors, 20 problems, 15 workflows, 40 industries
- SEO 2.0 Cron: generate-blog 额外生成 3 comparisons + 2 alternatives + 2 problems + 1 workflow + 1 industry/次
- SEO 2.0 Admin: /admin/seo 新增 5 个计数器 + 5 个触发按钮（generate-comparisons/alternatives/industries/problems/workflows）
- InternalLinks: `components/seo/InternalLinks.tsx`（async server component），props: currentSlug + type
- Admin API 鉴权：统一用 Bearer token（`lib/auth-admin.ts` → `requireAdmin(req)`），客户端页面先 `supabase.auth.getSession()` 取 token
- Cron: discover-keywords(2am) / generate-tools(3am) / generate-blog(4am) / daily(6am: 8步全自动流水线)
- Intelligence Pipeline: /api/intelligence/{scan-market,score-opportunities,record-metrics,optimize-pages}；所有用 requireAdmin；/admin/intelligence 仪表盘
- Daily Cron (6am): 市场扫描→机会评分→SEO批量→博客→Startup(score≥75)→页面优化→收入记录→sitemap ping；每步90s timeout；appUrl从req.url推导
- market_signals表（keyword/score/status=new/processed）；opportunity_scores表（demand/competition/monetization/score/ai_summary）；revenue_metrics表（metric=mrr/new_users/tool_uses/date_marker）；seo_pages.view_count列
- Sitemap拆分: /sitemap.xml→4个子sitemap URL；/sitemap-index.xml→真正sitemapindex XML（提交GSC）；/sitemap-seo.xml→seo_pages全量（5000条上限）；/sitemap-blog.xml→blog_posts；/sitemap-tools.xml→tools+toolkits；/sitemap-main.xml→静态页面
- SEO收录加速: 5个生成API末尾fire-and-forget ping；/api/seo/ping无鉴权GET；tools页新增Use Cases内链区块；首页sr-only crawl nav
- 用户封禁：`users.banned=true` → /api/tools/run 返回 403；IP封禁：`banned_ips` 表，同入口检查
- **proxy.ts**（Next.js 16 的 middleware 替代）：文件名固定 `proxy.ts`，导出函数必须命名为 `proxy`，不是 `middleware`
- Revenue Engine: `UpgradeCTA` 7天localStorage抑制（key: `upgrade_cta_hidden_{trigger}`）；`EmailCapture` 一次性提交（key: `email_capture_submitted`）；`upgrade_prompts` 表存动态文案，DEFAULTS兜底；`leads` 表存邮件线索；`affiliate_commissions` 表存佣金（30%，单位分）；`pricing_experiments` 表做A/B实验（IP哈希分组）；欢迎邮件用 Resend REST API（无SDK），RESEND_API_KEY未设置时静默跳过
- Revenue Engine 触发点: tool页结果后（未登录→EmailCapture，已登录free→UpgradeCTA trigger=result_page）；dashboard（7天内>5次tool_use→UpgradeCTA trigger=heavy_user）；pricing页（A/B实验标签展示）；UpgradeModal（动态文案by errorType）；ReferralBlock（显示联盟佣金）
- Flat Routes: `app/[slug]/page.tsx` 根路径动态路由，按slug格式分发4类SEO页面；Named routes优先级高于动态路由，无需白名单；seo_use_cases表（slug=ai-{tool}-for-{profession}）；seo_comparisons/alternatives/problems 新增flat_slug字段；proxy.ts 301: /compare/*→/*，/alternatives/*→/*-alternatives，/problems/*→/*，/tools/*/for-*→/ai-*-for-*
- Programmatic SEO: `lib/seo-keywords.ts` 导出PROFESSIONS/COMPETITORS/PROBLEMS/MODIFIERS常量；`/use-cases/[slug]` 服务端页面从seo_pages(type=use_case)读取；`/api/seo/generate-*` 5个统一生成API（写seo_pages主表 + 同步各分散表）；`/api/seo/generate` 批量入口顺序调用5个API；seo_pages表新增type/seo_title/seo_description/tool_slug/meta字段
- Weekly Insights: `lib/insights/generate.ts` 聚合analytics_events/subscriptions/leads→GPT-4o-mini周报→weekly_insights表→Resend邮件（from: onboarding@resend.dev, to: ADMIN_EMAIL）；force=false跳过重复；vercel.json cron每周一6am UTC；admin/analytics底部WeeklyInsightsBlock客户端组件（Generate按钮+最近5条报告）
- SaaS Factory: `saas_projects`表（id/name/slug/domain/template/keyword/description/tagline/primary_tool_slug/status/seo_pages_count）；/saas/[slug]落地页 SoftwareApplication JSON-LD；/api/operator/generate-saas POST requireAdmin；/api/operator/generate-saas-pages POST requireAdmin（type='saas_page'写seo_pages）；cron discover-keywords Step 8自动生成草稿SaaS（score≥70的done关键词）
- subscriptions表手动记录：stripe_subscription_id以`manual_`或`referral_reward_`为前缀的记录为手动插入（无Stripe实体）；cancel时直接DB软删除（status='canceled'），跳过Stripe API；cancel_at_period_end列已存在并正常工作
- users.plan与subscriptions实时同步：有任何active/canceling订阅→plan='pro'；Admin Add User时同时写subscriptions表（toolkit_slug+status='active'+stripe_subscription_id='manual_{uuid}'）
- 权限层级（已验证无漏洞）：admin（无限制）> pro role > bundle订阅（所有toolkit）> 单toolkit订阅 > free（3次/天+30终身）
- Webhook事件：`price.updated`→同步toolkits.price_monthly；`customer.subscription.updated/deleted`→更新subscriptions状态；`invoice.payment_succeeded`→续费时重置/延长current_period_end+确认active；`invoice.payment_failed`→标记past_due
- Referral里程碑：5 invites → Bundle 1 month（写subscriptions，prefix=referral_reward_，toolkit_slug='bundle'，无Stripe）；移除旧20邀Pro 1月逻辑；10/+20 bonus_uses奖励保留
- Compliance Toolkit免责声明：/toolkits/compliance-toolkit页面顶部banner + /tools/[slug]页面（toolkit.slug==='compliance-toolkit'时）+ /api/tools/run engine输出末尾自动追加disclaimer文字
- robots.txt：已移除`/auth/`屏蔽（防止Google OAuth callback被拦截）；sitemap指向`https://www.aitoolsstation.com/sitemap-index.xml`
- Google OAuth修复（proxy.ts）：3个bug：①session refresh时序错误 ②cookie未正确转发到Supabase ③OAuth callback redirect逻辑覆盖了session；修复后OAuth登录session正常持久化

## SPEC-11-C — Stripe Live 切换（待手动操作）

1. Stripe Dashboard → Live 模式 → 创建 7 个产品（见 SPEC-11 文档）
2. Developers → Webhooks → Add endpoint: `https://aitoolsstation.com/api/subscription/webhook`
3. 复制 Live Secret Key + Webhook Secret
4. Vercel → Settings → Environment Variables → 更新所有 STRIPE_* 变量
5. Redeploy → 用真实银行卡验证

## Next Tasks

1. SPEC-11-C: Stripe Live 切换（手动）
2. Compliance Toolkit banner 显示确认（prod环境实际渲染验证）
3. Product Hunt 发布（Apr 9 17:01 Sydney）
4. 运行 SEO Multiplier 内容生成脚本填充 5 张新 DB 表
5. 在 /admin/growth → Traffic Capture 启动飞轮（顺序：Autocomplete → PAA → Expand → Detect → Generate）
6. 当有 GSC 数据后，用 POST /api/growth/import-rankings 导入排名数据，再运行 Content Optimizer
7. 考虑删除 /operator/* 页面（已被 /admin/* 完全替代）