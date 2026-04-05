import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { toolkit_id, name, slug, description, tool_type, prompt_file, inputs_schema, output_format, sort_order } = await req.json();
  if (!toolkit_id || !name || !slug) {
    return NextResponse.json({ error: "toolkit_id, name and slug required" }, { status: 400 });
  }

  let parsedSchema = inputs_schema;
  if (typeof inputs_schema === "string") {
    try { parsedSchema = JSON.parse(inputs_schema); } catch { return NextResponse.json({ error: "Invalid inputs_schema JSON" }, { status: 400 }); }
  }

  const { data, error } = await auth.admin.from("tools").insert({
    toolkit_id,
    name,
    slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
    description: description ?? null,
    tool_type: tool_type ?? "template",
    prompt_file: prompt_file ?? null,
    inputs_schema: parsedSchema ?? null,
    output_format: output_format ?? "markdown",
    sort_order: sort_order ?? 0,
    is_active: true,
  }).select("id").single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
