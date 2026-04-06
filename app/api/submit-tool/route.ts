import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { name, website, description, category, pricing, submitter_email, affiliate_link } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Tool name is required" }, { status: 400 });
  if (!website?.trim()) return NextResponse.json({ error: "Website URL is required" }, { status: 400 });

  // Basic URL validation
  try {
    new URL(website);
  } catch {
    return NextResponse.json({ error: "Please enter a valid URL" }, { status: 400 });
  }

  // Validate affiliate_link URL if provided
  if (affiliate_link?.trim()) {
    try {
      new URL(affiliate_link);
    } catch {
      return NextResponse.json({ error: "Please enter a valid affiliate link URL" }, { status: 400 });
    }
  }

  const admin = createAdminClient();

  // Try inserting with affiliate_link; fall back without if column doesn't exist yet
  const insertPayload: Record<string, unknown> = {
    name: name.trim(),
    website: website.trim(),
    description: description?.trim() ?? null,
    category: category?.trim() ?? null,
    pricing: pricing?.trim() ?? null,
    submitter_email: submitter_email?.trim() ?? null,
    status: "pending",
  };
  if (affiliate_link?.trim()) {
    insertPayload.affiliate_link = affiliate_link.trim();
  }

  let { error } = await admin.from("tool_submissions").insert(insertPayload);

  // If affiliate_link column doesn't exist yet, retry without it
  if (error?.message?.includes("affiliate_link")) {
    delete insertPayload.affiliate_link;
    const retry = await admin.from("tool_submissions").insert(insertPayload);
    error = retry.error;
  }

  if (error) {
    console.error("[submit-tool]", error);
    return NextResponse.json({ error: "Failed to save submission" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
