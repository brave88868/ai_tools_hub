# SPEC-05 — Pricing Page + Blog Page（修正版）

## 断点恢复说明
如果中断，检查以下文件是否完成：
- app/pricing/page.tsx
- app/blog/page.tsx
从未完成的继续，不重写已完成的。

---

## 定价模型（必须严格按此实现）

```
Free Plan（$0）：
- 3 generations/day
- 30 lifetime uses total
- All 50+ tools available
- No account required

Per-Toolkit Subscription（付费）：
- 每个 Toolkit 独立订阅，价格从数据库 toolkits.price_monthly 读取
- 所有工具可用（该 toolkit 内）
- 每日使用次数上限由后台控制，前端不展示任何数字
- Cancel anytime
```

⚠️ 重要约束：
1. 前端 Pricing 页面**不显示**付费用户每日次数限制（100次/天只在 admin 后台可见可改）
2. 每个 toolkit 价格从数据库读取，不硬编码
3. per-toolkit 订阅保留，未来可在 admin 后台逐个修改价格
4. 全自动化：价格改了数据库，页面自动更新，无需改代码

---

## 文件 1：app/pricing/page.tsx

服务端组件，从 Supabase toolkits 表加载价格数据。

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Pricing | AI Tools Hub",
  description:
    "Simple pricing for AI Tools Hub. Start free or subscribe to any AI toolkit. Each toolkit is billed separately.",
};

export default async function PricingPage() {
  const supabase = createServerClient();

  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("slug, name, description, price_monthly, icon, id")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple Pricing</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Start for free. Subscribe to the toolkit you need — pay only for what you use.
        </p>
      </div>

      {/* Free Plan */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Free Plan</h2>
              <p className="text-gray-400 text-sm">No account required. No credit card needed.</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm ml-1">/month</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Daily generations", value: "3/day" },
              { label: "Lifetime uses", value: "30 total" },
              { label: "Tools available", value: "All 50+" },
              { label: "Credit card", value: "Not required" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm font-semibold text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/toolkits"
              className="inline-block border border-gray-300 text-gray-700 rounded-xl px-6 py-2.5 text-sm font-medium hover:border-gray-500 transition-colors"
            >
              Start for Free →
            </Link>
          </div>
        </div>
      </div>

      {/* Toolkit Subscriptions */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toolkit Subscriptions</h2>
          <p className="text-gray-500 text-sm">
            Subscribe to any toolkit independently. Each subscription gives you unlimited daily access to all tools in that toolkit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(toolkits ?? []).map((kit) => (
            <div
              key={kit.slug}
              className="border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-3">{kit.icon}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">{kit.description}</p>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">${kit.price_monthly}</span>
                  <span className="text-xs text-gray-400 ml-1">/month</span>
                </div>
                <Link
                  href="/login"
                  className="text-xs bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Subscribe
                </Link>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All tools in this toolkit</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All future tools included</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Cancel anytime</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-2xl mx-auto mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Free vs Subscribed</h2>
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-gray-600 font-medium">Feature</th>
                <th className="text-center px-6 py-4 text-gray-600 font-medium">Free</th>
                <th className="text-center px-6 py-4 text-gray-900 font-semibold">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Daily generations", "3/day", "Unlimited"],
                ["Lifetime uses", "30 total", "Unlimited"],
                ["All AI tools", "✓", "✓"],
                ["Future tools", "✓", "✓"],
                ["Priority processing", "—", "✓"],
                ["Account required", "No", "Yes"],
                ["Cancel anytime", "—", "✓"],
              ].map(([feature, free, pro]) => (
                <tr key={feature}>
                  <td className="px-6 py-4 text-gray-600">{feature}</td>
                  <td className="px-6 py-4 text-center text-gray-500">{free}</td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Do I need a credit card for the free plan?",
              a: "No. You can start using any AI tool immediately — no account or credit card needed.",
            },
            {
              q: "Can I subscribe to just one toolkit?",
              a: "Yes. Each toolkit is billed separately. Subscribe only to what you need.",
            },
            {
              q: "What happens when I reach the free limit?",
              a: "You'll see an upgrade prompt. You can subscribe to any toolkit to continue.",
            },
            {
              q: "Do I get access to all tools in a toolkit?",
              a: "Yes. A toolkit subscription includes all current and future tools in that toolkit.",
            },
            {
              q: "Will more tools be added?",
              a: "Yes. New tools are added regularly and automatically included in your subscription.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel anytime from your dashboard. No contracts, no questions asked.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
```

---

## 文件 2：app/blog/page.tsx

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Blog | AI Tools Hub",
  description:
    "AI tool guides, tips, and tutorials. Learn how to use AI tools for resume optimization, content creation, marketing, and more.",
};

export default async function BlogPage() {
  const supabase = createServerClient();

  const { data: articles } = await supabase
    .from("seo_pages")
    .select("slug, title, meta_description, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(20);

  const hasArticles = articles && articles.length > 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
        <p className="text-gray-500">AI tool guides, tips, and tutorials.</p>
      </div>

      {hasArticles ? (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="block border border-gray-200 rounded-xl p-6 hover:border-gray-400 hover:shadow-sm transition-all group"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-black">
                {article.title}
              </h2>
              {article.meta_description && (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
                  {article.meta_description}
                </p>
              )}
              {article.published_at && (
                <span className="text-xs text-gray-400">
                  {new Date(article.published_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-6">
            AI tool guides and tutorials are being generated automatically. This section will include articles on:
          </p>
          <ul className="text-sm text-gray-400 space-y-1 mb-8">
            <li>Resume optimization tips</li>
            <li>Content creation with AI</li>
            <li>Marketing automation guides</li>
            <li>AI productivity workflows</li>
          </ul>
          <Link
            href="/toolkits"
            className="inline-block bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Explore AI Tools →
          </Link>
        </div>
      )}
    </main>
  );
}
```

---

## 文件 3：确认 /api/tools/run 权限逻辑

检查 app/api/tools/run/route.ts，确认符合以下规则并修正：

```
未登录用户（session_id 追踪）：
- 今天记录数 >= 3 → 返回 free_limit_reached
- 总记录数 >= 30 → 返回 lifetime_limit_reached

已登录未付费用户（无 active subscription）：
- 今天记录数 >= 3 → 返回 free_limit_reached
- 总记录数 >= 30 → 返回 lifetime_limit_reached

已登录付费用户（subscriptions 表有 active 记录）：
- 今天记录数 >= 100 → 返回 daily_limit_reached
  （此数字只在后台可见可改，前端不展示）
- 无总次数限制

所有工具对所有用户可用，不按 toolkit 锁定工具访问权限。
付费只提升使用次数上限。
```

---

## 执行顺序

```
1. 实现 app/pricing/page.tsx（从数据库读取 toolkit 价格）
2. 实现 app/blog/page.tsx
3. 检查并修正 /api/tools/run 权限逻辑
4. npm run type-check → 0 错误
5. 更新 PROJECT_CONTEXT.md
```

## 验证

```
http://localhost:3000/pricing → Free plan 说明 + 5个 toolkit 卡片（价格从DB读取）+ 对比表 + FAQ
http://localhost:3000/blog    → Coming Soon（无文章时）
```
