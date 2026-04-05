import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { slug } = await req.json().catch(() => ({}));
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.rpc("increment_prompt_copies", { prompt_slug: slug });

  return NextResponse.json({ success: true });
}
