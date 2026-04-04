# SPEC-09: Programmatic SEO Engine
**Project**: AI Tools Station (aitoolsstation.com)  
**Phase**: 3 — Organic Growth  
**Status**: 🔲 Not Started  
**Depends on**: SPEC-01 ~ SPEC-08 ✅  
**Last Updated**: 2026-04-04

---

## 1. 目标 / Objectives

通过程序化生成 10,000+ 页面，覆盖 AI 工具相关的长尾关键词，实现：
- 免费自然流量持续增长
- 每页独立可索引、内容不重复
- 支持未来扩展（新工具、新 Toolkit、新语言）

**目标 KPI（上线后 6 个月）**：
| 指标 | 目标 |
|------|------|
| 程序化页面数 | ≥ 10,000 |
| Google 收录率 | ≥ 60% |
| 自然流量月增速 | ≥ 20% |
| 核心页面 CTR | ≥ 3% |

---

## 2. 页面类型与 URL 结构

```
/tools/[slug]                          → 单工具详情页（已有，需 SEO 强化）
/toolkit/[category]                    → Toolkit 分类页（已有，需 SEO 强化）
/use-case/[use-case-slug]              → 场景页（新增）
/compare/[tool-a]-vs-[tool-b]          → 对比页（新增）
/alternatives/[tool-slug]              → 替代品页（新增）
/blog/[slug]                           → 博客/指南（新增，AI 生成）
/free-ai-tools/[category]              → 免费工具列表页（新增）
/ai-tools-for/[profession-or-task]     → 职业/任务聚合页（新增）
```

**总页面量估算**：
| 类型 | 数量 |
|------|------|
| 工具详情（强化） | 70 |
| Toolkit 分类 | 6 |
| 场景页 | ~200 |
| 对比页 | ~500（TOP 工具两两组合）|
| 替代品页 | ~70 |
| 职业/任务聚合 | ~100 |
| 博客指南 | ~200（逐步生成）|
| **合计** | **~1,150 起步，扩展至 10,000+** |

---

## 3. 数据层设计

### 3.1 数据文件位置
```
/data/seo/
  tools.json              ← 70个工具完整元数据
  toolkits.json           ← 6个分类元数据
  use-cases.json          ← 200个使用场景
  comparisons.json        ← 对比页配置（tool pairs）
  professions.json        ← 职业/任务列表
  blog-topics.json        ← 博客选题库（AI批量生成后存储）
```

### 3.2 工具元数据结构（tools.json）
```typescript
interface ToolMeta {
  slug: string;               // e.g. "chatgpt"
  name: string;               // e.g. "ChatGPT"
  tagline: string;            // 60字以内，含关键词
  description: string;        // 150字，用于 meta description
  longDescription: string;    // 500字+，页面主体内容
  category: string;           // toolkit slug
  tags: string[];             // 功能标签
  useCases: string[];         // 关联的 use-case slugs
  relatedTools: string[];     // 同类工具 slugs（用于对比/替代）
  pricing: "free" | "freemium" | "paid";
  url: string;                // 官网链接
  features: string[];         // 5~10个特性（用于结构化数据）
  faqs: { q: string; r: string }[];  // FAQ（5条，用于 FAQ Schema）
  lastUpdated: string;        // ISO date
}
```

### 3.3 场景数据结构（use-cases.json）
```typescript
interface UseCaseMeta {
  slug: string;               // e.g. "write-blog-post-with-ai"
  title: string;              // e.g. "Write a Blog Post with AI"
  h1: string;                 // 页面 H1
  metaDescription: string;
  intro: string;              // 100字引言
  recommendedTools: string[]; // 推荐工具 slugs（排序）
  steps: string[];            // 使用步骤（用于 HowTo Schema）
  faqs: { q: string; r: string }[];
}
```

---

## 4. 页面模板规范

### 4.1 工具详情页强化（/tools/[slug]）

**当前问题**：缺少结构化数据、内链、FAQ 区块  
**新增内容**：
- `<head>` 中注入 `Product` + `FAQPage` Schema
- 页面底部增加"Related Tools"（4张卡片）
- 页面底部增加"Use Cases for [Tool Name]"（6个场景链接）
- FAQ 折叠区块（5条）
- 面包屑导航：`Home > [Toolkit] > [Tool Name]`

