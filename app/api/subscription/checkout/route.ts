import { NextRequest, NextResponse } from "next/server";
import { stripe, TOOLKIT_PRICE_IDS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") ||
                 contentType.includes("multipart/form-data");

  try {
    // ── Parse body (form submission or JSON) ──────────────────────────
    let toolkit_slug: string | null = null;
    if (isForm) {
      const formData = await req.formData();
      toolkit_slug = (formData.get("toolkit_slug") as string) ?? null;
    } else {
      const body = await req.json();
      toolkit_slug = body.toolkit_slug ?? null;
    }

    const priceId = toolkit_slug ? TOOLKIT_PRICE_IDS[toolkit_slug] : undefined;
    if (!toolkit_slug || !priceId) {
      console.error("[checkout] Invalid toolkit:", toolkit_slug, {
        STRIPE_JOBSEEKER_PRICE_ID: !!process.env.STRIPE_JOBSEEKER_PRICE_ID,
        STRIPE_CREATOR_PRICE_ID:   !!process.env.STRIPE_CREATOR_PRICE_ID,
        STRIPE_MARKETING_PRICE_ID: !!process.env.STRIPE_MARKETING_PRICE_ID,
        STRIPE_BUSINESS_PRICE_ID:  !!process.env.STRIPE_BUSINESS_PRICE_ID,
        STRIPE_LEGAL_PRICE_ID:     !!process.env.STRIPE_LEGAL_PRICE_ID,
        STRIPE_EXAM_PRICE_ID:      !!process.env.STRIPE_EXAM_PRICE_ID,
        STRIPE_BUNDLE_PRICE_ID:    !!process.env.STRIPE_BUNDLE_PRICE_ID,
      });
      if (isForm) return NextResponse.redirect(new URL("/pricing", req.url), 303);
      return NextResponse.json({ error: "Invalid toolkit" }, { status: 400 });
    }

    // ── Auth: cookie-based (form) → Bearer token fallback (API) ──────
    let user = null;

    // 1. Cookie auth — works for browser form submissions (cookies auto-sent)
    const serverClient = await createServerClient();
    const { data: cookieData } = await serverClient.auth.getUser();
    user = cookieData.user;

    // 2. Bearer token fallback — for programmatic API calls
    if (!user) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        const admin = createAdminClient();
        const { data } = await admin.auth.getUser(token);
        user = data.user;
      }
    }

    if (!user) {
      if (isForm) return NextResponse.redirect(new URL("/login?next=/pricing", req.url), 303);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ── Create Stripe checkout session ────────────────────────────────
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=${toolkit_slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: user.email,
      metadata: { user_id: user.id, toolkit_slug },
    });

    // Form submission → redirect browser directly to Stripe
    if (isForm) return NextResponse.redirect(stripeSession.url!, 303);
    // JSON API → return URL for client-side redirect
    return NextResponse.json({ url: stripeSession.url });

  } catch (err: unknown) {
    console.error("[checkout]", err);
    if (isForm) return NextResponse.redirect(new URL("/pricing", req.url), 303);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
