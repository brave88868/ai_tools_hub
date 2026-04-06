import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";

// GET — list submissions (filter by status)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";

  const { data, error } = await auth.admin
    .from("tool_submissions")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submissions: data ?? [] });
}

// POST — approve or reject
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json().catch(() => ({}));
  const { submission_id, action } = body;

  if (!submission_id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "submission_id and action (approve|reject) required" }, { status: 400 });
  }

  if (action === "reject") {
    const { error } = await admin
      .from("tool_submissions")
      .update({ status: "rejected" })
      .eq("id", submission_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // approve — fetch submission then write to tools table (no toolkit, needs manual assignment later)
  const { data: sub, error: fetchErr } = await admin
    .from("tool_submissions")
    .select("*")
    .eq("id", submission_id)
    .single();

  if (fetchErr || !sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  // Derive a slug from the tool name
  const slug = sub.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

  // Check slug uniqueness
  const { data: existing } = await admin.from("tools").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `Slug "${slug}" already exists — rename before approving` }, { status: 409 });
  }

  const { error: insertErr } = await admin.from("tools").insert({
    slug,
    name: sub.name,
    description: sub.description ?? null,
    tool_type: "custom",
    is_active: false,
    sort_order: 999,
    // Leave toolkit_id null — admin can assign later via Tools Manage page
  });

  if (insertErr) {
    console.error("[admin/submissions] insert error", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  await admin.from("tool_submissions").update({ status: "approved" }).eq("id", submission_id);
  return NextResponse.json({ success: true, slug });
}
