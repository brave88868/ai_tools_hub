# SPEC: 全平台审计 + 全自动化修复

**版本**: v1.0
**项目路径**: `E:\Projects\ai_tools_hub`
**目标**: 审计并修复平台，使其达到"零人工干预自动运营"状态
**执行语言**: 中文

---

## ⚡ Claude Code 执行指令

```
读取 CLAUDE.md 和 PROJECT_CONTEXT.md。
然后读取 SPEC-PLATFORM-AUDIT.md，按顺序执行所有审计和修复任务。
每完成一个 CHECKPOINT 后输出审计报告并暂停等待确认。
中文回复。
```

---

## 审计目标

平台最终应实现以下全自动循环：

```
每日 Cron（6am UTC）
  ↓
市场扫描 → 发现机会
  ↓
自动生成工具 / SaaS 产品
  ↓
自动生成 SEO 页面（use-cases / comparisons / alternatives / how-to / ai-for）
  ↓
自动写博客文章
  ↓
自动发布 + Sitemap ping
  ↓
Google 收录 → 流量
  ↓
用户使用工具 → 生成 UGC Examples
  ↓
更多 SEO 页面 → 更多流量（飞轮）
```

---

## AUDIT 1: 用户权限与付款系统

### 1.1 检查用户权限层级

执行以下数据库查询（通过 Supabase 客户端）：

```typescript
// 检查 users 表结构
const { data: userSample } = await supabase
  .from('users')
  .select('id, email, role, plan, usage_count, usage_limit, bonus_uses')
  .limit(5);

// 检查是否有 usage_events 表
const { count: eventCount } = await supabase
  .from('usage_events')
  .select('*', { count: 'exact', head: true });

// 检查 subscriptions 表
const { data: subSample } = await supabase
  .from('subscriptions')
  .select('*')
  .limit(3);
```

**验证点**：
- [ ] Free 用户每日限制 3 次是否生效
- [ ] Pro 用户解锁无限制
- [ ] usage_count 在每次工具使用后正确递增
- [ ] 付款后 plan 字段正确更新为 'pro'

检查文件：
- `app/api/tools/generate/route.ts` 或类似的工具调用 API
- `lib/usage.ts` 或类似的使用量追踪逻辑
- `app/api/webhooks/stripe/route.ts`

**报告格式**：
```
用户权限系统：
- Free 限制逻辑：[存在/缺失/有bug]
- Pro 验证逻辑：[存在/缺失/有bug]
- usage 追踪：[正常/异常]
- Stripe webhook：[存在/缺失/有bug]
```

---

### 1.2 检查 Stripe 付款流程

检查文件：
- `app/api/webhooks/stripe/route.ts`
- `app/api/stripe/` 目录下所有文件
- `app/pricing/page.tsx`

**验证点**：
- [ ] checkout.session.completed 事件处理
- [ ] 付款成功后 users.plan 更新为 'pro'
- [ ] subscription 记录写入 subscriptions 表
- [ ] 取消订阅时降回 free

如果 webhook 处理有问题，修复。

---

## AUDIT 2: 全自动化系统检查

### 2.1 检查 Daily Cron 完整性

读取 `app/api/cron/daily/route.ts` 完整内容，检查每个步骤：

| 步骤 | 功能 | 是否有效 |
|------|------|---------|
| Step 1 | Market Scan | ? |
| Step 2 | Opportunity Score | ? |
| Step 3 | SEO Bulk Generate | ? |
| Step 4 | Blog Generation | ? |
| Step 5 | Startup Generation | ? |
| Step 6 | Page Optimize | ? |
| Step 7 | Record Metrics | ? |
| Step 8 | Sitemap Ping | ? |
| Step 9 | Template Generation (Mon) | ? |
| Step 10 | Examples Cleanup (1st) | ? |
| Step 11 | Prompts Generation (Tue) | ? |

**检查每个步骤的子 API 是否真正有效**：
```bash
grep -r "PLACEHOLDER\|TODO\|stub\|mock\|fake" app/api/intelligence/ app/api/operator/ --include="*.ts"
```

如果某个步骤是空实现或 stub，标记为"需要实现"。

---

### 2.2 检查 SEO 自动生成是否真正工作

```typescript
// 检查 seo_pages 最近生成情况
const { data: recentPages } = await supabase
  .from('seo_pages')
  .select('type, created_at')
  .order('created_at', { ascending: false })
  .limit(20);

// 检查各类型分布
const { data: typeCount } = await supabase
  .rpc('count_by_type'); // 如果有的话，否则用 group by
```

**期望**：每天 Cron 运行后应新增约 27 页（10 use-cases + 5 comparisons + 3 problems + 2 templates + 2 alternatives + 5 ai-for）

---

### 2.3 检查博客自动生成

读取 `app/api/operator/generate-blog/route.ts`（或类似文件）

**验证**：
- [ ] 博客生成 API 是否真正调用 OpenAI 生成内容
- [ ] 生成的博客是否写入 blog_posts 表并 published=true
- [ ] 博客页面是否有 `/blog/[slug]` 路由

如果博客生成是空实现，修复为真正用 OpenAI 生成博客文章。

---

### 2.4 检查 Auto Tool Generator

读取以下文件：
- `app/api/operator/generate-startup/route.ts`
- `app/api/operator/` 目录

