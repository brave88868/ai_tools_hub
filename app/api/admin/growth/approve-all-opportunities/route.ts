import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tool_opportunities")
    .update({ status: "approved" })
    .eq("status", "pending")
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, updated: data?.length ?? 0 });
}
