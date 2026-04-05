import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { tool_slug, feedback_type, rating, message, email } = await req.json();

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const admin = createAdminClient();

    const { error } = await admin.from("feedback").insert({
      tool_slug: tool_slug ?? null,
      feedback_type: feedback_type ?? "general",
      rating: rating ?? null,
      message: message ?? null,
      email: email ?? null,
      user_id: user?.id ?? null,
    });

    if (error) {
      console.error("[feedback]", error);
      return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }

    // 非关键 — 失败不影响响应
    admin.from("analytics_events").insert({
      event_type: "feedback_submitted",
      user_id: user?.id ?? null,
      tool_slug: tool_slug ?? null,
      metadata: { feedback_type, rating },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
