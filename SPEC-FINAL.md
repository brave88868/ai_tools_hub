# SPEC-FINAL — 剩余模块完整开发指令

## 当前已完成
- Task 1 ✅ 数据库 SQL
- Task 2 ✅ Use-case SEO 页面
- Task 3 ✅ Blog 自动内容系统

## 需要继续完成的 Task（按顺序执行）

---

## Task 4：Feedback 反馈模块

### 4-A：API
创建 `app/api/feedback/submit/route.ts`：
- POST，接收 `{ tool_slug, feedback_type, rating, message, email }`
- 写入 `feedback` 表
- 同时写入 `analytics_events`（event_type='feedback_submitted'）
- 需验证用户已登录或允许匿名提交

### 4-B：FeedbackModal 组件
创建 `components/FeedbackModal.tsx`（客户端组件）：
- Props: `toolSlug: string`
- 触发按钮："Was this helpful? Send Feedback"，放在工具结果区域底部
- Modal 内容：
  - message textarea（必填）
  - feedback_type radio（Bug / Feature Request / Improvement / General）
  - rating 星级 1-5（点击选择）
  - email input（可选）
  - Submit 按钮
- 提交成功后显示 "Thank you for your feedback!" 并关闭 Modal

### 4-C：嵌入工具页
在 `app/tools/[slug]/page.tsx` 的结果显示区域底部加入 `<FeedbackModal toolSlug={slug} />`

---

## Task 5：Feature Voting Board

### 5-A：页面
创建 `app/features/page.tsx`（客户端组件）：
- 页面标题："Feature Requests"
- 顶部提交表单：title（必填）+ description + toolkit 选择（Jobseeker/Creator/Marketing/Business/Legal/Exam）+ Submit 按钮
- 功能列表：按 votes 降序，每条显示：
  - title + description
  - toolkit badge
  - 状态 badge（Open=灰/Planned=蓝/In Progress=黄/Released=绿）
  - "👍 X votes" + Vote 按钮
- 未登录点击 Vote 弹登录提示
- 导航栏加入 Features 链接

### 5-B：API
创建 `app/api/features/vote/route.ts`：
- POST，接收 `{ feature_id }`
- 必须已登录
- 检查 `feature_votes` 防重复投票（UNIQUE constraint）
- features.votes +1

创建 `app/api/features/submit/route.ts`：
- POST，接收 `{ title, description, toolkit }`
- 写入 `features` 表

---

## Task 6：Referral System

### 6-A：Referral 追踪中间件
在 `proxy.ts` 中：
- 检测请求 URL 中的 `?ref=CODE` 参数
- 将 CODE 写入 cookie `referrer_code`，有效期 30 天
- 不影响现有中间件逻辑

### 6-B：注册时写入 referral
在 Supabase `on_auth_user_created` trigger（已存在）中扩展，
或在注册成功后的 API 中：
- 读取 cookie `referrer_code`
- 查询 `users` 表找到 referrer_id（referrer_code = referrer 用户的 id 短码或邮箱 hash）
- 写入 `referrals` 表（referrer_id, referred_user_id, status='pending'）

注：referral code 格式 = 用户 user_id 的前 8 位（`user.id.slice(0, 8)`）

### 6-C：付费触发奖励
在 `app/api/subscription/webhook/route.ts` 的 `checkout.session.completed` 处理末尾：
- 查找该用户是否有 status='pending' 的 referral 记录
- 如果有：
  - 写入 `referral_rewards`（user_id=referrer_id, reward_type='free_month'）
  - 更新 referral.status = 'rewarded'

### 6-D：Dashboard Referral 区块
在 `app/dashboard/page.tsx` 底部新增 Referral 区块：
- 显示用户的推荐链接：`https://aitoolsstation.com/?ref={user.id.slice(0,8)}`
- Copy Link 按钮（点击复制到剪贴板）
- 显示：已推荐人数 / 已获得奖励月数
- 数据来自 `referrals` 和 `referral_rewards` 表

---

## Task 7：Analytics 系统

### 7-A：事件埋点
在以下位置写入 `analytics_events`：

1. `app/api/tools/run/route.ts`（已存在）：工具执行成功后追加：
```typescript
await supabase.from('analytics_events').insert({
  event_type: 'tool_use',
  user_id: user?.id,
  tool_slug: toolSlug,
})
```

2. `app/api/subscription/webhook/route.ts`：checkout.completed 时追加：
```typescript
await supabase.from('analytics_events').insert({
  event_type: 'subscription_created',
  user_id: userId,
})
```

3. Supabase `on_auth_user_created` trigger：注册时追加 signup 事件（或在注册 API 中写入）。

### 7-B：Analytics API
创建 `app/api/admin/analytics/route.ts`（仅 admin 可访问，检查 users.role='admin'）：

```typescript
// GET 返回：
{
  todaySignups: number,
  weekSignups: number,
  totalUsers: number,
  todayToolUses: number,
  weekToolUses: number,
  topTools: [{ tool_slug, count }], // top 10
  totalSubscriptions: number,
  todayPageViews: number,
}
// 从 analytics_events 表聚合查询
```

---

## Task 8：Admin Dashboard（/admin）

**路由保护**：所有 `/admin/*` 创建 `app/admin/layout.tsx`，检查 `users.role = 'admin'`，非 admin 重定向首页。

