import { NextRequest, NextResponse } from "next/server";
import { stripe, TOOLKIT_PRICE_IDS } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { toolkit_slug } = await req.json();

    const priceId = TOOLKIT_PRICE_IDS[toolkit_slug];
    if (!toolkit_slug || !priceId) {
      // Log to Vercel function logs so missing env vars are visible
      console.error("[checkout] Invalid toolkit — received slug:", toolkit_slug, "| priceId resolved:", priceId, "| env var check:", {
        STRIPE_JOBSEEKER_PRICE_ID: !!process.env.STRIPE_JOBSEEKER_PRICE_ID,
        STRIPE_CREATOR_PRICE_ID:   !!process.env.STRIPE_CREATOR_PRICE_ID,
        STRIPE_MARKETING_PRICE_ID: !!process.env.STRIPE_MARKETING_PRICE_ID,
        STRIPE_BUSINESS_PRICE_ID:  !!process.env.STRIPE_BUSINESS_PRICE_ID,
        STRIPE_LEGAL_PRICE_ID:     !!process.env.STRIPE_LEGAL_PRICE_ID,
        STRIPE_EXAM_PRICE_ID:      !!process.env.STRIPE_EXAM_PRICE_ID,
        STRIPE_BUNDLE_PRICE_ID:    !!process.env.STRIPE_BUNDLE_PRICE_ID,
      });
      return NextResponse.json({ error: "Invalid toolkit" }, { status: 400 });
    }

    // 鉴权：优先 Bearer token，失败时回退到 cookie（同域请求自动携带）
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    let user = null;

    if (token) {
      const admin = createAdminClient();
      const { data } = await admin.auth.getUser(token);
      user = data.user;
    }

    if (!user) {
      // Bearer 不可用时，从请求 cookie 读取 session（同域 fetch 自动携带）
      const serverClient = await createServerClient();
      const { data } = await serverClient.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=${toolkit_slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        toolkit_slug,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
