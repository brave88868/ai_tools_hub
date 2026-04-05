import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { trigger, user_id } = body;

  if (!trigger) {
    return NextResponse.json({ error: "trigger is required" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("analytics_events").insert({
      event_type: "upgrade_view",
      user_id: user_id ?? null,
      metadata: { trigger },
    });
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true });
}
