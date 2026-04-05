import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLKIT_CONTEXT: Record<string, string> = {
  jobseeker: "job search, resume writing, cover letters, interview prep, career development",
  creator: "YouTube, blogging, content creation, social media, podcasts, newsletters",
  marketing: "copywriting, email marketing, ads, branding, landing pages, sales copy",
  business: "business plans, proposals, reports, client management, operations, meetings",
  legal: "contracts, NDA, legal documents, compliance, agreements, terms of service",
  exam: "exam preparation, study guides, academic writing, test taking, flashcards",
};

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const toolkit_slug = (body.toolkit_slug as string) || undefined;
  const count = Math.min(Number(body.count) || 50, 100);

  const toolkits = toolkit_slug
    ? [toolkit_slug]
    : Object.keys(TOOLKIT_CONTEXT);

  const { admin } = auth;
  const allGenerated: string[] = [];
  let inserted = 0;

  for (const tk of toolkits) {
    const context = TOOLKIT_CONTEXT[tk] ?? tk;
    const perToolkit = Math.max(5, Math.ceil(count / toolkits.length));

    const prompt = `You are an SEO expert. Generate ${perToolkit} high-intent Google search keywords for AI tools in the "${tk}" category (${context}).

Include these keyword types:
- "informational": how-to queries ("how to write resume with AI", "what is AI cover letter")
- "transactional": action/tool queries ("AI resume generator free", "online resume optimizer tool")
- "commercial": comparison/best ("best AI resume builder 2024", "top free interview prep tools")

Rules:
- 3-8 words per keyword
- Include tool verbs: generator, optimizer, writer, analyzer, builder, creator, checker
- Mix easy, medium, and hard difficulty keywords

Return ONLY valid JSON (no extra text):
{"keywords":[{"keyword":"...","search_intent":"informational|transactional|commercial","difficulty":"low|medium|high"}]}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const { keywords = [] } = JSON.parse(completion.choices[0].message.content ?? "{}");

      const candidates = (keywords as Array<{ keyword: string; search_intent: string; difficulty: string }>)
        .filter((k) => k.keyword?.trim())
        .map((k) => ({ ...k, keyword: k.keyword.toLowerCase().trim() }));

      if (!candidates.length) continue;

      // Deduplicate against existing
      const { data: existing } = await admin
        .from("growth_keywords")
        .select("keyword")
        .in("keyword", candidates.map((c) => c.keyword));

      const existingSet = new Set((existing ?? []).map((e: { keyword: string }) => e.keyword));

      for (const kw of candidates) {
        if (existingSet.has(kw.keyword)) continue;
        allGenerated.push(kw.keyword);

        const { error } = await admin.from("growth_keywords").insert({
          keyword: kw.keyword,
          search_intent: kw.search_intent ?? "informational",
          difficulty: kw.difficulty ?? "medium",
          source: "ai",
          toolkit_slug: tk,
          status: "pending",
        });
        if (!error) inserted++;
      }
    } catch (err) {
      console.error(`[growth/discover-keywords] toolkit=${tk}`, err);
    }
  }

  return NextResponse.json({
    success: true,
    generated: inserted,
    keywords: allGenerated.slice(0, 20),
  });
}
