import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tool_slug: string }> }
) {
  const { tool_slug } = await params;
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 20);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("generated_examples")
      .select("id, title, slug, keywords, created_at")
      .eq("tool_slug", tool_slug)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
