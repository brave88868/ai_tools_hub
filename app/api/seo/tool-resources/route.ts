import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/seo/tool-resources?tool_slug=resume-optimizer
 * Returns related generators, use case pages, and prompt pages for a tool.
 */
export async function GET(req: NextRequest) {
  const toolSlug = req.nextUrl.searchParams.get("tool_slug");
  if (!toolSlug) {
    return NextResponse.json({ error: "tool_slug required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Find generator linked to this tool
  const { data: generator } = await supabase
    .from("generators")
    .select("id, slug, title")
    .eq("tool_slug", toolSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (!generator) {
    return NextResponse.json({ generators: [], useCases: [], prompts: [], templates: [] });
  }

  // Parallel fetch: use cases + prompts + templates for this generator
  const [{ data: useCases }, { data: prompts }, { data: templates }] = await Promise.all([
    supabase
      .from("use_case_pages")
      .select("slug, title, persona")
      .eq("generator_id", generator.id)
      .eq("is_active", true)
      .limit(6),
    supabase
      .from("prompt_pages")
      .select("slug, title")
      .eq("generator_id", generator.id)
      .eq("is_active", true)
      .limit(3),
    supabase
      .from("template_pages")
      .select("slug, title")
      .eq("generator_id", generator.id)
      .eq("is_active", true)
      .limit(2),
  ]);

  return NextResponse.json({
    generator: { slug: generator.slug, title: generator.title },
    useCases: useCases ?? [],
    prompts: prompts ?? [],
    templates: templates ?? [],
  });
}
