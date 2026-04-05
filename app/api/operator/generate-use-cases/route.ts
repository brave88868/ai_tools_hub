import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const USE_CASES: Record<string, string[]> = {
  jobseeker: ["data-analyst","software-engineer","product-manager","marketing-manager","nurse","teacher","graphic-designer","sales-manager","accountant","student"],
  creator: ["gaming","tech","vlog","education","cooking","fitness","travel","podcast","music","business"],
  marketing: ["ecommerce","saas","real-estate","healthcare","restaurant","agency","startup","nonprofit","b2b","local-business"],
  business: ["startup","enterprise","consultant","freelancer","small-business","remote-team","agency","retail","finance","hr"],
  legal: ["contract","nda","employment","privacy-policy","terms-of-service","lease","partnership","ip","compliance","dispute"],
  exam: ["ielts","toefl","sat","gmat","gre","bar-exam","medical","coding-interview","certification","college-entrance"],
};

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: rec } = await admin.from("users").select("role").eq("id", user.id).single();
  if (rec?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { limit = 20 } = await req.json().catch(() => ({}));

  const { data: tools } = await admin.from("tools").select("slug, name, toolkit_slug").eq("is_active", true);
  if (!tools) return NextResponse.json({ error: "No tools found" }, { status: 500 });

  let generated = 0;
  let skipped = 0;

  outer:
  for (const tool of tools) {
    const useCases = USE_CASES[tool.toolkit_slug] ?? [];
    for (const useCase of useCases) {
      if (generated >= limit) break outer;

      const slug = `${tool.slug}-for-${useCase}`;
      const { data: existing } = await admin.from("tool_use_cases").select("id").eq("slug", slug).single();
      if (existing) { skipped++; continue; }

      try {
        const prompt = `Write SEO content for an AI tool use-case page. Return ONLY valid JSON.
Tool: ${tool.name}, Use case: ${useCase.replace(/-/g, " ")}
{"title":"H1 title","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"3 SEO paragraphs 200+ words"}`;

        const res = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const content = JSON.parse(res.choices[0].message.content ?? "{}");
        await admin.from("tool_use_cases").insert({ tool_slug: tool.slug, use_case: useCase, slug, ...content });
        generated++;
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`[generate-use-cases] ${slug}:`, err);
      }
    }
  }

  return NextResponse.json({ success: true, generated, skipped });
}
