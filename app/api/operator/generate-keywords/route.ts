import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TOOLKIT_DESCRIPTIONS: Record<string, string> = {
  jobseeker: "resume writing, cover letters, job interview preparation, LinkedIn",
  creator: "YouTube content, video scripts, channel growth, social media",
  marketing: "ad copy, email campaigns, landing pages, social media marketing",
  business: "business plans, proposals, strategy, team management",
  legal: "contract analysis, legal documents, compliance, NDA",
  exam: "IELTS, TOEFL, SAT, GMAT, GRE exam preparation",
};

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminClient = createAdminClient();
  const { data: { user } } = await adminClient.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: rec } = await adminClient.from("users").select("role").eq("id", user.id).single();
  if (rec?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = adminClient;

  const { toolkit_slug } = await req.json().catch(() => ({}));
  const toolkits = toolkit_slug ? [toolkit_slug] : Object.keys(TOOLKIT_DESCRIPTIONS);

  let total = 0;
  let skipped = 0;

  for (const toolkit of toolkits) {
    try {
      const prompt = `Generate 20 SEO blog keyword ideas for an AI tools platform focused on: ${TOOLKIT_DESCRIPTIONS[toolkit] ?? toolkit}.
Mix of how-to, guide, tips, and use-case keywords, 3-8 words each.
Return ONLY a JSON object: {"keywords": ["keyword 1", ...]}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content ?? "{}");
      const keywords: string[] = parsed.keywords ?? [];

      for (const keyword of keywords) {
        const { error } = await admin.from("seo_keywords").insert({
          keyword: keyword.toLowerCase().trim(),
          category: "blog",
          toolkit_slug: toolkit,
          status: "pending",
        });
        if (error?.code === "23505") skipped++;
        else if (!error) total++;
      }
    } catch (err) {
      console.error(`[generate-keywords] ${toolkit}:`, err);
    }
  }

  return NextResponse.json({ success: true, inserted: total, skipped });
}
