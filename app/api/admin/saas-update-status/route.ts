import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { project_id, status } = body as { project_id: string; status: string };

  if (!project_id || !status) {
    return NextResponse.json({ error: "project_id and status are required" }, { status: 400 });
  }

  const valid = ["draft", "active", "archived"];
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await admin
    .from("saas_projects")
    .update({ status })
    .eq("id", project_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
