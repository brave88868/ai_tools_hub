import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";
import { COMPETITORS, competitorDisplayName } from "@/lib/seo-keywords";

const CONCURRENCY = 5;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 10), 30);

  // 内部工具
  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true)
    .limit(40);

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools found" }, { status: 400 });
  }

  // 已有 slug
  const { data: existing } = await admin
    .from("seo_pages")
    .select("slug")
    .eq("type", "comparison");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  // 构建候选配对
  type Pair = { slugA: string; nameA: string; slugB: string; nameB: string };
  const pairs: Pair[] = [];

  for (const tool of tools) {
    for (const comp of COMPETITORS) {
      const [slugA, nameA, slugB, nameB] =
        tool.slug < comp
          ? [tool.slug, tool.name, comp, competitorDisplayName(comp)]
          : [comp, competitorDisplayName(comp), tool.slug, tool.name];
      const slug = `${slugA}-vs-${slugB}`;
      if (!existingSet.has(slug)) pairs.push({ slugA, nameA, slugB, nameB });
    }
  }
  // 内部 × 内部
  for (let i = 0; i < tools.length; i++) {
    for (let j = i + 1; j < tools.length; j++) {
      const [slugA, nameA, slugB, nameB] =
        tools[i].slug < tools[j].slug
          ? [tools[i].slug, tools[i].name, tools[j].slug, tools[j].name]
          : [tools[j].slug, tools[j].name, tools[i].slug, tools[i].name];
      const slug = `${slugA}-vs-${slugB}`;
      if (!existingSet.has(slug)) pairs.push({ slugA, nameA, slugB, nameB });
    }
  }

  pairs.sort(() => Math.random() - 0.5);
  const batch = pairs.slice(0, count);

  let generated = 0;
  let skipped = 0;

  async function generateOne(pair: Pair): Promise<void> {
    const { slugA, nameA, slugB, nameB } = pair;
    const flatSlug = `${slugA}-vs-${slugB}`;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write a 900-word comparison: "${nameA} vs ${nameB}"

Include:
1. Quick comparison table (features, pricing, ease of use, best for)
2. Overview of each tool
3. Key differences
4. Use case scenarios: when to choose ${nameA} vs ${nameB}
5. Verdict

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

      const title = parsed.title ?? `${nameA} vs ${nameB}: Which AI Tool is Better?`;
      const seoTitle = parsed.seo_title ?? `${nameA} vs ${nameB} | AI Tools Hub`;
      const seoDesc = parsed.seo_description ?? `Compare ${nameA} and ${nameB}. Features, pricing, pros and cons.`;

      // seo_pages 主表
      const { error } = await admin.from("seo_pages").insert({
        slug: flatSlug,
        type: "comparison",
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
        content: parsed.content ?? "",
        meta: { tool_a: nameA, tool_b: nameB, slug_a: slugA, slug_b: slugB },
      });

      if (!error) {
        generated++;
        // 同步 seo_comparisons（兼容已有路由）
        await admin.from("seo_comparisons").upsert({
          slug: flatSlug,
          flat_slug: flatSlug,
          tool_a: nameA,
          tool_b: nameB,
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

  for (let i = 0; i < batch.length; i += CONCURRENCY) {
    await Promise.allSettled(batch.slice(i, i + CONCURRENCY).map(generateOne));
  }

  return NextResponse.json({ generated, skipped });
}