### 8-A：Overview（/admin）
创建 `app/admin/page.tsx`：
- 调用 `/api/admin/analytics`
- 显示统计卡片：Tools / Use-case Pages / Blog Posts / Users / MRR
- 快捷链接到各子页面

### 8-B：Tool Generator（/admin/tools）
创建 `app/admin/tools/page.tsx`：
- 显示 `tool_ideas` 表 status='pending' 的条目列表
- 每行：tool_name + description + toolkit_slug + Approve / Reject 按钮
- Approve：写入 `tools` 表（status='active'，auto_generated=true），更新 tool_ideas.status='approved'
- Reject：更新 tool_ideas.status='rejected'
- 顶部"Discover New Tools"按钮 → 调用 `/api/admin/generate-tool-ideas`

创建 `app/api/admin/generate-tool-ideas/route.ts`（仅 admin）：
- 调用 OpenAI 为每个 toolkit 生成 3 个工具 idea
- 检查 tools 表避免重复 slug
- 写入 tool_ideas 表

### 8-C：SEO Engine（/admin/seo）
创建 `app/admin/seo/page.tsx`：
- 统计卡片：Total keywords / Use-case pages / Pending keywords
- 三个操作按钮：
  - "Generate Keywords" → POST `/api/operator/discover-keywords`
  - "Generate Use-case Pages" → POST `/api/operator/generate-use-cases`（触发 generate-use-cases 逻辑）
  - "Rebuild Sitemap" → 提示用户访问 /sitemap.xml 触发重建

### 8-D：Blog Engine（/admin/blog）
创建 `app/admin/blog/page.tsx`：
- blog_posts 列表（title + published badge + created_at）
- 每行 Delete 按钮
- 顶部"Generate 5 Articles"按钮 → POST `/api/operator/generate-blog`

创建 `app/api/operator/generate-blog/route.ts`（仅 admin）：
- 取 seo_keywords 中 pending 的前 5 条
- AI 生成文章写入 blog_posts（published=true）
- 标记关键词为 used

### 8-E：Analytics（/admin/analytics）
创建 `app/admin/analytics/page.tsx`：
- 调用 `/api/admin/analytics`
- 显示：今日新用户、本周新用户、Top 10 工具使用排名、订阅数、今日 page views

### 8-F：Feedback 后台（/admin/feedback）
创建 `app/admin/feedback/page.tsx`：
- 显示 feedback 表所有条目
- 列：Tool | Rating | Type | Message | Date
- 默认按 created_at 降序

---

## Task 9：Auto Tool Generator 脚本

创建 `scripts/discover-tools.mjs`：

```javascript
// 功能：AI 为每个 toolkit 生成 3 个新工具 idea，写入 tool_ideas 表
// 检查 tools 表避免重复 slug
// 生成内容：tool_name, tool_slug, description, prompt_template, seo_title, seo_description, toolkit_slug
// 运行：node scripts/discover-tools.mjs
```

---

## Task 10：AI Operator Cron Jobs（独立路由）

根据文档要求，每个 operator 功能有独立的 cron 路由：

创建 `app/api/operator/discover-keywords/route.ts`：
- GET，验证 CRON_SECRET
- 为每个 toolkit AI 生成 20 个新 SEO 关键词写入 seo_keywords

创建 `app/api/operator/generate-tools/route.ts`：
- GET，验证 CRON_SECRET
- 调用 discover-tools 逻辑，写入 tool_ideas（等待 admin 审核）

创建 `app/api/operator/generate-blog/route.ts`（如 8-D 已创建则复用）：
- GET/POST，验证 CRON_SECRET 或 admin role
- 生成 3 篇博客文章

更新 `vercel.json`：
```json
{
  "crons": [
    { "path": "/api/operator/discover-keywords", "schedule": "0 2 * * *" },
    { "path": "/api/operator/generate-tools", "schedule": "0 3 * * *" },
    { "path": "/api/operator/generate-blog", "schedule": "0 4 * * *" }
  ]
}
```

Vercel 环境变量添加 `CRON_SECRET`（随机字符串）。

---

## Task 11：Sitemap + robots

创建/替换 `app/sitemap.ts`：
```typescript
// 包含：
// - 静态页面（/、/toolkits、/pricing、/blog、/features）
// - tools（从 tools 表，status='active'）
// - tool_use_cases（从 tool_use_cases 表）
// - blog_posts（从 blog_posts 表，published=true）
// 基础 URL：https://aitoolsstation.com
```

创建/替换 `app/robots.ts`：
```typescript
// disallow: /api/, /dashboard, /auth/, /admin
// sitemap: https://aitoolsstation.com/sitemap.xml
```

---

## 完成后执行

```bash
npm run type-check  # 必须 0 错误

git add .
git commit -m "feat: complete Phase 3-9 — SEO engine, blog, feedback, features, referral, analytics, admin panel, AI operator cron"
git push origin main
```

## 更新 CLAUDE.md

完成后在 CLAUDE.md 已完成模块列表添加：
```
- SPEC-10 ✅ AI Venture OS — Use-case SEO / Blog Engine / Feedback / Feature Voting / Referral / Analytics / Admin Panel / AI Operator Cron
```

并将待处理事项中的 SPEC-09 和剩余条目全部标记为 ✅ 完成。

同步更新 PROJECT_CONTEXT.md，记录所有新增模块和文件路径。
