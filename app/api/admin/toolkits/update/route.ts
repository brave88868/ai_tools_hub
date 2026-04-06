import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { toolkit_id, name, description, price_monthly, icon, sort_order, is_active } = body;

  if (!toolkit_id) {
    return NextResponse.json({ error: "toolkit_id is required" }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { error } = await auth.admin
    .from("toolkits")
    .update({
      name: name.trim(),
      description: description?.trim() ?? null,
      price_monthly: price_monthly !== "" && price_monthly != null ? Number(price_monthly) : null,
      icon: icon?.trim() ?? null,
      sort_order: parseInt(sort_order) || 0,
      is_active: Boolean(is_active),
    })
    .eq("id", toolkit_id);

  if (error) {
    console.error("[admin/toolkits/update]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
