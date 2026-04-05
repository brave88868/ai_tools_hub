import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;

      // ── Referral 写入 ─────────────────────────────────────────────
      // 检查 referrer_code cookie（由 middleware 设置）
      const referrerCode = request.cookies.get("referrer_code")?.value;
      if (referrerCode && referrerCode !== user.id) {
        const admin = createAdminClient();

        // 用 referrerCode 查找推荐人（referrerCode 存的是 referrer 的 user.id）
        const { data: referrer } = await admin
          .from("users")
          .select("id")
          .eq("id", referrerCode)
          .single();

        if (referrer) {
          // 检查是否已有 referral 记录（防重复）
          const { data: existing } = await admin
            .from("referrals")
            .select("id")
            .eq("referred_user_id", user.id)
            .single();

          if (!existing) {
            await admin.from("referrals").insert({
              referrer_id: referrer.id,
              referred_user_id: user.id,
              status: "pending",
            });
          }
        }
      }
      // ─────────────────────────────────────────────────────────────

      const response = NextResponse.redirect(`${origin}${next}`);
      // 清除 referrer_code cookie
      if (referrerCode) {
        response.cookies.set("referrer_code", "", { maxAge: 0, path: "/" });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
