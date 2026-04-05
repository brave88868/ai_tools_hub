import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("tool_templates")
    .select("title, content")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  // 异步递增下载计数（fire-and-forget）
  admin
    .from("tool_templates")
    .update({ download_count: admin.rpc("increment_template_downloads", { template_slug: slug }) as unknown as number })
    .eq("slug", slug)
    .then(() => {});

  const filename = `${slug}.txt`;
  return new NextResponse(data.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
