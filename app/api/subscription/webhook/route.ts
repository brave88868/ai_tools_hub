import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { user_id, toolkit_slug } = session.metadata ?? {};
    const subscription_id = session.subscription as string;

    if (user_id && toolkit_slug && subscription_id) {
      const sub = await stripe.subscriptions.retrieve(subscription_id);

      await supabase.from("subscriptions").upsert({
        user_id,
        toolkit_slug,
        stripe_subscription_id: subscription_id,
        stripe_customer_id: session.customer as string,
        status: "active",
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: "user_id,toolkit_slug" });

      await supabase.from("analytics_events").insert({
        event_type: "subscription_created",
        user_id,
        toolkit_slug,
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

    await supabase
      .from("subscriptions")
      .update({
        status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", sub.id);
  }

  if (event.type === "price.updated") {
    const price = event.data.object as Stripe.Price;
    const lookupKey = price.lookup_key ?? "";
    // lookup_key 格式: "exam_toolkit_monthly" → slug = "exam"
    const slug = lookupKey.split("_toolkit_")[0];
    const newPrice = Math.round((price.unit_amount ?? 0) / 100);

    if (slug && newPrice > 0) {
      await supabase
        .from("toolkits")
        .update({ price_monthly: newPrice })
        .eq("slug", slug);

      console.log(`[webhook] price.updated: ${slug} → $${newPrice}`);
    }
  }

  return NextResponse.json({ received: true });
}
