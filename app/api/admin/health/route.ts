import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export const dynamic = "force-dynamic";

interface HealthCheck {
  name: string;
  status: "ok" | "warn" | "error";
  value: string | number;
  detail?: string;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const supabase = createAdminClient();
  const checks: HealthCheck[] = [];
  const now = new Date();

  // ── 1. 数据库连接 ────────────────────────────────────────────────
  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    checks.push({
      name: "Database Connection",
      status: error ? "error" : "ok",
      value: error ? "Failed" : "Connected",
      detail: error?.message,
    });
    checks.push({
      name: "Users",
      status: "ok",
      value: count ?? 0,
    });
  } catch (e) {
    checks.push({ name: "Database Connection", status: "error", value: "Exception", detail: String(e) });
  }

  // ── 2. 核心表记录数 ──────────────────────────────────────────────
  const tables = [
    { key: "tools", label: "Tools", warnBelow: 1 },
    { key: "seo_pages", label: "SEO Pages", warnBelow: 10 },
    { key: "seo_keywords", label: "SEO Keywords", warnBelow: 0 },
    { key: "generated_examples", label: "Generated Examples", warnBelow: 0 },
    { key: "tool_templates", label: "Tool Templates", warnBelow: 0 },
    { key: "saas_projects", label: "SaaS Projects", warnBelow: 0 },
    { key: "blog_posts", label: "Blog Posts", warnBelow: 0 },
  ] as const;

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table.key)
        .select("*", { count: "exact", head: true });
      checks.push({
        name: table.label,
        status: error ? "error" : (count ?? 0) < table.warnBelow ? "warn" : "ok",
        value: error ? "Error" : (count ?? 0),
        detail: error?.message,
      });
    } catch {
      checks.push({ name: table.label, status: "warn", value: "N/A", detail: "Table may not exist" });
    }
  }

  // ── 3. 最近24小时新增 SEO 页面 ───────────────────────────────────
  try {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("seo_pages")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    checks.push({
      name: "SEO Pages (last 24h)",
      status: (count ?? 0) === 0 ? "warn" : "ok",
      value: count ?? 0,
      detail: (count ?? 0) === 0 ? "No new pages generated today" : undefined,
    });
  } catch {
    checks.push({ name: "SEO Pages (last 24h)", status: "warn", value: "N/A" });
  }

  // ── 4. 最近24小时 UGC Examples ───────────────────────────────────
  try {
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("generated_examples")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since);
    checks.push({
      name: "UGC Examples (last 24h)",
      status: "ok",
      value: count ?? 0,
    });
  } catch {
    checks.push({ name: "UGC Examples (last 24h)", status: "warn", value: "N/A" });
  }

  // ── 5. 环境变量检查 ──────────────────────────────────────────────
  const envChecks = [
    { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key" },
    { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase Service Key" },
    { key: "STRIPE_SECRET_KEY", label: "Stripe Secret Key" },
    { key: "CRON_SECRET", label: "Cron Secret" },
    { key: "ADMIN_EMAIL", label: "Admin Email" },
  ];

  for (const env of envChecks) {
    const exists = !!process.env[env.key];
    checks.push({
      name: env.label,
      status: exists ? "ok" : "warn",
      value: exists ? "Configured" : "Missing",
    });
  }

  // ── 6. Cron 最近执行（查 cron_logs 表，若不存在则跳过）──────────
  try {
    const { data: lastRun } = await supabase
      .from("cron_logs")
      .select("created_at, steps_completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastRun) {
      const hoursAgo = Math.floor(
        (now.getTime() - new Date(lastRun.created_at).getTime()) / (1000 * 60 * 60)
      );
      checks.push({
        name: "Last Cron Run",
        status: hoursAgo > 25 ? "warn" : "ok",
        value: `${hoursAgo}h ago`,
        detail: `Steps completed: ${lastRun.steps_completed}`,
      });
    }
  } catch {
    checks.push({ name: "Last Cron Run", status: "warn", value: "No data", detail: "cron_logs table may not exist" });
  }

  // ── 7. 系统信息 ──────────────────────────────────────────────────
  checks.push({
    name: "Environment",
    status: "ok",
    value: process.env.NODE_ENV || "unknown",
  });
  checks.push({
    name: "Server Time (UTC)",
    status: "ok",
    value: now.toISOString(),
  });
  checks.push({
    name: "Vercel URL",
    status: "ok",
    value: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_SITE_URL || "localhost",
  });

  const errorCount = checks.filter((c) => c.status === "error").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  return NextResponse.json({
    overall: errorCount > 0 ? "error" : warnCount > 0 ? "warn" : "ok",
    checked_at: now.toISOString(),
    error_count: errorCount,
    warn_count: warnCount,
    checks,
  });
}
