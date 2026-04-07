import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id, action } = await req.json();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const admin = createAdminClient();
  const { error } = await admin.from("growth_keywords").update({ status }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status });
}
