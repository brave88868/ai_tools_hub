import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const toolkits = ["jobseeker", "creator", "marketing", "business", "legal", "exam"];
  const selected = toolkits[new Date().getDay() % toolkits.length];

  const prompt = `Generate 20 SEO blog keywords for an AI tools site focused on "${selected}". 3-8 words each.
Return ONLY: {"keywords":["keyword 1",...]}`;

  const kwRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    response_format: { type: "json_object" },
  });

  const { keywords = [] } = JSON.parse(kwRes.choices[0].message.content ?? "{}");
  let added = 0;
  for (const kw of keywords as string[]) {
    const { error } = await admin.from("seo_keywords").insert({
      keyword: kw.toLowerCase().trim(),
      category: "blog",
      toolkit_slug: selected,
      status: "pending",
    });
    if (!error) added++;
  }

  console.log(`[cron/discover-keywords] toolkit=${selected} added=${added}`);
  return Response.json({ success: true, toolkit: selected, keywords_added: added });
}
