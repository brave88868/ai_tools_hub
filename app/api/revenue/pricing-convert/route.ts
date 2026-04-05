import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { variant } = body;

  if (!variant) {
    return NextResponse.json({ error: "variant is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: exp } = await supabase
    .from("pricing_experiments")
    .select("id, conversions")
    .eq("variant", variant)
    .single();

  if (!exp) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  await supabase
    .from("pricing_experiments")
    .update({ conversions: (exp.conversions ?? 0) + 1 })
    .eq("id", exp.id);

  return NextResponse.json({ success: true });
}
