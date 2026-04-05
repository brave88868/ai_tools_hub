import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// GET /api/admin/pricing — 返回所有 toolkit 定价
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { data } = await auth.admin
    .from("toolkits")
    .select("id, slug, name, price_monthly, stripe_price_id, is_active")
    .order("sort_order", { ascending: true });

  return NextResponse.json({ toolkits: data ?? [] });
}