**验证**：
- [ ] 是否真正能自动生成新工具
- [ ] 生成的工具是否出现在 tools 表
- [ ] 是否有对应的前端页面路由

---

### 2.5 检查 Vercel Cron 配置

读取 `vercel.json`（或 `next.config.ts` 中的 cron 配置）：

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**如果 vercel.json 不存在或没有 cron 配置，创建它**：

```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ]
}
```

没有这个配置，cron 永远不会自动触发！

---

## AUDIT 3: 盈利结构检查

### 3.1 检查变现路径完整性

```
Free (3次/天) → 升级提示 → Pro 订阅 → Stripe 付款 → plan='pro' → 无限使用
```

检查每个环节：

**A. 升级提示是否存在**
```bash
grep -r "UpgradeCTA\|upgrade\|pricing\|Pro plan" app/tools/ --include="*.tsx" -l
```

**B. Pricing 页面是否正确**
读取 `app/pricing/page.tsx`，确认价格和 Stripe checkout 链接正确。

**C. 邮件捕获是否工作**
```bash
grep -r "EmailCapture\|email.*capture\|subscribe" app/ --include="*.tsx" -l
```

**D. Referral 奖励是否真正生效**
检查 `app/api/referral/` 下的逻辑，确认邀请成功后 bonus_uses 真正增加。

---

### 3.2 检查收入追踪

检查是否有收入指标记录：
```typescript
const { data: metrics } = await supabase
  .from('revenue_metrics')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);
```

如果 revenue_metrics 表不存在或没有数据，检查 Step 7（Record Metrics）是否真正执行。

---

## AUDIT 4: 自动化缺口修复

根据 Audit 1-3 的结果，按优先级修复以下可能存在的问题：

### 4.1 如果 vercel.json 缺少 cron 配置（P0）

创建 `vercel.json`：
```json
{
  "crons": [
    {
      "path": "/api/cron/daily",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### 4.2 如果博客生成是 stub（P1）

在 `app/api/operator/generate-blog/route.ts` 中实现真正的博客生成：

```typescript
// 用 OpenAI 生成博客文章
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{
    role: "user",
    content: `Write a comprehensive blog post about "${topic}" for an AI tools platform.
    
    Requirements:
    - Title: SEO-optimized, under 60 chars
    - Length: 600-800 words
    - Structure: intro, 3-4 sections with H2 headings, conclusion
    - Include practical tips and examples
    - Mention AI tools naturally
    
    Return JSON only:
    {
      "title": "...",
      "slug": "...",
      "content": "... (markdown)",
      "meta_description": "...",
      "keywords": ["kw1", "kw2", "kw3"]
    }`
  }],
});
```

### 4.3 如果 Sitemap Ping 没有实际 Google 通知（P1）

检查 `/api/seo/ping/route.ts`，确认它真正 ping 了：
```
https://www.google.com/ping?sitemap=https://aitoolsstation.com/sitemap-index.xml
```

### 4.4 如果 Market Intelligence 步骤是空的（P2）

检查 `/api/intelligence/scan-market/route.ts`，如果是 stub，实现基础版本：
- 从 growth_keywords 表取最近关键词
- 用 OpenAI 评分机会
- 写入 market_signals 表

---

## CHECKPOINT: 审计报告

完成所有审计后，输出以下格式的完整报告：

```
==========================================
AI Tools Hub 全平台审计报告
==========================================
审计时间: [时间]

【用户权限系统】
- Free 限制: ✅/❌
- Pro 验证: ✅/❌  
- Stripe webhook: ✅/❌
- Referral 奖励: ✅/❌

【全自动化系统】
- Vercel Cron 配置: ✅/❌
- Daily Cron 步骤完整性: X/11 步有效
- SEO 自动生成: ✅/❌ (最近24h生成: N页)
- 博客自动生成: ✅/❌ (实现/stub)
- Auto Tool Generator: ✅/❌
- Sitemap 自动 ping: ✅/❌
- UGC Examples 自动触发: ✅/❌

【盈利结构】
- Free→Pro 转化路径: ✅/❌
- Stripe 付款: ✅/❌
- 邮件捕获: ✅/❌
- 收入追踪: ✅/❌

【需要修复的问题】（按优先级）
P0: [列表]
P1: [列表]
P2: [列表]

【自动化完成度评分】
X / 100
==========================================
```

然后按优先级修复所有 P0 和 P1 问题，git commit + push。

---

## 全自动化标准（通过标准）

平台达到以下标准视为"全自动化"：

| 功能 | 标准 |
|------|------|
| SEO 页面生成 | 每天自动生成 20+ 页，无需人工 |
| 博客生成 | 每天自动发布 1-2 篇，无需人工 |
| Sitemap 更新 | 每次生成后自动 ping Google |
| 用户使用追踪 | 每次工具调用自动记录 |
| UGC Examples | 每次用户生成内容自动创建 SEO 页面 |
| 付款处理 | Stripe webhook 自动升级用户 plan |
| 指标记录 | 每天自动记录收入/用量指标 |
| Cron 触发 | vercel.json 配置每天 6am UTC 自动触发 |

**所有 8 项通过 = 全自动化平台** ✅

---

*SPEC 版本: v1.0 | 2026-04-05*
