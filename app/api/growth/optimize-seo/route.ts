import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Get page view counts per tool page
  const { data: pageViews } = await admin
    .from("analytics_events")
    .select("metadata")
    .eq("event_type", "page_view")
    .gte("created_at", weekAgo);

  const pageCounts: Record<string, number> = {};
  for (const ev of pageViews ?? []) {
    const page = (ev.metadata as { page?: string } | null)?.page ?? "";
    if (page.startsWith("/tools/")) {
      pageCounts[page] = (pageCounts[page] ?? 0) + 1;
    }
  }

  const avgViews =
    Object.keys(pageCounts).length > 0
      ? Object.values(pageCounts).reduce((s, n) => s + n, 0) / Object.keys(pageCounts).length
      : 0;

  // Find tools with below-average traffic
  const lowTrafficSlugs = Object.entries(pageCounts)
    .filter(([, count]) => count < avgViews)
    .map(([page]) => page.replace("/tools/", ""))
    .slice(0, 10);

  // Also add tools with NO page views in the period
  const { data: allTools } = await admin
    .from("tools")
    .select("slug, name, description, seo_title, seo_description")
    .eq("is_active", true)
    .limit(30);

  const toolsWithNoViews = (allTools ?? [])
    .filter((t) => !pageCounts[`/tools/${t.slug}`])
    .slice(0, 5)
    .map((t) => t.slug);

  const targetSlugs = [...new Set([...lowTrafficSlugs, ...toolsWithNoViews])].slice(0, 12);

  if (!targetSlugs.length) {
    return NextResponse.json({ suggestions: [], message: "No low-traffic tools found" });
  }

  const { data: targetTools } = await admin
    .from("tools")
    .select("slug, name, description, seo_title, seo_description")
    .in("slug", targetSlugs);

  if (!targetTools?.length) {
    return NextResponse.json({ suggestions: [] });
  }

  const toolList = targetTools
    .map(
      (t) =>
        `- slug: ${t.slug}\n  name: ${t.name}\n  current_title: ${t.seo_title ?? t.name}\n  current_desc: ${t.seo_description ?? t.description ?? "none"}\n  weekly_views: ${pageCounts[`/tools/${t.slug}`] ?? 0}`
    )
    .join("\n");

  const prompt = `You are an SEO specialist. Analyse these AI tool pages and suggest improved meta titles and descriptions to increase organic click-through rates.

Tools to optimise:
${toolList}

For each tool, suggest:
- seo_title: compelling, keyword-rich, max 60 chars, include "AI" and key verb
- seo_description: clear value prop, max 155 chars, include benefit + CTA

Return ONLY valid JSON:
{"suggestions":[{"slug":"...","seo_title":"...","seo_description":"...","reason":"one sentence why this improves CTR"}]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const { suggestions = [] } = JSON.parse(completion.choices[0].message.content ?? "{}");

    // Enrich with current values and view counts
    const enriched = (suggestions as Array<Record<string, string>>).map((s) => ({
      ...s,
      current_views: pageCounts[`/tools/${s.slug}`] ?? 0,
      avg_views: Math.round(avgViews),
    }));

    return NextResponse.json({ suggestions: enriched, total_analysed: targetTools.length });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
