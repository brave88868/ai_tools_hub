import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit) || 30, 100);

  const { admin } = auth;

  // Get pending keywords
  const { data: keywords } = await admin
    .from("growth_keywords")
    .select("id, keyword, toolkit_slug, search_intent")
    .eq("status", "pending")
    .limit(limit);

  if (!keywords?.length) {
    return NextResponse.json({ success: true, found: 0, message: "No pending keywords" });
  }

  // Get existing slugs to avoid duplicates
  const [{ data: existingTools }, { data: existingOpps }] = await Promise.all([
    admin.from("tools").select("slug"),
    admin.from("tool_opportunities").select("tool_slug"),
  ]);

  const usedSlugs = new Set([
    ...(existingTools ?? []).map((t: { slug: string }) => t.slug),
    ...(existingOpps ?? []).map((o: { tool_slug: string }) => o.tool_slug),
  ]);

  const kwList = keywords
    .map((k) => `- "${k.keyword}" (toolkit: ${k.toolkit_slug}, intent: ${k.search_intent})`)
    .join("\n");

  const prompt = `You are a product manager for an AI tools SaaS platform. Analyze these search keywords and identify which ones represent clear opportunities for a new standalone AI tool.

Keywords to analyze:
${kwList}

A good tool opportunity:
- Represents a specific, repeatable task (not just information seeking)
- Can be built as a template-based AI tool with 2-4 input fields
- Has clear, actionable output
- Should NOT already be covered by slugs: ${[...usedSlugs].slice(0, 30).join(", ")}

Score each opportunity 0-100:
- 90+: clear, high-value, unique tool
- 70-89: good opportunity, moderate competition
- 50-69: possible, but less clear use case
- <50: skip

Return ONLY valid JSON:
{"opportunities":[{"keyword":"exact keyword from list","tool_name":"Tool Name Here","tool_slug":"url-friendly-slug","toolkit_slug":"jobseeker|creator|marketing|business|legal|exam","score":85,"description":"One sentence: what this tool does and who it helps."}]}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const { opportunities = [] } = JSON.parse(completion.choices[0].message.content ?? "{}");
    let found = 0;

    for (const opp of opportunities as Array<Record<string, string | number>>) {
      const slug = String(opp.tool_slug ?? "").trim();
      if (!slug || usedSlugs.has(slug)) continue;

      const { error } = await admin.from("tool_opportunities").insert({
        keyword: opp.keyword,
        tool_name: opp.tool_name,
        tool_slug: slug,
        tool_type: "template",
        description: opp.description,
        toolkit_slug: opp.toolkit_slug,
        score: Number(opp.score) || 50,
        status: "pending",
      });
      if (!error) {
        found++;
        usedSlugs.add(slug);
      }
    }

    // Mark processed keywords as "processing"
    await admin
      .from("growth_keywords")
      .update({ status: "processing" })
      .in("id", keywords.map((k) => k.id));

    return NextResponse.json({ success: true, found });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
