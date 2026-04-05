import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { name, slug, description, price_monthly, icon, sort_order } = await req.json();
  if (!name || !slug) return NextResponse.json({ error: "name and slug required" }, { status: 400 });

  const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  const { data, error } = await auth.admin.from("toolkits").insert({
    name,
    slug: slugClean,
    description: description ?? null,
    price_monthly: price_monthly ? parseFloat(price_monthly) : null,
    icon: icon ?? null,
    sort_order: sort_order ?? 0,
    is_active: true,
  }).select("id").single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
