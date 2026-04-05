import { createServerClient as createSSRClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Handles Supabase v2 email confirmation format:
//   /auth/confirm?token_hash=xxx&type=signup&next=/dashboard
//
// The Supabase email template should contain:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
//
// This is DIFFERENT from the old PKCE format (/auth/callback?code=xxx).
// Both routes are kept so either template format works.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "signup" | "recovery" | "email" | null;
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("[confirm] token_hash exists:", !!token_hash, "type:", type);

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  // Collect cookies to apply to the redirect response
  const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach((c) => pendingCookies.push(c));
        },
      },
    }
  );

  const { error, data } = await supabase.auth.verifyOtp({ token_hash, type });

  console.log("[confirm] verify error:", error?.message);
  console.log("[confirm] user:", data?.user?.email);

  if (error) {
    const msg = error.message.toLowerCase();
    const isExpired = msg.includes("expired") || msg.includes("invalid") || msg.includes("otp");
    const errorParam = isExpired ? "confirmation_expired" : "confirmation_failed";
    return NextResponse.redirect(`${origin}/login?error=${errorParam}`);
  }

  if (!data.user) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  // Ensure public.users record exists
  const admin = createAdminClient();
  try {
    await admin
      .from("users")
      .upsert(
        { id: data.user.id, email: data.user.email ?? "" },
        { onConflict: "id", ignoreDuplicates: true }
      );
  } catch (e) {
    console.error("[confirm] users upsert failed (non-fatal):", e);
  }

  // Build redirect with session cookies applied directly to the response
  const response = NextResponse.redirect(`${origin}${next}`);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
