import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // ── 强制 canonical 域名：non-www → www（防止跨域名 cookie 丢失）──
  if (hostname === "aitoolsstation.com") {
    const wwwUrl = new URL(request.url);
    wwwUrl.hostname = "www.aitoolsstation.com";
    return NextResponse.redirect(wwwUrl, 301);
  }

  // ── API 路由完全不拦截，直接 pass through ─────────────────────────
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  // ── 301 重定向：旧前缀路由 → 扁平根路径 ──────────────────────────

  // /compare/{slug} → /{slug}  (e.g. chatgpt-vs-jasper)
  if (pathname.startsWith("/compare/")) {
    const flatSlug = pathname.replace(/^\/compare\//, "");
    if (flatSlug && !flatSlug.includes("/")) {
      return NextResponse.redirect(new URL(`/${flatSlug}`, request.url), 301);
    }
  }

  // /alternatives/{slug} → /{slug}-alternatives
  if (pathname.startsWith("/alternatives/")) {
    const inner = pathname.replace(/^\/alternatives\//, "");
    if (inner && !inner.includes("/")) {
      const flatSlug = inner.endsWith("-alternatives") ? inner : `${inner}-alternatives`;
      return NextResponse.redirect(new URL(`/${flatSlug}`, request.url), 301);
    }
  }

  // /problems/{slug} → /{slug}  (slug already starts with how-to-)
  if (pathname.startsWith("/problems/")) {
    const flatSlug = pathname.replace(/^\/problems\//, "");
    if (flatSlug && !flatSlug.includes("/")) {
      return NextResponse.redirect(new URL(`/${flatSlug}`, request.url), 301);
    }
  }

  // /tools/{tool-slug}/for-{profession} → /ai-{tool-slug}-for-{profession}
  const useCaseMatch = pathname.match(/^\/tools\/([^/]+)\/for-(.+)$/);
  if (useCaseMatch) {
    const [, toolSlug, profession] = useCaseMatch;
    return NextResponse.redirect(
      new URL(`/ai-${toolSlug}-for-${profession}`, request.url),
      301
    );
  }
  // ─────────────────────────────────────────────────────────────────

  // ── Supabase session refresh ──────────────────────────────────────
  // IMPORTANT: create supabaseResponse BEFORE the Supabase client so that
  // setAll() can safely reassign it without losing prior cookie mutations.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          // 1. Mutate the request cookies so Server Components see the refreshed token.
          // request.cookies.set only accepts (name, value) — options are not supported here.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Create a new response that carries the mutated request through.
          supabaseResponse = NextResponse.next({ request });
          // 3. Set the cookies on the response so the browser receives them.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() is called here for its SESSION REFRESH side effect.
  // Do NOT rely solely on user===null to block access — a network error also
  // returns user=null. Only redirect when we are certain (user=null, error=null).
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // ── Referral 追踪：?ref=CODE → cookie（30天有效期）──────────────
  // Must be set AFTER the Supabase client section to avoid being overwritten
  // by setAll() recreating supabaseResponse.
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode && !request.cookies.get("referrer_code")) {
    supabaseResponse.cookies.set("referrer_code", refCode, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    });
  }
  // ─────────────────────────────────────────────────────────────────

  // 保护 /dashboard 和 /admin：
  // Google OAuth sessions produce larger JWTs (with identities/provider_token/
  // user_metadata) that get split into chunked cookies (.0, .1, ...).
  // If any chunk is temporarily missing, getUser() returns {user:null, error:null}
  // — indistinguishable from a real "not logged in" state.
  //
  // Strategy:
  //   1. If user is found → no redirect ✓
  //   2. If getUserError is set (network/timeout) → allow through ✓
  //   3. If user is null but session token cookie exists → allow through ✓
  //      (page-level auth check will handle the final decision)
  //   4. If user is null AND no session cookie at all → definitely not logged in → redirect
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (isProtected && !user) {
    if (getUserError) {
      // Transient Supabase error — let the page handle auth
    } else {
      // Check if any session token cookie exists (non-code-verifier, non-empty).
      // Supabase stores tokens as sb-<ref>-auth-token or sb-<ref>-auth-token.N
      const hasSessionCookie = request.cookies.getAll().some(
        (c) =>
          /^sb-[^-]+-auth-token(\.0)?$/.test(c.name) &&
          c.value.length > 50
      );
      if (!hasSessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // Session cookie exists but getUser() returned null — could be a transient
      // chunked-cookie issue (common with Google OAuth). Let the page validate.
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};
