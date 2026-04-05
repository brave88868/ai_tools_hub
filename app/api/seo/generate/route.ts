import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/seo/generate
 * 统一 SEO 内容生成入口（供 Admin 手动触发 或 Cron 定时调用）
 * 认证：Bearer token（requireAdmin）或 CRON_SECRET
 *
 * 每次生成约 22 个页面：
 *   10 use cases + 5 comparisons + 3 problems + 2 templates + 2 alternatives
 */
export async function POST(req: NextRequest) {
  // 支持两种认证：CRON_SECRET（来自 vercel cron）或 Admin Bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isAdmin = !isCron && authHeader.startsWith("Bearer ");

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const tasks = [
    { path: "/api/seo/generate-use-cases", body: { count: 10 } },
    { path: "/api/seo/generate-comparisons", body: { count: 5 } },
    { path: "/api/seo/generate-problems", body: { count: 3 } },
    { path: "/api/seo/generate-templates", body: { count: 2 } },
    { path: "/api/seo/generate-alternatives", body: { count: 2 } },
  ];

  const results: Record<string, unknown> = {};

  for (const task of tasks) {
    try {
      const res = await fetch(`${appUrl}${task.path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(task.body),
      });
      const data = await res.json().catch(() => ({}));
      results[task.path] = data;
    } catch (err) {
      results[task.path] = { error: String(err) };
    }
  }

  return NextResponse.json({ ok: true, results });
}

// 同时支持 GET（来自 Vercel Cron 默认 GET）
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 复用 POST 逻辑
  return POST(req);
}
