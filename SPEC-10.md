# SPEC-10 — AI Venture OS 完整自动化系统（更新版）

## 系统目标

将 AI Tools Hub 升级为 Self-Operating AI SaaS，实现：
- 自动 SEO 页面生成（1000+）
- 自动博客内容生成
- 自动工具发现与生成
- 用户反馈 + 功能投票
- 推荐系统（Referral）
- Analytics + 增长分析
- Operator 运营控制台

---

## 执行顺序

```
Task 1  → 生产级数据库扩展（SQL，手动执行）
Task 2  → Use-case SEO 页面系统
Task 3  → Blog 自动内容系统
Task 4  → Feedback 反馈模块
Task 5  → Feature Voting Board
Task 6  → Referral System
Task 7  → Analytics 系统
Task 8  → Operator Dashboard（运营控制台）
Task 9  → Auto Tool Generator 脚本
Task 10 → AI Operator 调度（Vercel Cron）
Task 11 → Sitemap + robots 更新
```

---

## Task 1：生产级数据库扩展（手动在 Supabase SQL Editor 执行）

```sql
-- 1. users 表增加 role 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. tools 表增加 SEO + 状态字段
ALTER TABLE tools
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS seo_how_it_works TEXT,
ADD COLUMN IF NOT EXISTS seo_benefits TEXT,
ADD COLUMN IF NOT EXISTS seo_example TEXT,
ADD COLUMN IF NOT EXISTS seo_faq JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generated_by TEXT DEFAULT 'manual';

-- 3. tool_use_cases 表（Use-case SEO 页面数据）
CREATE TABLE IF NOT EXISTS tool_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT NOT NULL,
  use_case TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  content TEXT,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. blog_posts 表
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  seo_title TEXT,
  seo_description TEXT,
  keywords TEXT,
  published BOOLEAN DEFAULT false,
  auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. seo_keywords 表
CREATE TABLE IF NOT EXISTS seo_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT UNIQUE NOT NULL,
  category TEXT,
  toolkit_slug TEXT,
  tool_slug TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- 6. tool_ideas 表（Auto Tool Generator 队列）
CREATE TABLE IF NOT EXISTS tool_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT,
  tool_name TEXT,
  tool_slug TEXT,
  description TEXT,
  prompt_template TEXT,
  seo_title TEXT,
  seo_description TEXT,
  toolkit_slug TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- 7. feedback 表
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT,
  feedback_type TEXT,
  rating INTEGER,
  message TEXT,
  email TEXT,
  user_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

-- 8. features 表（Feature Voting Board）
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  toolkit TEXT,
  votes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT now()
);

-- 9. feature_votes 表（防止重复投票）
CREATE TABLE IF NOT EXISTS feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id),
  user_id UUID,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(feature_id, user_id)
);

-- 10. referrals 表
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

-- 11. referral_rewards 表
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  reward_type TEXT,
  reward_value TEXT,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 12. analytics_events 表
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  tool_slug TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Task 2：Use-case SEO 页面系统

### 2-A：Use-case 内容生成脚本

创建 `scripts/generate-seo-content.mjs`（为现有 72 个工具生成 SEO 字段）。

创建 `scripts/generate-use-cases.mjs`：

```javascript
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const USE_CASES = {
  jobseeker: ['data-analyst','software-engineer','product-manager','marketing-manager','nurse','teacher','graphic-designer','sales-manager','accountant','student'],
  creator: ['gaming','tech','vlog','education','cooking','fitness','travel','podcast','music','business'],
  marketing: ['ecommerce','saas','real-estate','healthcare','restaurant','agency','startup','nonprofit','b2b','local-business'],
  business: ['startup','enterprise','consultant','freelancer','small-business','remote-team','agency','retail','finance','hr'],
  legal: ['contract','nda','employment','privacy-policy','terms-of-service','lease','partnership','ip','compliance','dispute'],
  exam: ['ielts','toefl','sat','gmat','gre','bar-exam','medical','coding-interview','certification','college-entrance'],
}

