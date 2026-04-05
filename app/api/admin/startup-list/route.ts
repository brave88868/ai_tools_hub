import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const type = req.nextUrl.searchParams.get("type");

  if (type === "opportunities") {
    const { data, error } = await admin
      .from("startup_opportunities")
      .select("id, keyword, source, score, status, created_at")
      .order("score", { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ opportunities: data ?? [] });
  }

  if (type === "ideas") {
    const { data, error } = await admin
      .from("startup_ideas")
      .select("id, product_name, slug, status, created_at")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ideas: data ?? [] });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
