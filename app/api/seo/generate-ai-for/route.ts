import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

// 目标受众列表
const AI_FOR_AUDIENCES = [
  "marketers",
  "developers",
  "students",
  "entrepreneurs",
  "content-creators",
  "lawyers",
  "teachers",
  "hr-professionals",
  "freelancers",
  "startup-founders",
  "consultants",
  "project-managers",
];

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
    .eq("type", "ai-for");
  const existingSet = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  const remaining = AI_FOR_AUDIENCES.filter((a) => !existingSet.has(a));

  if (remaining.length === 0) {
    return NextResponse.json({ generated: 0, message: "All ai-for pages already generated" });
  }

  let generated = 0;
  let skipped = 0;
  let lastError: string | undefined;
  const toProcess = remaining.slice(0, count);

  for (const audience of toProcess) {
    const audienceName = audience.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write an SEO page: "Best AI Tools for ${audienceName} in 2025"

Include:
1. Why ${audienceName} need AI tools
2. Top 6 use cases where AI saves time
3. How to get started with AI tools
4. Key benefits and ROI

Return JSON: { "title": "string", "seo_title": "max 60 chars", "seo_description": "max 155 chars", "content": "markdown" }`,
          },
        ],
        max_tokens: 1200,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw) as {
        title?: string;
        seo_title?: string;
        seo_description?: string;
        content?: string;
      };

      const title = parsed.title ?? `Best AI Tools for ${audienceName} in 2025`;
      const seoTitle = parsed.seo_title ?? `Best AI Tools for ${audienceName} 2025 | AI Tools Station`;
      const seoDesc =
        parsed.seo_description ??
        `Discover the best AI tools for ${audienceName}. Save time and boost productivity.`;

      const { error } = await admin.from("seo_pages").insert({
        slug: audience,
        type: "ai-for",
        title,
        seo_title: seoTitle,
        seo_description: seoDesc,
        content: parsed.content ?? "",
        meta: { audience, audience_name: audienceName },
      });

      if (!error) {
        generated++;
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
