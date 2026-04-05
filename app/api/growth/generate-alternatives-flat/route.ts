import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { openai } from "@/lib/openai";

const COMPETITORS = [
  "Jasper", "Copy.ai", "Grammarly", "ChatGPT", "Notion AI", "Resume.io",
  "Canva", "Midjourney", "Claude", "Gemini", "Writesonic", "Rytr",
  "Surfer SEO", "Semrush", "Loom", "Descript", "ElevenLabs", "HeyGen",
  "Otter.ai", "Pictory", "Runway", "Opus Clip", "Synthesia",
];

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();
  const { admin } = auth;

  const body = await req.json().catch(() => ({}));
  const count = Math.min(Number(body.count ?? 5), 20);

  // Fetch existing flat_slugs to skip
  const { data: existing } = await admin
    .from("seo_alternatives")
    .select("flat_slug");
  const existingSet = new Set(
    (existing ?? []).map((r: { flat_slug: string | null }) => r.flat_slug).filter(Boolean)
  );

  const remaining = COMPETITORS.filter(
    (c) => !existingSet.has(`${toSlug(c)}-alternatives`)
  );

  if (remaining.length === 0) {
    return NextResponse.json({ generated: 0, message: "All competitors already have alternatives pages" });
  }

  let generated = 0;
  const toProcess = remaining.slice(0, count);

  for (const toolName of toProcess) {
    const toolSlug = toSlug(toolName);
    const flatSlug = `${toolSlug}-alternatives`;

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

Return JSON: { "seo_title": "string (max 60 chars)", "seo_description": "string (max 155 chars)", "content": "string (markdown)" }`,
          },
        ],
        max_tokens: 1400,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      await admin.from("seo_alternatives").insert({
        slug: flatSlug,
        flat_slug: flatSlug,
        tool_name: toolName,
        title: `Best ${toolName} Alternatives in 2025`,
        seo_title: parsed.seo_title ?? `Best ${toolName} Alternatives in 2025 | AI Tools Hub`,
        seo_description: parsed.seo_description ?? `Looking for ${toolName} alternatives? Compare the best options by features and pricing.`,
        content: parsed.content ?? "",
      });

      generated++;
    } catch {
      // continue on error
    }
  }

  return NextResponse.json({ generated });
}
