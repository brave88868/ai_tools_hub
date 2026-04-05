import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildVariants(productName: string, keyword: string): string[] {
  const n = productName.toLowerCase();
  const k = keyword.toLowerCase();
  return [
    `${n} free`,
    `${n} online`,
    `${n} examples`,
    `best ${k} tool`,
    `how to ${k}`,
    `${k} for beginners`,
    `${k} tips`,
    `free ${k} generator`,
    `${k} AI`,
    `${n} vs competitors`,
  ];
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const { admin } = auth;
  const body = await req.json();
  const { idea_id, count = 10 } = body as { idea_id: string; count?: number };

  if (!idea_id) {
    return NextResponse.json({ error: "idea_id is required" }, { status: 400 });
  }

  const { data: idea } = await admin
    .from("startup_ideas")
    .select("id, product_name, slug, tagline")
    .eq("id", idea_id)
    .single();

  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  // Get keyword from opportunity
  const { data: opp } = await admin
    .from("startup_opportunities")
    .select("keyword")
    .eq("id",
      (await admin
        .from("startup_ideas")
        .select("opportunity_id")
        .eq("id", idea_id)
        .single()
      ).data?.opportunity_id ?? ""
    )
    .single();

  const keyword = opp?.keyword ?? idea.product_name;
  const variants = buildVariants(idea.product_name, keyword).slice(0, count);

  const CONCURRENCY = 5;
  let generated = 0;

  for (let i = 0; i < variants.length; i += CONCURRENCY) {
    const batch = variants.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (variant) => {
        const slug = `${idea.slug}-${variant
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`;

        const prompt = `Write a 500-word SEO page about "${variant}".
Include: what it is, key features, how to use, examples, FAQ (2 questions).
Return ONLY JSON: {"seo_title":"max 60 chars","seo_description":"max 155 chars","content":"markdown"}`;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 25000);
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" },
          });
          clearTimeout(timeout);

          const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");

          await admin.from("seo_pages").upsert(
            {
              slug,
              title: parsed.seo_title ?? variant,
              meta_description: parsed.seo_description ?? "",
              content: parsed.content ?? "",
              type: "startup_page",
              tool_slug: idea.slug,
              seo_title: parsed.seo_title ?? variant,
              seo_description: parsed.seo_description ?? "",
            },
            { onConflict: "slug" }
          );
          generated++;
        } catch {
          // skip failed variant
        }
      })
    );
  }

  return NextResponse.json({ generated, idea_id, slug: idea.slug });
}
