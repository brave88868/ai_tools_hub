import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

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

  const admin = createAdminClient();
  const toolkits = Object.keys(TOOLKIT_CONTEXT);
  const selected = toolkits[new Date().getDay() % toolkits.length];

  // ── 1. Blog SEO keywords (seo_keywords table) ─────────────────────
  const blogPrompt = `Generate 20 SEO blog keywords for an AI tools site focused on "${selected}". 3-8 words each.
Return ONLY: {"keywords":["keyword 1",...]}`;

  const kwRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: blogPrompt }],
    temperature: 0.8,
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

  // ── 2. Growth keywords (growth_keywords table) ────────────────────
  const growthPrompt = `You are an SEO expert. Generate 20 high-intent Google search keywords for AI tools in the "${selected}" category (${TOOLKIT_CONTEXT[selected]}).
Include tool-type keywords (generator, optimizer, writer, analyzer) and mix informational/transactional/commercial intents.
Return ONLY valid JSON: {"keywords":[{"keyword":"...","search_intent":"informational|transactional|commercial","difficulty":"low|medium|high"}]}`;

  let growthAdded = 0;
  try {
    const growthRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: growthPrompt }],
      temperature: 0.8,
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

  // ── 3. Find opportunities from pending growth keywords ────────────
  let opportunitiesFound = 0;
  try {
    const { data: pendingKws } = await admin
      .from("growth_keywords")
      .select("id, keyword, toolkit_slug, search_intent")
      .eq("status", "pending")
      .limit(20);

    if (pendingKws?.length) {
      const [{ data: existingTools }, { data: existingOpps }] = await Promise.all([
        admin.from("tools").select("slug"),
        admin.from("tool_opportunities").select("tool_slug"),
      ]);
      const usedSlugs = new Set([
        ...(existingTools ?? []).map((t: { slug: string }) => t.slug),
        ...(existingOpps ?? []).map((o: { tool_slug: string }) => o.tool_slug),
      ]);

      const kwList = pendingKws.map((k) => `- "${k.keyword}" (${k.toolkit_slug})`).join("\n");
      const oppPrompt = `Identify tool opportunities from these keywords:\n${kwList}\nReturn ONLY valid JSON: {"opportunities":[{"keyword":"...","tool_name":"...","tool_slug":"...","toolkit_slug":"...","score":75,"description":"..."}]}`;

      const oppRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: oppPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const { opportunities = [] } = JSON.parse(oppRes.choices[0].message.content ?? "{}");
      for (const opp of opportunities as Array<Record<string, string | number>>) {
        const slug = String(opp.tool_slug ?? "").trim();
        if (!slug || usedSlugs.has(slug)) continue;
        const { error } = await admin.from("tool_opportunities").insert({
          keyword: opp.keyword, tool_name: opp.tool_name, tool_slug: slug,
          tool_type: "template", description: opp.description,
          toolkit_slug: opp.toolkit_slug, score: Number(opp.score) || 50, status: "pending",
        });
        if (!error) { opportunitiesFound++; usedSlugs.add(slug); }
      }

      await admin.from("growth_keywords").update({ status: "processing" }).in("id", pendingKws.map((k) => k.id));
    }
  } catch (err) {
    console.error("[cron/discover-keywords] opportunities step failed", err);
  }

  console.log(`[cron/discover-keywords] toolkit=${selected} blog_added=${blogAdded} growth_added=${growthAdded} opportunities=${opportunitiesFound}`);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const cronAuth = `Bearer ${process.env.CRON_SECRET}`;

  // ── Step 4: Google Autocomplete ──────────────────────────────────────────
  let autocompleteFound = 0;
  try {
    const res = await fetch(`${APP_URL}/api/growth/google-autocomplete`, {
      method: "POST",
      headers: { "Authorization": cronAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ count: 5 }),
    });
    if (res.ok) {
      const data = await res.json();
      autocompleteFound = data.discovered ?? 0;
    }
  } catch (err) {
    console.error("[cron/discover-keywords] autocomplete step failed", err);
  }

  // ── Step 5: Expand Keywords ───────────────────────────────────────────────
  let expandedCount = 0;
  try {
    const res = await fetch(`${APP_URL}/api/growth/expand-keywords`, {
      method: "POST",
      headers: { "Authorization": cronAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ count: 20 }),
    });
    if (res.ok) {
      const data = await res.json();
      expandedCount = data.expanded ?? 0;
    }
  } catch (err) {
    console.error("[cron/discover-keywords] expand step failed", err);
  }

  // ── Step 6: Detect Intent ─────────────────────────────────────────────────
  let intentsClassified = 0;
  try {
    const res = await fetch(`${APP_URL}/api/growth/detect-intent`, {
      method: "POST",
      headers: { "Authorization": cronAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 20 }),
    });
    if (res.ok) {
      const data = await res.json();
      intentsClassified = data.classified ?? 0;
    }
  } catch (err) {
    console.error("[cron/discover-keywords] detect-intent step failed", err);
  }

  // ── Step 7: Generate Pages from Intents ──────────────────────────────────
  let pagesGenerated = 0;
  try {
    const res = await fetch(`${APP_URL}/api/growth/generate-from-intents`, {
      method: "POST",
      headers: { "Authorization": cronAuth, "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 5 }),
    });
    if (res.ok) {
      const data = await res.json();
      pagesGenerated = data.generated ?? 0;
    }
  } catch (err) {
    console.error("[cron/discover-keywords] generate-from-intents step failed", err);
  }

  console.log(`[cron/discover-keywords] autocomplete=${autocompleteFound} expanded=${expandedCount} intents=${intentsClassified} pages=${pagesGenerated}`);
  return Response.json({
    success: true,
    toolkit: selected,
    blog_keywords_added: blogAdded,
    growth_keywords_added: growthAdded,
    opportunities_found: opportunitiesFound,
    autocomplete_found: autocompleteFound,
    expanded: expandedCount,
    intents_classified: intentsClassified,
    pages_generated: pagesGenerated,
  });
}
