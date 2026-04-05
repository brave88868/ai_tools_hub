import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export default async function PricingPreview() {
  const supabase = createAdminClient();
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("price_monthly")
    .eq("is_active", true)
    .neq("slug", "bundle")
    .order("price_monthly", { ascending: true })
    .limit(1);

  const minPrice = toolkits?.[0]?.price_monthly ?? 9;

  return (
    <section className="bg-gray-50 py-14 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500">Start free. Upgrade when you need more power.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Free</div>
            <div className="text-4xl font-extrabold text-gray-900 mb-1">$0</div>
            <p className="text-sm text-gray-400 mb-6">Forever free, no credit card</p>
            <ul className="space-y-2.5 text-sm text-gray-600 mb-7">
              {[
                "3 AI generations per day",
                "30 lifetime uses",
                "All 50+ tools available",
                "No credit card required",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center border-2 border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              Start Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-7 text-white">
            <div className="text-sm font-semibold text-indigo-200 uppercase tracking-wide mb-2">Pro</div>
            <div className="text-4xl font-extrabold mb-1">
              from ${minPrice}
              <span className="text-lg font-normal text-indigo-200">/mo</span>
            </div>
            <p className="text-sm text-indigo-200 mb-6">Per toolkit · Cancel anytime</p>
            <ul className="space-y-2.5 text-sm text-indigo-100 mb-7">
              {[
                "100 AI generations per day",
                "Full toolkit access",
                "Priority AI processing",
                "Download as .docx",
                "Cancel anytime",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-white font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/pricing"
              className="block text-center bg-white text-indigo-700 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              View All Plans →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          No credit card required · Cancel anytime · SSL secured
        </p>
      </div>
    </section>
  );
}
