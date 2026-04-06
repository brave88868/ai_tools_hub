import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { id } = await params;
  const { admin } = auth;

  const { data: sub, error: fetchErr } = await admin
    .from("tool_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !sub) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  if (sub.status !== "pending") {
    return NextResponse.json({ error: `Already ${sub.status}` }, { status: 409 });
  }

  const slug = sub.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  const { data: existing } = await admin
    .from("tools")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" already exists — rename before approving` },
      { status: 409 }
    );
  }

  const { error: insertErr } = await admin.from("tools").insert({
    slug,
    name: sub.name,
    description: sub.description ?? null,
    tool_type: "custom",
    is_active: false,
    sort_order: 999,
  });

  if (insertErr) {
    console.error("[submissions/approve]", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await admin
    .from("tool_submissions")
    .update({ status: "approved" })
    .eq("id", id);

  return NextResponse.json({ success: true, slug });
}
