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
- SPEC-11-C 🔲 Stripe Live 切换（手动操作，见下方步骤）
- SPEC-09 🔲 Programmatic SEO Engine

## Tool Display Modes

- **Mode A (dual-view)**: `resume-optimizer`, `linkedin-profile-optimizer`
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
- `InputForm` file fields: `name: "xyz_file", type: "file"` → extracts text → submits as `xyz`
- Referral short code = `user.id.slice(0, 8)`；callback 用 UUID prefix range query 查找推荐人
- Admin 路由: `/admin/*`（layout 校验 users.role='admin'），10 页面：overview/users/toolkits/tools-manage/tools(AI)/seo/blog/analytics/feedback/pricing
- Admin API 鉴权：统一用 Bearer token（`lib/auth-admin.ts` → `requireAdmin(req)`），客户端页面先 `supabase.auth.getSession()` 取 token
- Cron: discover-keywords(2am) / generate-tools(3am) / generate-blog(4am)
- 用户封禁：`users.banned=true` → /api/tools/run 返回 403；IP封禁：`banned_ips` 表，同入口检查
- **proxy.ts**（Next.js 16 的 middleware 替代）：文件名固定 `proxy.ts`，导出函数必须命名为 `proxy`，不是 `middleware`

## SPEC-11-C — Stripe Live 切换（待手动操作）

1. Stripe Dashboard → Live 模式 → 创建 7 个产品（见 SPEC-11 文档）
2. Developers → Webhooks → Add endpoint: `https://aitoolsstation.com/api/subscription/webhook`
3. 复制 Live Secret Key + Webhook Secret
4. Vercel → Settings → Environment Variables → 更新所有 STRIPE_* 变量
5. Redeploy → 用真实银行卡验证

## Next Tasks

1. SPEC-11-C: Stripe Live 切换（手动）
2. SPEC-09: Programmatic SEO Engine（keyword data layer → use-case pages → sitemap）
3. 考虑删除 /operator/* 页面（已被 /admin/* 完全替代）