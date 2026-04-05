import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { anthropic } from "@/lib/claude";

// 脱敏处理：移除个人信息
function sanitizeContent(content: string): string {
  return content
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email]")
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[phone]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[ssn]");
}

// 生成唯一 slug
function generateSlug(base: string): string {
  const clean = base
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60);
  const suffix = Date.now().toString(36);
  return `${clean}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool_slug, raw_output, input_context } = body;

    if (!tool_slug || !raw_output || !input_context) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 内容长度检查
    if (raw_output.trim().length < 100) {
      return NextResponse.json({ success: false, error: "Content too short" });
    }

    // 调用 Claude API 提取结构化元数据
    let title = `AI Generated ${tool_slug.replace(/-/g, " ")} Example`;
    let keywords: string[] = [tool_slug, "ai generated", "example"];

    try {
      const metaResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `Based on this AI tool output for "${tool_slug}" tool with context "${input_context}", generate SEO metadata.

Output ONLY valid JSON (no markdown, no explanation):
{
  "title": "concise SEO title under 60 chars describing what was generated",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Tool output preview: ${raw_output.substring(0, 300)}`,
          },
        ],
      });

      const metaText =
        metaResponse.content[0].type === "text"
          ? metaResponse.content[0].text
          : "";
      const meta = JSON.parse(metaText.replace(/```json|```/g, "").trim());
      if (meta.title) title = meta.title;
      if (meta.keywords?.length) keywords = meta.keywords;
    } catch {
      // 使用默认值，不中断流程
    }

    const sanitized = sanitizeContent(raw_output);
    const slug = generateSlug(`${tool_slug}-${input_context}`);

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("generated_examples")
      .insert({
        tool_slug,
        title,
        content: sanitized,
        slug,
        keywords,
        is_public: true,
      })
      .select("slug")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        slug: data.slug,
        url: `/examples/${data.slug}`,
      },
    });
  } catch (error: unknown) {
    console.error("[examples/create] error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
