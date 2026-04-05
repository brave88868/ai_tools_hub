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
      const admin = createAdminClient();

      // ── 获取注册 IP ──────────────────────────────────────────────
      const signupIp =
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        null;

      // 写入 signup_ip（只在首次注册时写入，忽略错误）
      if (signupIp) {
        await admin
          .from("users")
          .update({ signup_ip: signupIp })
          .eq("id", user.id)
          .is("signup_ip", null);
      }
      // ─────────────────────────────────────────────────────────────

      // ── Referral 写入（含防作弊）─────────────────────────────────
      const referrerCode = request.cookies.get("referrer_code")?.value;
      if (referrerCode && referrerCode !== user.id.slice(0, 8)) {
        // 防作弊：同 IP 在 24 小时内已有其他注册 → 忽略 referral
        let isAbuse = false;
        if (signupIp) {
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: sameIpUser } = await admin
            .from("users")
            .select("id")
            .eq("signup_ip", signupIp)
            .neq("id", user.id)
            .gte("created_at", oneDayAgo)
            .limit(1)
            .maybeSingle();
          isAbuse = !!sameIpUser;
        }

        if (!isAbuse) {
          // 用 referrerCode（8位前缀）通过 UUID 范围查询找推荐人
          const { data: referrer } = await admin
            .from("users")
            .select("id")
            .gte("id", `${referrerCode}-0000-0000-0000-000000000000`)
            .lte("id", `${referrerCode}-ffff-ffff-ffff-ffffffffffff`)
            .single();

          if (referrer) {
            // 防重复：该用户是否已有 referral 记录
            const { data: existing } = await admin
              .from("referrals")
              .select("id")
              .eq("referred_user_id", user.id)
              .maybeSingle();

            if (!existing) {
              await admin.from("referrals").insert({
                referrer_id: referrer.id,
                referred_user_id: user.id,
                status: "pending",
              });
            }
          }
        } else {
          console.warn(`[auth/callback] Referral blocked — duplicate IP: ${signupIp}`);
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
