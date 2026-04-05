import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { toolkit_id, price_monthly } = await req.json();
  if (!toolkit_id || price_monthly === undefined) {
    return NextResponse.json({ error: "toolkit_id and price_monthly required" }, { status: 400 });
  }

  const price = parseFloat(price_monthly);
  if (isNaN(price) || price < 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });

  const { error } = await auth.admin.from("toolkits").update({ price_monthly: price }).eq("id", toolkit_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
