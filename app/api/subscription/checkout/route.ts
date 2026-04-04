import { NextRequest, NextResponse } from "next/server";
import { stripe, TOOLKIT_PRICE_IDS } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { toolkit_slug } = await req.json();

    if (!toolkit_slug || !TOOLKIT_PRICE_IDS[toolkit_slug]) {
      return NextResponse.json({ error: "Invalid toolkit" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: TOOLKIT_PRICE_IDS[toolkit_slug],
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