### 4.2 场景页（/use-case/[slug]）

```
布局：
┌─────────────────────────────────────────┐
│ 面包屑：Home > Use Cases > [Title]       │
│ H1: [Title]                              │
│ 引言段落（100字）                         │
│                                          │
│ 推荐工具卡片列表（Top 3~5）              │
│   - 工具名 + 一句话描述 + CTA按钮        │
│                                          │
│ 使用步骤（HowTo Schema）                  │
│                                          │
│ FAQ 区块（5条）                           │
│                                          │
│ 相关场景链接（6个）                       │
└─────────────────────────────────────────┘
```

Schema 注入：`HowTo` + `FAQPage`

### 4.3 对比页（/compare/[a]-vs-[b]）

```
布局：
┌─────────────────────────────────────────┐
│ H1: [Tool A] vs [Tool B]: Which is       │
│     Better in 2025?                      │
│                                          │
│ 快速结论卡片（推荐哪个）                 │
│                                          │
│ 对比表格                                 │
│   特性 | Tool A | Tool B                │
│   定价 | ...    | ...                   │
│   适合人群 | ... | ...                  │
│                                          │
│ 详细分析（各300字）                      │
│                                          │
│ FAQ（5条）                               │
│                                          │
│ 相关对比推荐（4个）                      │
└─────────────────────────────────────────┘
```

Schema 注入：`FAQPage` + `BreadcrumbList`

### 4.4 职业/任务聚合页（/ai-tools-for/[slug]）

示例 URL：`/ai-tools-for/content-writers`  
示例 URL：`/ai-tools-for/video-editing`

```
布局：
┌─────────────────────────────────────────┐
│ H1: Best AI Tools for [Profession/Task] │
│     in 2025                              │
│                                          │
│ 简介（80字）                             │
│                                          │
│ 工具卡片列表（6~10个）                   │
│   带评分、标签、描述                     │
│                                          │
│ 为什么需要 AI 工具（200字正文）          │
│                                          │
│ FAQ（5条）                               │
│                                          │
│ 相关聚合页链接                           │
└─────────────────────────────────────────┘
```

---

## 5. SEO 技术实现

### 5.1 Metadata 生成（Next.js generateMetadata）

```typescript
// app/use-case/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const uc = getUseCase(params.slug);
  return {
    title: `${uc.title} | AI Tools Station`,
    description: uc.metaDescription,
    alternates: { canonical: `https://aitoolsstation.com/use-case/${params.slug}` },
    openGraph: {
      title: uc.title,
      description: uc.metaDescription,
      type: "article",
    },
  };
}
```

### 5.2 静态路径生成（generateStaticParams）

所有程序化页面使用 `generateStaticParams` 实现 SSG（Static Site Generation），确保：
- 构建时预渲染所有页面
- 无冷启动延迟
- 完整 HTML 供爬虫抓取

```typescript
export async function generateStaticParams() {
  const useCases = await getUseCases(); // 读取 JSON
  return useCases.map(uc => ({ slug: uc.slug }));
}
```

### 5.3 Sitemap 自动生成

文件：`app/sitemap.ts`

```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tools = await getTools();
  const useCases = await getUseCases();
  const comparisons = await getComparisons();
  // ...组合所有 URL，设置 lastModified + priority + changeFrequency
}
```

Priority 配置：
| 页面类型 | priority | changeFrequency |
|----------|----------|-----------------|
| 首页 | 1.0 | weekly |
| Toolkit 分类 | 0.9 | weekly |
| 工具详情 | 0.8 | monthly |
| 对比页 | 0.7 | monthly |
| 场景页 | 0.7 | monthly |
| 聚合页 | 0.7 | monthly |
| 博客 | 0.6 | monthly |

### 5.4 robots.txt

文件：`app/robots.ts`

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://aitoolsstation.com/sitemap.xml",
  };
}
```

### 5.5 结构化数据工具函数

文件：`lib/seo/schemas.ts`

```typescript
export function faqSchema(faqs: { q: string; r: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.r },
    })),
  };
}

export function howToSchema(title: string, steps: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s,
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
```

---

