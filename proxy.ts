import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ── 301 重定向：旧前缀路由 → 扁平根路径 ──────────────────────────
  const { pathname } = request.nextUrl;

  // /compare/{slug} → /{slug}  (e.g. chatgpt-vs-jasper)
  if (pathname.startsWith("/compare/")) {
    const flatSlug = pathname.replace(/^\/compare\//, "");
    if (flatSlug && !flatSlug.includes("/")) {
      return NextResponse.redirect(new URL(`/${flatSlug}`, request.url), 301);
    }
  }

  // /alternatives/{slug} → /{slug}-alternatives
  // 已有 -alternatives 后缀的直接重定向到根路径
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

  // ── Referral 追踪：?ref=CODE → cookie（30天有效期）──────────────
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode && !request.cookies.get("referrer_code")) {
    supabaseResponse = NextResponse.next({ request });
    supabaseResponse.cookies.set("referrer_code", refCode, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
    });
  }
  // ─────────────────────────────────────────────────────────────────

  // ── Supabase session refresh ──────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 保护 /dashboard 和 /admin 路由，未登录重定向到 /login
  if (!user && (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/admin")
  )) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
