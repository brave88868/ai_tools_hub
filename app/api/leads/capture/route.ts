import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { email, source, tool_slug } = body;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;

  const supabase = createAdminClient();

  // 检查是否已是注册用户
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  // UPSERT 到 leads 表（已存在不报错）
  const { error } = await supabase.from("leads").upsert(
    {
      email: email.toLowerCase().trim(),
      source: source ?? "tool_result",
      tool_slug: tool_slug ?? null,
      ip,
    },
    { onConflict: "email", ignoreDuplicates: true }
  );

  if (error) {
    console.error("[leads/capture]", error.message);
    // 如果是重复 email 的唯一约束错误，仍然视为成功
    if (!error.message.includes("duplicate") && !error.message.includes("unique")) {
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    is_existing_user: !!existingUser,
  });
}
