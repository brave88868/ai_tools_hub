import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, unauthorized } from "@/lib/auth-admin";
import { stripe, TOOLKIT_PRICE_IDS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { toolkit_id, name, description, price_monthly, icon, sort_order, is_active } = body;

  if (!toolkit_id) {
    return NextResponse.json({ error: "toolkit_id is required" }, { status: 400 });
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Fetch current slug before update (needed for Stripe lookup)
  const { data: existing } = await auth.admin
    .from("toolkits")
    .select("slug")
    .eq("id", toolkit_id)
    .single();

  const { error } = await auth.admin
    .from("toolkits")
    .update({
      name: name.trim(),
      description: description?.trim() ?? null,
      price_monthly: price_monthly !== "" && price_monthly != null ? Number(price_monthly) : null,
      icon: icon?.trim() ?? null,
      sort_order: parseInt(sort_order) || 0,
      is_active: Boolean(is_active),
    })
    .eq("id", toolkit_id);

  if (error) {
    console.error("[admin/toolkits/update]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── Sync name + description to Stripe product (non-fatal) ────────────────
  if (existing?.slug) {
    const priceId = TOOLKIT_PRICE_IDS[existing.slug];
    if (priceId) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        const productId = typeof price.product === "string" ? price.product : price.product?.id;
        if (productId) {
          await stripe.products.update(productId, {
            name: name.trim(),
            ...(description?.trim() ? { description: description.trim() } : {}),
          });
          console.log("[admin/toolkits/update] Stripe product synced:", productId);
        }
      } catch (stripeErr) {
        // Non-fatal — DB already updated, just log
        console.warn("[admin/toolkits/update] Stripe sync failed (non-fatal):", stripeErr);
      }
    } else {
      console.log("[admin/toolkits/update] No Stripe price configured for toolkit:", existing.slug);
    }
  }

  return NextResponse.json({ success: true });
}
