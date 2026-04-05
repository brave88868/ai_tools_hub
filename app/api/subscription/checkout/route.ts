import { NextRequest, NextResponse } from "next/server";
import { stripe, TOOLKIT_PRICE_IDS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

// ── Shared auth + Stripe logic ────────────────────────────────────────────────
async function resolveUser(req: NextRequest) {
  // 1. Cookie auth (browser navigation — cookies sent automatically)
  const serverClient = await createServerClient();
  const { data: cookieData } = await serverClient.auth.getUser();
  if (cookieData.user) return cookieData.user;

  // 2. Bearer token fallback (programmatic API calls)
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const admin = createAdminClient();
    const { data } = await admin.auth.getUser(token);
    if (data.user) return data.user;
  }

  return null;
}

// ── GET /api/subscription/checkout?toolkit_slug=xxx ───────────────────────────
// Used by <a href> links — simplest possible approach, no JS required
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const toolkit_slug = searchParams.get("toolkit_slug") ?? "";
  const priceId = TOOLKIT_PRICE_IDS[toolkit_slug];

  if (!toolkit_slug || !priceId) {
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  const user = await resolveUser(req);
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/pricing", req.url));
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=${toolkit_slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: user.email,
      metadata: { user_id: user.id, toolkit_slug },
    });
    return NextResponse.redirect(session.url!);
  } catch (err) {
    console.error("[checkout GET]", err);
    return NextResponse.redirect(new URL("/pricing", req.url));
  }
}

// ── POST /api/subscription/checkout ──────────────────────────────────────────
// Kept for backwards compatibility (SubscriptionList cancel flow etc.)
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const isForm = contentType.includes("application/x-www-form-urlencoded") ||
                 contentType.includes("multipart/form-data");

  try {
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
      if (isForm) return NextResponse.redirect(new URL("/pricing", req.url), 303);
      return NextResponse.json({ error: "Invalid toolkit" }, { status: 400 });
    }

    const user = await resolveUser(req);
    if (!user) {
      if (isForm) return NextResponse.redirect(new URL("/login?next=/pricing", req.url), 303);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=${toolkit_slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: user.email,
      metadata: { user_id: user.id, toolkit_slug },
    });

    if (isForm) return NextResponse.redirect(stripeSession.url!, 303);
    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error("[checkout POST]", err);
    if (isForm) return NextResponse.redirect(new URL("/pricing", req.url), 303);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
