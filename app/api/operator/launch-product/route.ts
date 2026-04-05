import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { idea_id } = body as { idea_id: string };

  if (!idea_id) {
    return NextResponse.json({ error: "idea_id is required" }, { status: 400 });
  }

  const { data: idea } = await admin
    .from("startup_ideas")
    .select("slug")
    .eq("id", idea_id)
    .single();

  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  await admin
    .from("startup_ideas")
    .update({ status: "launched" })
    .eq("id", idea_id);

  await admin
    .from("saas_projects")
    .update({ status: "active" })
    .eq("slug", idea.slug);

  return NextResponse.json({ success: true, url: `/saas/${idea.slug}` });
}
