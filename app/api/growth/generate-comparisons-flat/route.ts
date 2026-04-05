import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

const COMPETITORS = [
  "Jasper", "Copy.ai", "Grammarly", "ChatGPT", "Notion AI", "Resume.io",
  "Canva", "Midjourney", "Claude", "Gemini", "Writesonic", "Rytr",
  "Surfer SEO", "Semrush", "Loom", "Descript", "ElevenLabs", "HeyGen",
  "Otter.ai", "Pictory", "Runway", "Opus Clip", "Synthesia",
];

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 10), 30);

  // Fetch internal tools
  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true)
    .limit(30);

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  // Fetch existing flat_slugs
  const { data: existing } = await admin
    .from("seo_comparisons")
    .select("flat_slug, slug");
  const existingFlatSet = new Set(
    (existing ?? []).map((r: { flat_slug: string | null; slug: string }) => r.flat_slug ?? r.slug)
  );

  let generated = 0;
  let attempts = 0;
  const maxAttempts = count * 10;

  // Build candidate pairs: internal tool vs competitor OR internal vs internal
  while (generated < count && attempts < maxAttempts) {
    attempts++;

    let toolAName: string;
    let toolASlug: string;
    let toolBName: string;
    let toolBSlug: string;

    if (Math.random() < 0.7) {
      // internal vs competitor
      const tool = tools[Math.floor(Math.random() * tools.length)];
      const competitor = COMPETITORS[Math.floor(Math.random() * COMPETITORS.length)];
      toolAName = tool.name;
      toolASlug = tool.slug;
      toolBName = competitor;
      toolBSlug = toSlug(competitor);
    } else {
      // internal vs internal
      const idxA = Math.floor(Math.random() * tools.length);
      let idxB = Math.floor(Math.random() * tools.length);
      while (idxB === idxA) idxB = Math.floor(Math.random() * tools.length);
      toolAName = tools[idxA].name;
      toolASlug = tools[idxA].slug;
      toolBName = tools[idxB].name;
      toolBSlug = tools[idxB].slug;
    }

    // Alphabetical order for uniqueness
    const [nameA, slugA, nameB, slugB] =
      toolASlug < toolBSlug
        ? [toolAName, toolASlug, toolBName, toolBSlug]
        : [toolBName, toolBSlug, toolAName, toolASlug];

    const flatSlug = `${slugA}-vs-${slugB}`;
    if (existingFlatSet.has(flatSlug)) continue;
    existingFlatSet.add(flatSlug);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write a 900-word comparison article: "${nameA} vs ${nameB}"

Include:
1. Quick summary table (features, pricing, ease of use)
2. Overview of each tool
3. Key differences
4. Who should use ${nameA} vs ${nameB}
5. Verdict and recommendation

Return JSON: { "seo_title": "string (max 60 chars)", "seo_description": "string (max 155 chars)", "content": "string (markdown)" }`,
          },
        ],
        max_tokens: 1400,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      await admin.from("seo_comparisons").insert({
        slug: flatSlug,
        flat_slug: flatSlug,
        tool_a: nameA,
        tool_b: nameB,
        title: `${nameA} vs ${nameB}: Which AI Tool is Better?`,
        seo_title: parsed.seo_title ?? `${nameA} vs ${nameB} | AI Tools Hub`,
        seo_description: parsed.seo_description ?? `Compare ${nameA} and ${nameB}. Features, pricing, pros and cons.`,
        content: parsed.content ?? "",
      });

      generated++;
    } catch {
      // continue on error
    }
  }

  return NextResponse.json({ generated });
}