## 6. AI 内容批量生成流程

### 6.1 批量生成脚本（scripts/generate-seo-content.ts）

使用 Claude API（claude-sonnet-4-20250514）批量生成内容，结果写入 JSON 文件。

```typescript
// scripts/generate-seo-content.ts
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic();

async function generateUseCaseContent(topic: string): Promise<UseCaseMeta> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Generate SEO content for an AI tools use case page.
Topic: "${topic}"
Return ONLY valid JSON with this structure:
{
  "slug": "kebab-case-slug",
  "title": "...",
  "h1": "...",
  "metaDescription": "max 155 chars, include 'AI tools'",
  "intro": "100 word intro paragraph",
  "steps": ["step1", "step2", "step3", "step4", "step5"],
  "faqs": [{"q":"...","r":"..."},{"q":"...","r":"..."},{"q":"...","r":"..."},{"q":"...","r":"..."},{"q":"...","r":"..."}]
}`
    }],
  });
  const text = (response.content[0] as any).text;
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// 批量处理，每次 10 条，避免 rate limit
async function batchGenerate(topics: string[]) {
  const results = [];
  for (let i = 0; i < topics.length; i += 10) {
    const batch = topics.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(generateUseCaseContent));
    results.push(...batchResults);
    await new Promise(r => setTimeout(r, 2000)); // 2s 间隔
  }
  fs.writeFileSync("data/seo/use-cases.json", JSON.stringify(results, null, 2));
}
```

### 6.2 内容生成优先级

**第一批（立即生成，~200个场景）**：
```
write-blog-post-with-ai
ai-for-social-media-marketing  
ai-resume-builder
ai-email-writing
ai-code-review
ai-image-generation
ai-video-script-writing
ai-customer-support
ai-data-analysis
ai-language-translation
... (完整列表见 data/seo/topics-seed.json)
```

**第二批（对比页，~100个高价值组合）**：
```
chatgpt-vs-claude
midjourney-vs-dall-e
notion-ai-vs-chatgpt
github-copilot-vs-cursor
... 
```

---

## 7. 内链策略

### 7.1 内链规则
- 每个工具详情页 → 链接到 3~5 个相关场景页
- 每个场景页 → 链接到 3~5 个推荐工具
- 每个对比页 → 链接到两个工具的详情页 + 2个相关对比页
- 首页新增"Popular Use Cases"区块（6个）
- Toolkit 分类页新增"Top Use Cases in [Category]"

### 7.2 内链组件

```typescript
// components/seo/RelatedLinks.tsx
interface RelatedLinksProps {
  type: "tools" | "use-cases" | "comparisons";
  items: { href: string; label: string; description?: string }[];
  heading: string;
}
```

---

## 8. 文件结构

```
app/
  use-case/
    [slug]/
      page.tsx              ← 场景页模板
  compare/
    [pair]/
      page.tsx              ← 对比页模板
  alternatives/
    [slug]/
      page.tsx              ← 替代品页模板
  ai-tools-for/
    [slug]/
      page.tsx              ← 聚合页模板
  sitemap.ts                ← 自动 sitemap
  robots.ts                 ← robots.txt

data/
  seo/
    tools.json
    use-cases.json
    comparisons.json
    professions.json

lib/
  seo/
    schemas.ts              ← 结构化数据工具函数
    metadata.ts             ← generateMetadata 工具函数
    loaders.ts              ← JSON 数据读取函数

scripts/
  generate-seo-content.ts   ← AI 批量内容生成
  validate-seo-data.ts      ← 数据校验脚本

components/
  seo/
    RelatedLinks.tsx
    FAQSection.tsx
    Breadcrumb.tsx
    ComparisonTable.tsx
    ToolCard.tsx             ← 已有，复用
