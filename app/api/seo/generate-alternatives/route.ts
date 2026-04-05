import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import { COMPETITORS, competitorDisplayName } from "@/lib/seo-keywords";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 5), 20);

  // 已有 slug
  const { data: existing } = await admin
    .from("seo_pages")
    .select("slug")
    .eq("type", "alternative");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  const remaining = COMPETITORS.filter((c) => !existingSet.has(`${c}-alternatives`));

  if (remaining.length === 0) {
    return NextResponse.json({ generated: 0, message: "All alternatives already generated" });
  }

  let generated = 0;
  let skipped = 0;
  const toProcess = remaining.slice(0, count);

  for (const comp of toProcess) {
    const slug = `${comp}-alternatives`;
    const toolName = competitorDisplayName(comp);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write an SEO article: "Best ${toolName} Alternatives in 2025"

Include:
1. Why users look for ${toolName} alternatives
2. Top 8 alternatives (include AI Tools Hub — aitoolsstation.com — as a free option where relevant)
3. Comparison table (tool, best for, pricing)
4. How to choose the right alternative
5. Conclusion

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

      const title = parsed.title ?? `Best ${toolName} Alternatives in 2025`;
      const seoTitle = parsed.seo_title ?? `Best ${toolName} Alternatives 2025 | AI Tools Hub`;
      const seoDesc = parsed.seo_description ?? `Looking for ${toolName} alternatives? Compare the best options by features and pricing.`;

      const { error } = await admin.from("seo_pages").insert({
        slug,
        type: "alternative",
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
        content: parsed.content ?? "",
        meta: { tool_name: toolName, tool_slug: comp },
      });

      if (!error) {
        generated++;
        // 同步 seo_alternatives
        await admin.from("seo_alternatives").upsert({
          slug,
          flat_slug: slug,
          tool_name: toolName,
          title,
          seo_title: seoTitle,
          seo_description: seoDesc,
          content: parsed.content ?? "",
        }, { onConflict: "slug", ignoreDuplicates: true });
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  return NextResponse.json({ generated, skipped });
}
