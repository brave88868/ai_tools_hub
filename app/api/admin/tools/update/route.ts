import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { tool_id, name, slug, description, tool_type, prompt_file, inputs_schema, output_format, sort_order } = await req.json();
  if (!tool_id) return NextResponse.json({ error: "tool_id required" }, { status: 400 });

  let parsedSchema = inputs_schema;
  if (typeof inputs_schema === "string") {
    try { parsedSchema = JSON.parse(inputs_schema); } catch { return NextResponse.json({ error: "Invalid inputs_schema JSON" }, { status: 400 }); }
  }

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (slug !== undefined) update.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  if (description !== undefined) update.description = description;
  if (tool_type !== undefined) update.tool_type = tool_type;
  if (prompt_file !== undefined) update.prompt_file = prompt_file;
  if (parsedSchema !== undefined) update.inputs_schema = parsedSchema;
  if (output_format !== undefined) update.output_format = output_format;
  if (sort_order !== undefined) update.sort_order = sort_order;

  const { error } = await auth.admin.from("tools").update(update).eq("id", tool_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
