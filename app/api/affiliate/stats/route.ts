import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: commissions } = await admin
    .from("affiliate_commissions")
    .select("id, amount, status, created_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const rows = commissions ?? [];
  const total_earned = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const pending = rows.filter((r) => r.status === "pending").reduce((sum, r) => sum + (r.amount ?? 0), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return NextResponse.json({
    total_earned,
    pending,
    paid,
    commission_rate: 0.30,
    commissions: rows,
  });
}
