import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: rec } = await admin.from("users").select("role").eq("id", user.id).single();
  if (rec?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { idea_id, action } = await req.json();
  if (!idea_id || !action) return NextResponse.json({ error: "idea_id and action required" }, { status: 400 });

  if (action === "reject") {
    await admin.from("tool_ideas").update({ status: "rejected" }).eq("id", idea_id);
    return NextResponse.json({ success: true });
  }

  if (action === "approve") {
    const { data: idea } = await admin.from("tool_ideas").select("*").eq("id", idea_id).single();
    if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

    // 检查 slug 是否重复
    const { data: existing } = await admin.from("tools").select("id").eq("slug", idea.tool_slug).single();
    if (existing) {
      await admin.from("tool_ideas").update({ status: "approved" }).eq("id", idea_id);
      return NextResponse.json({ error: "Tool slug already exists" }, { status: 409 });
    }

    // 基础 inputs_schema（可后续手动完善）
    const inputs_schema = [{ name: "input", label: "Your Input", type: "textarea", required: true }];

    // 查找对应 toolkit_id
    const { data: toolkitRow } = await admin
      .from("toolkits")
      .select("id")
      .eq("slug", idea.toolkit_slug)
      .single();

    const { error: insertError } = await admin.from("tools").upsert({
      slug: idea.tool_slug,
      name: idea.tool_name,
      description: idea.description,
      toolkit_id: toolkitRow?.id ?? null,
      tool_type: "template",
      prompt_file: `${idea.toolkit_slug}/${idea.tool_slug}.txt`,
      prompt_template: idea.prompt_template ?? null,
      inputs_schema,
      is_active: true,
    }, { onConflict: "slug", ignoreDuplicates: true });

    if (insertError) {
      console.error("[approve-tool]", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await admin.from("tool_ideas").update({ status: "approved" }).eq("id", idea_id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
