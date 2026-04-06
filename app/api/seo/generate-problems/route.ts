import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";
import { PROBLEMS, problemTitle } from "@/lib/seo-keywords";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let admin: ReturnType<typeof createAdminClient>;
  if (isCron) {
    admin = createAdminClient();
  } else {
    const auth = await requireAdmin(req);
    if (!auth) return unauthorized();
    admin = auth.admin;
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 5), 20);

  // 已有 slug
  const { data: existing } = await admin
    .from("seo_pages")
    .select("slug")
    .eq("type", "problem");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  const remaining = PROBLEMS.filter((p) => !existingSet.has(p));

  if (remaining.length === 0) {
    return NextResponse.json({ generated: 0, message: "All problems already generated" });
  }

  let generated = 0;
  let skipped = 0;
  let lastError: string | undefined;
  const toProcess = remaining.slice(0, count);

  for (const slug of toProcess) {
    const title = problemTitle(slug);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write a comprehensive guide: "${title}"

Include:
1. Why this skill matters (2 paragraphs)
2. Step-by-step guide (6 numbered steps)
3. AI-powered approach: how to do this with AI tools
4. Real example (before/after)
5. Common mistakes to avoid
6. Pro tips

Return JSON: { "title": "string", "seo_title": "max 60 chars", "seo_description": "max 155 chars", "content": "markdown" }`,
          },
        ],
        max_tokens: 1400,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        title?: string;
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      const pageTitle = parsed.title ?? title;
      const seoTitle = parsed.seo_title ?? `${title} | AI Tools Station`;
      const seoDesc = parsed.seo_description ?? `A complete guide: ${title}. Step-by-step with AI tools.`;

      const { error } = await admin.from("seo_pages").insert({
        slug,
        type: "problem",
        title: pageTitle,
        seo_title: seoTitle,
        seo_description: seoDesc,
        content: parsed.content ?? "",
        meta: { problem: title },
      });

      if (!error) {
        generated++;
        // 同步 seo_problems
        await admin.from("seo_problems").upsert({
          slug,
          flat_slug: slug,
          problem: title,
          seo_title: seoTitle,
          seo_description: seoDesc,
          content: parsed.content ?? "",
        }, { onConflict: "slug", ignoreDuplicates: true });
      } else {
        lastError = error.message;
        skipped++;
      }
    } catch (err) {
      lastError = (err as Error).message;
      skipped++;
    }
  }

  if (generated > 0) fetch("https://aitoolsstation.com/api/seo/ping").catch(() => {});

  return NextResponse.json({ generated, skipped, lastError });
}
