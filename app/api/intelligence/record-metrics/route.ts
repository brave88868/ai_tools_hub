import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowStart = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const tomorrowStartStr = `${tomorrowStart}T00:00:00.000Z`;

  // 1. MRR：从 subscriptions 取 active 订阅，JOIN toolkits 取价格
  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("toolkit_slug")
    .eq("status", "active");

  let mrr = 0;
  if (activeSubs && activeSubs.length > 0) {
    const slugs = [...new Set(activeSubs.map((s: { toolkit_slug: string }) => s.toolkit_slug))];
    const { data: toolkitPrices } = await admin
      .from("toolkits")
      .select("slug, price_monthly")
      .in("slug", slugs);

    const priceMap = new Map<string, number>(
      (toolkitPrices ?? []).map((t: { slug: string; price_monthly: number }) => [t.slug, t.price_monthly ?? 0])
    );

    for (const sub of activeSubs) {
      mrr += priceMap.get(sub.toolkit_slug) ?? 9;
    }
  }

  // 2. 今日新注册用户数
  const { count: newUsers } = await admin
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart)
    .lt("created_at", tomorrowStartStr);

  // 3. 今日 tool_use 总数
  const { count: toolUses } = await admin
    .from("analytics_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "tool_use")
    .gte("created_at", todayStart)
    .lt("created_at", tomorrowStartStr);

  // 4. 写入 revenue_metrics 表（4条记录）
  const now = new Date().toISOString();
  await admin.from("revenue_metrics").insert([
    { metric: "mrr", value: mrr, recorded_at: now },
    { metric: "new_users", value: newUsers ?? 0, recorded_at: now },
    { metric: "tool_uses", value: toolUses ?? 0, recorded_at: now },
    { metric: "date_marker", value: 1, recorded_at: now },
  ]);

  const metrics = {
    mrr,
    new_users: newUsers ?? 0,
    tool_uses: toolUses ?? 0,
    recorded_at: now,
  };

  return NextResponse.json({ metrics });
}
