import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.limit ?? 10), 20);

  // Fetch all active tools
  const { data: tools } = await admin
    .from("tools")
    .select("slug, name")
    .eq("is_active", true);

  if (!tools || tools.length < 2) {
    return NextResponse.json({ error: "Not enough tools" }, { status: 400 });
  }

  // Fetch existing comparison slugs
  const { data: existingSlugs } = await admin
    .from("seo_comparisons")
    .select("slug");
  const existingSet = new Set((existingSlugs ?? []).map((r: { slug: string }) => r.slug));

  let generated = 0;
  const errors: string[] = [];
  let attempts = 0;
  const maxAttempts = count * 5;

  while (generated < count && attempts < maxAttempts) {
    attempts++;
    const idxA = Math.floor(Math.random() * tools.length);
    let idxB = Math.floor(Math.random() * tools.length);
    while (idxB === idxA) idxB = Math.floor(Math.random() * tools.length);

    const toolA = tools[idxA];
    const toolB = tools[idxB];
    const slug = `${toolA.slug}-vs-${toolB.slug}`;
    const reverseSlug = `${toolB.slug}-vs-${toolA.slug}`;

    if (existingSet.has(slug) || existingSet.has(reverseSlug)) continue;

    try {
      const prompt = `Compare two AI tools for an SEO comparison article.
Tool A: ${toolA.name}
Tool B: ${toolB.name}

Write a 900-word SEO article including:
1. Overview of both tools
2. Features comparison
3. Pros and cons of each
4. Pricing comparison
5. Which tool is better for different users
6. Final verdict

Return ONLY valid JSON (no markdown wrapper):
{"title":"string max 80 chars","seo_title":"string max 60 chars","seo_description":"string max 155 chars","content":"full markdown article"}`;

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      const article = JSON.parse(res.choices[0].message.content ?? "{}");
      const { error } = await admin.from("seo_comparisons").insert({
        slug,
        tool_a: toolA.name,
        tool_b: toolB.name,
        title: article.title,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        content: article.content,
      });

      if (!error) {
        existingSet.add(slug);
        generated++;
      } else {
        errors.push(error.message);
      }
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  return NextResponse.json({ success: true, generated, errors });
}
