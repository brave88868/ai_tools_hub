import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLKIT_CONTEXT: Record<string, string> = {
  jobseeker: "job search, resume writing, cover letters, interview prep",
  creator: "YouTube, blogging, content creation, social media",
  marketing: "copywriting, email marketing, ads, branding, landing pages",
  business: "business plans, proposals, reports, client management",
  legal: "contracts, NDA, legal documents, compliance",
  exam: "exam preparation, study guides, academic writing",
};

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
  const admin = createAdminClient();
  const toolkits = Object.keys(TOOLKIT_CONTEXT);
  const selected = toolkits[new Date().getDay() % toolkits.length];

  // ── 1. Blog SEO keywords (5 per run) ─────────────────────
  const blogPrompt = `Generate 5 SEO blog keywords for an AI tools site focused on "${selected}". 3-8 words each.
Return ONLY: {"keywords":["keyword 1",...]}`;

  const kwRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: blogPrompt }],
    temperature: 0.8,
    max_tokens: 200,
    response_format: { type: "json_object" },
  });

  const { keywords: blogKeywords = [] } = JSON.parse(kwRes.choices[0].message.content ?? "{}");
  let blogAdded = 0;
  for (const kw of blogKeywords as string[]) {
    const { error } = await admin.from("seo_keywords").insert({
      keyword: kw.toLowerCase().trim(),
      category: "blog",
      toolkit_slug: selected,
      status: "pending",
    });
    if (!error) blogAdded++;
  }

  // ── 2. Growth keywords (5 per run) ────────────────────
  const growthPrompt = `Generate 5 high-intent Google search keywords for AI tools in the "${selected}" category.
Mix informational/transactional intents.
Return ONLY valid JSON: {"keywords":[{"keyword":"...","search_intent":"informational|transactional|commercial","difficulty":"low|medium|high"}]}`;

  let growthAdded = 0;
  try {
    const growthRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: growthPrompt }],
      temperature: 0.8,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const { keywords: growthKws = [] } = JSON.parse(growthRes.choices[0].message.content ?? "{}");
    const candidates = (growthKws as Array<{ keyword: string; search_intent: string; difficulty: string }>)
      .filter((k) => k.keyword?.trim())
      .map((k) => ({ ...k, keyword: k.keyword.toLowerCase().trim() }));

    if (candidates.length > 0) {
      const { data: existing } = await admin
        .from("growth_keywords")
        .select("keyword")
        .in("keyword", candidates.map((c) => c.keyword));
      const existingSet = new Set((existing ?? []).map((e: { keyword: string }) => e.keyword));

      for (const kw of candidates) {
        if (existingSet.has(kw.keyword)) continue;
        const { error } = await admin.from("growth_keywords").insert({
          keyword: kw.keyword,
          search_intent: kw.search_intent ?? "informational",
          difficulty: kw.difficulty ?? "medium",
          source: "ai",
          toolkit_slug: selected,
          status: "pending",
        });
        if (!error) growthAdded++;
      }
    }
  } catch (err) {
    console.error("[cron/discover-keywords] growth step failed", err);
  }

  console.log(`[cron/discover-keywords] toolkit=${selected} blog_added=${blogAdded} growth_added=${growthAdded}`);
  return Response.json({
    success: true,
    toolkit: selected,
    blog_keywords_added: blogAdded,
    growth_keywords_added: growthAdded,
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/discover-keywords] fatal error", err);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