async function generateUseCasePage(tool, useCase) {
  const prompt = `Write SEO content for an AI tool use-case page. Return ONLY valid JSON.
Tool: ${tool.name}, Use case: ${useCase.replace(/-/g, ' ')}
Return: {"title":"H1 title","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"3 SEO paragraphs"}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })
  return JSON.parse(res.choices[0].message.content)
}

async function main() {
  const { data: tools } = await supabase.from('tools').select('slug, name, toolkit_slug').eq('status', 'active')
  for (const tool of tools) {
    const useCases = USE_CASES[tool.toolkit_slug] || []
    for (const useCase of useCases) {
      const slug = `${tool.slug}-for-${useCase}`
      const { data: existing } = await supabase.from('tool_use_cases').select('id').eq('slug', slug).single()
      if (existing) continue
      try {
        console.log(`Generating: ${slug}`)
        const content = await generateUseCasePage(tool, useCase)
        await supabase.from('tool_use_cases').insert({ tool_slug: tool.slug, use_case: useCase, slug, ...content })
        console.log(`✓ ${slug}`)
        await new Promise(r => setTimeout(r, 600))
      } catch (err) { console.error(`✗ ${slug}:`, err.message) }
    }
  }
  console.log('Done!')
}
main()
```

### 2-B：Use-case 页面路由

创建 `app/tools/[slug]/for-[usecase]/page.tsx`：
- Server Component，从 `tool_use_cases` 表读取内容
- `generateMetadata` 使用 seo_title / seo_description
- 页面：H1 + 内容 + 工具交互区（复用现有工具 UI）+ Related Tools
- Schema.org SoftwareApplication JSON-LD

---

## Task 3：Blog 自动内容系统

### 3-A：关键词种子脚本

创建 `scripts/seed-keywords.mjs`（AI 为每个 toolkit 生成 20 个博客关键词，写入 seo_keywords 表）。

### 3-B：博客文章生成脚本

创建 `scripts/generate-blog.mjs`（取 seo_keywords pending 条目，AI 生成 800+ 字文章，写入 blog_posts，status=used）。

### 3-C：Blog 页面升级

更新 `app/blog/page.tsx`：从 blog_posts 读取 published=true，分页（12篇/页）。

更新 `app/blog/[slug]/page.tsx`：
- `generateMetadata` + Schema.org BlogPosting JSON-LD
- 安装并使用 `react-markdown` 渲染 content
- 文章末尾推荐相关工具

---

## Task 4：Feedback 反馈模块

### 4-A：Feedback API

创建 `app/api/feedback/submit/route.ts`：
```typescript
// POST /api/feedback/submit
// Body: { tool_slug, feedback_type, rating, message, email }
// 写入 feedback 表 + 写入 analytics_events(event_type='feedback_submitted')
```

### 4-B：FeedbackModal 组件

创建 `components/FeedbackModal.tsx`（客户端组件）：
- 4 个字段：message（textarea）、feedback_type（radio: bug/feature/improvement/general）、rating（1-5星）、email（可选）
- 触发按钮："Was this helpful? Send Feedback"
- 提交后显示感谢确认

### 4-C：嵌入工具页

在 `app/tools/[slug]/page.tsx` 底部添加 `<FeedbackModal toolSlug={slug} />`

---

## Task 5：Feature Voting Board

### 5-A：页面

创建 `app/features/page.tsx`（客户端组件）：
- 显示 features 列表，按 votes 降序，带状态 badge（Open/Planned/In Progress/Released）
- 顶部提交表单：title + description + toolkit 选择
- Vote 按钮（需登录）

### 5-B：API

创建 `app/api/features/vote/route.ts`：
```typescript
// POST /api/features/vote
// Body: { feature_id }
// 检查 feature_votes 防重复 → features.votes +1
```

创建 `app/api/features/submit/route.ts`：
```typescript
// POST /api/features/submit
// Body: { title, description, toolkit }
// 写入 features 表
```

---

## Task 6：Referral System

### 6-A：Referral 追踪

在 `proxy.ts`（中间件）：检测 `?ref=CODE` → 写入 cookie `referrer_code`（30天有效期）。

### 6-B：注册时写入 referral

Supabase Auth 触发器 或注册后 API：检查 referrer_code → 写入 `referrals` 表。

### 6-C：付费触发奖励

在 `app/api/subscription/webhook/route.ts` 的 `checkout.session.completed`：
- 查找 pending referral → 写入 `referral_rewards`（reward_type: 'free_month'）
- 更新 referral.status = 'rewarded'

### 6-D：Dashboard 推荐区块

在 `app/dashboard/page.tsx` 增加区块：
```
Invite Friends
Your referral link: https://aitoolsstation.com/?ref={user_short_id}
[ Copy Link ]
Referrals: X  |  Rewards: X month free
```

---

## Task 7：Analytics 系统

### 7-A：事件埋点

在以下位置写入 `analytics_events`：
- `/api/tools/run`：每次工具使用 → `tool_use`
- Supabase `on_auth_user_created` trigger → `signup`
- `/api/subscription/webhook` checkout.completed → `subscription_created`
- 工具页面（client component）onMount → `page_view`（带 metadata.page）

### 7-B：Analytics API

创建 `app/api/admin/analytics/route.ts`（仅 admin）：
- 今日/本周 signups
- Top 10 工具使用排名（按 tool_slug 分组计数）
- 总 subscriptions
- 今日 page_views

---

## Task 8：Operator Dashboard（运营控制台）

**路由保护**：所有 `/operator/*` 路由检查 `users.role = 'admin'`，非 admin 重定向到首页。

### 8-A：Overview

创建 `app/operator/page.tsx`：
统计卡片：Tools（active）/ Use-case Pages / Blog Posts / Users / MRR

### 8-B：Tool Generator

创建 `app/operator/tools/page.tsx`：
- 显示 `tool_ideas` 表 pending 条目列表
- 每行：tool_name、description、toolkit_slug + Approve / Reject 按钮
- Approve → 写入 tools 表，status=active，创建对应 prompt 文件
- 顶部"Discover New Tools"按钮 → 调用 `/api/operator/generate-tool-ideas`

创建 `app/api/operator/generate-tool-ideas/route.ts`（仅 admin，调用 OpenAI 生成 idea 写入 tool_ideas）。

### 8-C：SEO Engine

创建 `app/operator/seo/page.tsx`：
- 统计：Total keywords / Use-case pages / Pending keywords
- 按钮：Generate Keywords / Generate Use-case Pages / Rebuild Sitemap

创建对应 API routes：
- `app/api/operator/generate-keywords/route.ts`
- `app/api/operator/generate-use-cases/route.ts`

### 8-D：Blog Engine

创建 `app/operator/blog/page.tsx`：
- blog_posts 列表（title + published + created_at + Delete 按钮）
- 按钮："Generate 5 Articles"→ 调用 `/api/operator/generate-blog`

创建 `app/api/operator/generate-blog/route.ts`（取 pending 关键词 AI 生成文章）。

### 8-E：Analytics

创建 `app/operator/analytics/page.tsx`：
- 调用 `/api/admin/analytics`
- 展示：今日新用户、Top Tools、今日 page views、subscriptions

### 8-F：Feedback 后台

创建 `app/operator/feedback/page.tsx`：
- 显示 feedback 表，列：Tool | Rating | Type | Message | Date
- 排序：最新 / 评分最低

---

## Task 9：Auto Tool Generator 脚本

创建 `scripts/discover-tools.mjs`：
- AI 为每个 toolkit 生成 3 个新工具 idea
- 检查 tools 表避免重复 slug
- 写入 `tool_ideas` 表（status=pending）
- 需要在 `/operator/tools` 手动 Approve 后才正式上线

---

## Task 10：AI Operator 调度（Vercel Cron）

创建 `app/api/cron/daily/route.ts`：

```typescript
export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  // 1. 生成 20 个新 SEO 关键词
  // 2. 生成 3 篇博客文章
  // 3. 发现 3 个新工具 idea（写入 tool_ideas 等待审核）
  return Response.json({ success: true })
}
```

在 `vercel.json` 添加：
```json
{
  "crons": [{ "path": "/api/cron/daily", "schedule": "0 2 * * *" }]
}
```

Vercel 环境变量添加 `CRON_SECRET`（随机字符串）。

---

## Task 11：Sitemap + robots 更新

**`app/sitemap.ts`**：包含 tools + tool_use_cases + blog_posts 所有 URL，优先级设置合理。

**`app/robots.ts`**：disallow `/api/`、`/dashboard`、`/auth/`、`/operator`。

---

## 首次运行脚本顺序

```bash
# 1. 生成现有工具 SEO 内容
node scripts/generate-seo-content.mjs

# 2. 种入 SEO 关键词
node scripts/seed-keywords.mjs

# 3. 生成 use-case 页面数据（72工具 × 10场景 = 720条）
node scripts/generate-use-cases.mjs

# 4. 生成初始博客文章（运行多次，每次 5 篇）
node scripts/generate-blog.mjs

# 5. 发现新工具候选（写入 tool_ideas，在 /operator/tools 审核后上线）
node scripts/discover-tools.mjs
```

---

## 完成标准

**数据库**
- [ ] Task 1 所有 SQL 执行成功（12 项扩展）

**SEO**
- [ ] 72 个工具均有 seo_title / seo_description
- [ ] `/tools/[slug]/for-[usecase]` 路由正常访问
- [ ] `/sitemap.xml` 包含 tools + use-cases + blog URL

**Blog**
- [ ] `/blog` 和 `/blog/[slug]` 正常渲染 markdown
- [ ] blog_posts 表有 20+ 篇已发布文章

**用户互动**
- [ ] Feedback Modal 在工具页正常弹出和提交
- [ ] `/features` 页面可以查看、投票、提交请求
- [ ] Dashboard 有 Referral 链接区块

**后台**
- [ ] `/operator` 仅 admin 可访问
- [ ] Operator Dashboard 6 个子页面正常工作
- [ ] `/operator/tools` 可 Approve tool_ideas 写入 tools 表

**自动化**
- [ ] `vercel.json` cron job 配置完成
- [ ] `/api/cron/daily` 正常响应

**代码质量**
- [ ] `npm run type-check` 0 错误
- [ ] git commit + push
- [ ] 更新 CLAUDE.md 和 PROJECT_CONTEXT.md，记录 SPEC-10 已完成
