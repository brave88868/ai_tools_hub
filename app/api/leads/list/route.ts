import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;

  const { data: leads, count } = await admin
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ leads: leads ?? [], total: count ?? 0 });
}
