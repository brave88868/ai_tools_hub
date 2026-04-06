import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// GET /api/admin/tools — 返回所有工具（含 toolkit 信息）
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { data: tools } = await auth.admin
    .from("tools")
    .select("id, slug, name, description, tool_type, prompt_file, inputs_schema, output_format, sort_order, is_active, auto_generated, toolkit_id, toolkits(id, slug, name)")
    .order("toolkit_id", { ascending: true })
    .order("sort_order", { ascending: true });

  return NextResponse.json({ tools: tools ?? [] });
}
