import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: userRecord } = await admin.from("users").select("role").eq("id", user.id).single();
  if (userRecord?.role !== "admin") return null;
  return { user, admin };
}

// GET /api/admin/pricing — 返回所有 toolkit 定价
export async function GET() {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await ctx.admin
    .from("toolkits")
    .select("id, slug, name, price_monthly, stripe_price_id, is_active")
    .order("sort_order", { ascending: true });

  return NextResponse.json({ toolkits: data ?? [] });
}

// PATCH /api/admin/pricing — 修改 price_monthly（仅显示价格）
export async function PATCH(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolkit_id, price_monthly } = await req.json();
  if (!toolkit_id || price_monthly === undefined) {
    return NextResponse.json({ error: "toolkit_id and price_monthly required" }, { status: 400 });
  }

  const price = parseFloat(price_monthly);
  if (isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from("toolkits")
    .update({ price_monthly: price })
    .eq("id", toolkit_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
