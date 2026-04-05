import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { createAdminClient } from "@/lib/supabase";
import { openai } from "@/lib/openai";

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

  // 1. 取低流量页面：view_count 最低的 N 个（如 view_count 全为 0，取最旧的）
  const { data: pages } = await admin
    .from("seo_pages")
    .select("id, slug, seo_title, seo_description, content, view_count")
    .not("content", "is", null)
    .order("view_count", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(count);

  if (!pages || pages.length === 0) {
    return NextResponse.json({ optimized: 0, message: "No pages found" });
  }

  const changes: Array<{
    slug: string;
    old_title: string;
    new_title: string;
    reason: string;
  }> = [];

  // 2. 对每个低流量页面用 GPT-4o-mini 优化（串行，避免超时）
  for (const page of pages) {
    try {
      const contentSnippet = (page.content ?? "").slice(0, 500);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `This SEO page has low traffic. Improve it:
Current title: ${page.seo_title ?? "(none)"}
Current description: ${page.seo_description ?? "(none)"}
Current content (first 500 chars): ${contentSnippet}

Return ONLY JSON:
{
  "new_seo_title": "improved title max 60 chars",
  "new_seo_description": "improved description max 155 chars",
  "improvement_reason": "one sentence why this will rank better"
}`,
          },
        ],
        max_tokens: 300,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const result = JSON.parse(raw) as {
        new_seo_title?: string;
        new_seo_description?: string;
        improvement_reason?: string;
      };

      if (!result.new_seo_title) continue;

      // 3. 更新 seo_pages 的 seo_title 和 seo_description
      const { error } = await admin
        .from("seo_pages")
        .update({
          seo_title: result.new_seo_title.slice(0, 60),
          seo_description: (result.new_seo_description ?? "").slice(0, 155),
        })
        .eq("id", page.id);

      if (!error) {
        changes.push({
          slug: page.slug,
          old_title: page.seo_title ?? "",
          new_title: result.new_seo_title,
          reason: result.improvement_reason ?? "",
        });
      }
    } catch {
      // 单条失败继续
    }
  }

  return NextResponse.json({ optimized: changes.length, changes });
}
