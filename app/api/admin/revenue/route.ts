import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;

  // --- Supabase: active subscriptions with toolkit prices ---
  const { data: activeSubs } = await admin
    .from("subscriptions")
    .select("id, toolkit_slug, status, created_at, toolkits(name, price_monthly)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // --- Supabase: recent 5 records (all statuses) ---
  const { data: recentSubs } = await admin
    .from("subscriptions")
    .select("id, toolkit_slug, status, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(5);

  // --- Toolkit breakdown ---
  const toolkitMap: Record<string, { name: string; count: number; price: number }> = {};
  for (const sub of activeSubs ?? []) {
    const tk = sub.toolkits as unknown as { name: string; price_monthly: number } | null;
    const slug = sub.toolkit_slug;
    if (!toolkitMap[slug]) {
      toolkitMap[slug] = {
        name: tk?.name ?? slug,
        count: 0,
        price: Number(tk?.price_monthly ?? 0),
      };
    }
    toolkitMap[slug].count++;
  }

  const toolkitBreakdown = Object.entries(toolkitMap)
    .map(([slug, data]) => ({
      slug,
      name: data.name,
      count: data.count,
      price: data.price,
      subtotal: data.count * data.price,
    }))
    .sort((a, b) => b.count - a.count);

  // --- MRR ---
  const mrr = toolkitBreakdown.reduce((sum, t) => sum + t.subtotal, 0);
  const activeCount = (activeSubs ?? []).length;

  // --- This month revenue (new subscriptions this calendar month) ---
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const thisMonthCount = (activeSubs ?? []).filter(
    (s) => s.created_at >= thisMonthStart
  ).length;
  const avgPrice = activeCount > 0 ? mrr / activeCount : 0;
  const thisMonthRevenue = thisMonthCount * avgPrice;

  // --- Top toolkit ---
  const topToolkit = toolkitBreakdown[0]?.name ?? "—";

  // --- Stripe: active subscription count (best-effort) ---
  let stripeActiveCount = 0;
  try {
    const stripeData = await stripe.subscriptions.list({ status: "active", limit: 100 });
    stripeActiveCount = stripeData.data.length;
  } catch {
    // Stripe may not be configured in test/local mode
  }

  return NextResponse.json({
    mrr,
    active_subs: activeCount,
    this_month_revenue: thisMonthRevenue,
    this_month_new: thisMonthCount,
    top_toolkit: topToolkit,
    toolkit_breakdown: toolkitBreakdown,
    recent_subs: recentSubs ?? [],
    stripe_active: stripeActiveCount,
  });
}
