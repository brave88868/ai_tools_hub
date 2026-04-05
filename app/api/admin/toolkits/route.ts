import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// GET /api/admin/toolkits — 返回所有工具箱（含工具数量）
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { data: toolkits } = await auth.admin
    .from("toolkits")
    .select("id, slug, name, description, price_monthly, stripe_price_id, icon, sort_order, is_active")
    .order("sort_order", { ascending: true });

  // 获取每个 toolkit 的工具数量
  const { data: counts } = await auth.admin
    .from("tools")
    .select("toolkit_id")
    .eq("is_active", true);

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    if (row.toolkit_id) countMap[row.toolkit_id] = (countMap[row.toolkit_id] ?? 0) + 1;
  }

  const result = (toolkits ?? []).map((t) => ({ ...t, tool_count: countMap[t.id] ?? 0 }));
  return NextResponse.json({ toolkits: result });
}
