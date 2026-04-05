import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

export async function POST(req: NextRequest) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: userRecord } = await admin.from("users").select("role").eq("id", user.id).single();
  if (userRecord?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { count = 5 } = await req.json().catch(() => ({}));

  const { data: keywords } = await admin
    .from("seo_keywords")
    .select("id, keyword, toolkit_slug")
    .eq("status", "pending")
    .limit(count);

  if (!keywords || keywords.length === 0) {
    return NextResponse.json({ success: true, generated: 0, message: "No pending keywords" });
  }

  let success = 0;
  for (const kw of keywords) {
    try {
      const prompt = `Write a high-quality SEO blog article about: "${kw.keyword}" for an AI tools platform.
800-1000 words, Markdown format with ## headings, practical and helpful tone.
Do NOT include H1 title in content.
Return ONLY valid JSON:
{"title":"compelling title max 70 chars","excerpt":"2-sentence summary","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"full markdown 800-1000 words"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.75,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const baseSlug = slugify(article.title ?? kw.keyword);
      const { data: existing } = await admin.from("blog_posts").select("id").eq("slug", baseSlug).single();
      const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

      const { error } = await admin.from("blog_posts").insert({
        slug: finalSlug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        keywords: kw.keyword,
        published: true,
        auto_generated: true,
      });

      if (!error) {
        await admin.from("seo_keywords").update({ status: "used" }).eq("id", kw.id);
        success++;
      }
    } catch (err) {
      console.error(`[generate-blog] "${kw.keyword}":`, err);
    }
  }

  return NextResponse.json({ success: true, generated: success });
}
