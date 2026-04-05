import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

function hashIp(ip: string, modulus: number): number {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash * 31 + ip.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % modulus;
}

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();

  const { data: experiments } = await supabase
    .from("pricing_experiments")
    .select("id, variant, price_monthly, label, views")
    .eq("is_active", true)
    .order("variant");

  const active = (experiments ?? []) as Array<{
    id: string;
    variant: string;
    price_monthly: number;
    label: string;
    views: number;
  }>;

  if (active.length === 0) {
    return NextResponse.json({ variant: null, price_monthly: null, label: null });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";

  const idx = hashIp(ip, active.length);
  const chosen = active[idx];

  // 递增 views（best-effort，不阻塞响应）
  void supabase
    .from("pricing_experiments")
    .update({ views: (chosen.views ?? 0) + 1 })
    .eq("id", chosen.id);

  return NextResponse.json({
    variant: chosen.variant,
    price_monthly: chosen.price_monthly,
    label: chosen.label,
  });
}
