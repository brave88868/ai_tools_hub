import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import ToolPageClient from "./ToolPageClient";

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tool } = await supabase
    .from("tools")
    .select("*, toolkits(slug, name)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!tool) notFound();

  // Fetch use cases for this tool (up to 6)
  const { data: toolUseCases } = await supabase
    .from("seo_pages")
    .select("slug, title, meta")
    .eq("tool_slug", slug)
    .eq("type", "use_case")
    .limit(6);

  // Fetch related tools in same toolkit (up to 5, excluding current)
  let relatedTools: Array<{ slug: string; name: string }> = [];
  if (tool.toolkit_id) {
    const { data: rt } = await supabase
      .from("tools")
      .select("slug, name")
      .eq("toolkit_id", tool.toolkit_id)
      .eq("is_active", true)
      .neq("slug", slug)
      .order("sort_order", { ascending: true })
      .limit(5);
    relatedTools = rt ?? [];
  }

  return (
    <ToolPageClient
      tool={tool}
      slug={slug}
      initialUseCases={toolUseCases ?? []}
      initialRelatedTools={relatedTools}
    />
  );
}
