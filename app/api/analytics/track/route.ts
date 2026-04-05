import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { event_type, tool_slug, metadata } = await req.json();

    if (!event_type) {
      return NextResponse.json({ error: "event_type required" }, { status: 400 });
    }

    const serverSupabase = await createServerClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const admin = createAdminClient();
    await admin.from("analytics_events").insert({
      event_type,
      user_id: user?.id ?? null,
      tool_slug: tool_slug ?? null,
      metadata: metadata ?? null,
    });

    return NextResponse.json({ success: true });
  } catch {
    // 分析事件失败不影响用户体验，静默处理
    return NextResponse.json({ success: true });
  }
}
