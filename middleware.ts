import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Only the canonical production domain — everything else (vercel.app, apex) gets noindex
const PRODUCTION_HOST = "www.aitoolsstation.com";

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // ── Non-www apex → www canonical (Vercel also handles this but defense-in-depth)
  if (hostname === "aitoolsstation.com") {
    const wwwUrl = new URL(request.url);
    wwwUrl.hostname = "www.aitoolsstation.com";
    return NextResponse.redirect(wwwUrl, 301);
  }

  // ── API routes: pass through immediately, no middleware overhead
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  // ── 301 redirects: prefix routes → flat canonical paths ──────────────────

  // /compare/{slug} → /{slug}
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

  // /problems/{slug} → /{slug}
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
  // ─────────────────────────────────────────────────────────────────────────

  // ── Supabase session refresh ──────────────────────────────────────────────
  // Create supabaseResponse BEFORE the client so setAll() can safely reassign it.
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  // getUser() is called for its SESSION REFRESH side effect.
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();

  // ── Referral tracking: ?ref=CODE → cookie (30-day TTL) ───────────────────
  // Must run AFTER Supabase client (setAll can recreate supabaseResponse).
  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode && !request.cookies.get("referrer_code")) {
    supabaseResponse.cookies.set("referrer_code", refCode, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── /dashboard and /admin auth guard ─────────────────────────────────────
  // Google OAuth JWTs are large and split into chunked cookies (.0, .1, …).
  // If a chunk is transiently missing, getUser() returns {user:null, error:null}
  // — indistinguishable from logged-out. Only hard-redirect when we are certain.
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (isProtected && !user) {
    if (!getUserError) {
      const hasSessionCookie = request.cookies.getAll().some(
        (c) => /^sb-[^-]+-auth-token(\.0)?$/.test(c.name) && c.value.length > 50
      );
      if (!hasSessionCookie) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── noindex on non-production domains (vercel.app previews, etc.) ─────────
  // Use the raw Host header — request.nextUrl.hostname may be normalised by Vercel
  const host = request.headers.get("host") || hostname;
  if (host !== PRODUCTION_HOST) {
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.*\\.xml).*)",
  ],
};
