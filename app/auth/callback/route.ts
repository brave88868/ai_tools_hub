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

      if (signupIp) {
        await admin
          .from("users")
          .update({ signup_ip: signupIp })
          .eq("id", user.id)
          .is("signup_ip", null);
      }
      // ─────────────────────────────────────────────────────────────

      // ── Referral 写入（含防作弊）+ 奖励发放 ──────────────────────
      const referrerCode = request.cookies.get("referrer_code")?.value;
      if (referrerCode && referrerCode !== user.id.slice(0, 8)) {
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
          const { data: referrer } = await admin
            .from("users")
            .select("id, bonus_uses")
            .gte("id", `${referrerCode}-0000-0000-0000-000000000000`)
            .lte("id", `${referrerCode}-ffff-ffff-ffff-ffffffffffff`)
            .single();

          if (referrer) {
            // 防重复
            const { data: existing } = await admin
              .from("referrals")
              .select("id")
              .eq("referred_user_id", user.id)
              .maybeSingle();

            if (!existing) {
              await admin.from("referrals").insert({
                referrer_id: referrer.id,
                referred_user_id: user.id,
                status: "completed",
              });

              // ── 奖励新用户 +10 uses ──────────────────────────────
              await admin.from("referral_rewards").insert({
                user_id: user.id,
                type: "signup_bonus",
                uses_granted: 10,
              });
              // Increment bonus_uses for new user (get current value first)
              const { data: newUserRecord } = await admin
                .from("users")
                .select("bonus_uses")
                .eq("id", user.id)
                .single();
              await admin
                .from("users")
                .update({ bonus_uses: (newUserRecord?.bonus_uses ?? 0) + 10 })
                .eq("id", user.id);

              // ── 奖励邀请者 +20 uses ──────────────────────────────
              const referrerBonusNow = (referrer.bonus_uses ?? 0) + 20;
              await Promise.all([
                admin.from("referral_rewards").insert({
                  user_id: referrer.id,
                  type: "referral_invite",
                  uses_granted: 20,
                }),
                admin
                  .from("users")
                  .update({ bonus_uses: referrerBonusNow })
                  .eq("id", referrer.id),
              ]);

              // ── 里程碑检查 ──────────────────────────────────────
              const { count: totalInvites } = await admin
                .from("referrals")
                .select("*", { count: "exact", head: true })
                .eq("referrer_id", referrer.id);

              const inviteCount = totalInvites ?? 0;

              if (inviteCount === 5) {
                await Promise.all([
                  admin.from("referral_rewards").insert({
                    user_id: referrer.id,
                    type: "milestone",
                    uses_granted: 100,
                    milestone: "5_invites",
                  }),
                  admin
                    .from("users")
                    .update({ bonus_uses: referrerBonusNow + 100 })
                    .eq("id", referrer.id),
                ]);
              } else if (inviteCount === 20) {
                const proExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                await Promise.all([
                  admin.from("referral_rewards").insert({
                    user_id: referrer.id,
                    type: "milestone",
                    uses_granted: 0,
                    milestone: "20_invites",
                  }),
                  admin
                    .from("users")
                    .update({ plan: "pro", role: "pro" })
                    .eq("id", referrer.id),
                ]);
                console.log(`[auth/callback] Milestone 20_invites: granted Pro to ${referrer.id} until ${proExpiry}`);
              }
            }
          }
        } else {
          console.warn(`[auth/callback] Referral blocked — duplicate IP: ${signupIp}`);
        }
      }
      // ─────────────────────────────────────────────────────────────

      // ── 发送欢迎邮件（新用户注册时）────────────────────────────────
      const isNewUser = !user.last_sign_in_at ||
        Math.abs(new Date(user.created_at).getTime() - new Date(user.last_sign_in_at).getTime()) < 30000;
      if (isNewUser && user.email) {
        fetch(`${origin}/api/email/send-welcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        }).catch(() => {});
      }
      // ─────────────────────────────────────────────────────────────

      const response = NextResponse.redirect(`${origin}${next}`);
      if (referrerCode) {
        response.cookies.set("referrer_code", "", { maxAge: 0, path: "/" });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
