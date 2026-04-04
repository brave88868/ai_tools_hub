import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Pricing | AI Tools Hub",
  description:
    "Simple pricing for AI Tools Hub. Start free or subscribe to any AI toolkit. Each toolkit is billed separately.",
};

export default async function PricingPage() {
  const supabase = createAdminClient();

  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("slug, name, description, price_monthly, icon, id")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Simple Pricing</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Start for free. Subscribe to the toolkit you need — pay only for what you use.
        </p>
      </div>

      {/* Free Plan */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Free Plan</h2>
              <p className="text-gray-400 text-sm">No account required. No credit card needed.</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm ml-1">/month</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Daily generations", value: "3/day" },
              { label: "Lifetime uses", value: "30 total" },
              { label: "Tools available", value: "All 50+" },
              { label: "Credit card", value: "Not required" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-sm font-semibold text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href="/toolkits"
              className="inline-block border border-gray-300 text-gray-700 rounded-xl px-6 py-2.5 text-sm font-medium hover:border-gray-500 transition-colors"
            >
              Start for Free →
            </Link>
          </div>
        </div>
      </div>

      {/* Toolkit Subscriptions */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Toolkit Subscriptions</h2>
          <p className="text-gray-500 text-sm">
            Subscribe to any toolkit independently. Each subscription gives you unlimited daily access to all tools in that toolkit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(toolkits ?? []).map((kit) => (
            <div
              key={kit.slug}
              className="border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <div className="text-3xl mb-3">{kit.icon}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-5">{kit.description}</p>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">${kit.price_monthly}</span>
                  <span className="text-xs text-gray-400 ml-1">/month</span>
                </div>
                <Link
                  href="/login"
                  className="text-xs bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Subscribe
                </Link>
              </div>

              <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All tools in this toolkit</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> All future tools included</li>
                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Cancel anytime</li>
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-2xl mx-auto mb-16">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Free vs Subscribed</h2>
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-gray-600 font-medium">Feature</th>
                <th className="text-center px-6 py-4 text-gray-600 font-medium">Free</th>
                <th className="text-center px-6 py-4 text-gray-900 font-semibold">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Daily generations", "3/day", "Unlimited"],
                ["Lifetime uses", "30 total", "Unlimited"],
                ["All AI tools", "✓", "✓"],
                ["Future tools", "✓", "✓"],
                ["Priority processing", "—", "✓"],
                ["Account required", "No", "Yes"],
                ["Cancel anytime", "—", "✓"],
              ].map(([feature, free, pro]) => (
                <tr key={feature}>
                  <td className="px-6 py-4 text-gray-600">{feature}</td>
                  <td className="px-6 py-4 text-center text-gray-500">{free}</td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "Do I need a credit card for the free plan?",
              a: "No. You can start using any AI tool immediately — no account or credit card needed.",
            },
            {
              q: "Can I subscribe to just one toolkit?",
              a: "Yes. Each toolkit is billed separately. Subscribe only to what you need.",
            },
            {
              q: "What happens when I reach the free limit?",
              a: "You'll see an upgrade prompt. You can subscribe to any toolkit to continue.",
            },
            {
              q: "Do I get access to all tools in a toolkit?",
              a: "Yes. A toolkit subscription includes all current and future tools in that toolkit.",
            },
            {
              q: "Will more tools be added?",
              a: "Yes. New tools are added regularly and automatically included in your subscription.",
            },
            {
              q: "Can I cancel anytime?",
              a: "Yes. Cancel anytime from your dashboard. No contracts, no questions asked.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