```

---

## 9. 实施步骤（Tasks）

### Step 1：数据层建立 ⬜
- [ ] 创建 `data/seo/` 目录
- [ ] 整理 70 个工具元数据到 `tools.json`（含 faqs、useCases 字段）
- [ ] 手写 20 个高优先级场景到 `use-cases.json`（作为模板）
- [ ] 创建 `lib/seo/loaders.ts`（JSON 读取函数）

### Step 2：结构化数据工具 ⬜
- [ ] 创建 `lib/seo/schemas.ts`（faqSchema、howToSchema、breadcrumbSchema）
- [ ] 工具详情页注入 FAQPage + Product Schema
- [ ] 创建 `components/seo/FAQSection.tsx`
- [ ] 创建 `components/seo/Breadcrumb.tsx`

### Step 3：场景页 ⬜
- [ ] 创建 `app/use-case/[slug]/page.tsx`
- [ ] generateStaticParams + generateMetadata
- [ ] 页面布局（推荐工具 + 步骤 + FAQ + 相关场景）
- [ ] 测试 5 个场景页正常渲染

### Step 4：对比页 ⬜
- [ ] 创建 `data/seo/comparisons.json`（50个初始组合）
- [ ] 创建 `app/compare/[pair]/page.tsx`
- [ ] `components/seo/ComparisonTable.tsx`
- [ ] 测试 3 个对比页

### Step 5：聚合页 ⬜
- [ ] 创建 `data/seo/professions.json`（50个初始职业/任务）
- [ ] 创建 `app/ai-tools-for/[slug]/page.tsx`
- [ ] 测试 5 个聚合页

### Step 6：Sitemap + robots ⬜
- [ ] `app/sitemap.ts` 覆盖所有页面类型
- [ ] `app/robots.ts`
- [ ] 验证 `/sitemap.xml` 输出正确

### Step 7：AI 批量内容生成 ⬜
- [ ] 创建 `scripts/generate-seo-content.ts`
- [ ] 创建 `data/seo/topics-seed.json`（200个选题）
- [ ] 本地运行，生成并验证 200 个场景
- [ ] 运行 `scripts/validate-seo-data.ts` 校验数据完整性

### Step 8：内链强化 ⬜
- [ ] 工具详情页底部增加"Related Use Cases"
- [ ] 首页新增"Popular Use Cases"区块（6个入口）
- [ ] Toolkit 分类页增加场景入口

### Step 9：Google Search Console 配置 ⬜
- [ ] 提交 sitemap.xml
- [ ] 验证结构化数据（Google Rich Results Test）
- [ ] 监控收录进度

---

## 10. 断点恢复块（Breakpoint Recovery）

> **Claude Code 会话恢复说明**  
> 如果 SPEC-09 实施被中断，下次会话按以下顺序确认进度，然后继续：

```
RECOVERY_CHECK:
1. 检查 data/seo/ 目录是否存在 → 确认 Step 1 状态
2. 检查 lib/seo/schemas.ts 是否存在 → 确认 Step 2 状态
3. 检查 app/use-case/ 目录是否存在 → 确认 Step 3 状态
4. 检查 app/compare/ 目录是否存在 → 确认 Step 4 状态
5. 检查 app/sitemap.ts 是否存在 → 确认 Step 6 状态
6. 检查 data/seo/use-cases.json 条目数 → 确认 Step 7 状态
从第一个未完成的 Step 继续，不重复已完成工作。
```

---

## 11. 验收标准（Acceptance Criteria）

- [ ] `/sitemap.xml` 包含所有程序化页面 URL
- [ ] Google Rich Results Test 验证：FAQPage Schema ✅
- [ ] Lighthouse SEO 分数 ≥ 90（任意场景页）
- [ ] 场景页、对比页、聚合页各 5 个正常渲染，内容不重复
- [ ] 所有页面有正确的 `<title>`、`<meta description>`、`canonical`
- [ ] 构建时间增量 < 2 分钟（Vercel 构建）
- [ ] 无 `console.error` 关于缺失 key 或 undefined slug

---

## 附录：关键词研究（初始种子）

**高流量长尾关键词（月搜量 1K~10K）**：
```
best ai tools for students
free ai writing tools
ai tools for content creators
chatgpt alternatives
ai image generator free
best ai tools for marketing
ai tools for small business
midjourney vs dall-e
ai resume builder free
best ai coding tools
```

**对比页关键词（月搜量 500~5K）**：
```
chatgpt vs claude
github copilot vs cursor
notion ai vs chatgpt
midjourney vs stable diffusion
copy ai vs jasper
```

这些关键词应优先出现在：H1、首段、FAQ 问题、meta description 中。
