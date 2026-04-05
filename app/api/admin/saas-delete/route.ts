import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { project_id } = body as { project_id: string };

  if (!project_id) {
    return NextResponse.json({ error: "project_id is required" }, { status: 400 });
  }

  // Get project slug first so we can clean up seo_pages
  const { data: project } = await admin
    .from("saas_projects")
    .select("slug")
    .eq("id", project_id)
    .single();

  if (project?.slug) {
    await admin
      .from("seo_pages")
      .delete()
      .eq("type", "saas_page")
      .eq("tool_slug", project.slug);
  }

  const { error } = await admin.from("saas_projects").delete().eq("id", project_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
