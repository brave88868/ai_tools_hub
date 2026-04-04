"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Toolkit {
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  icon: string;
}

export default function PricingPage() {
  const router = useRouter();
  const [toolkits, setToolkits] = useState<Toolkit[]>([]);
  const [subscribingSlug, setSubscribingSlug] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("toolkits")
      .select("slug, name, description, price_monthly, icon")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setToolkits(data ?? []));
  }, []);

  async function handleSubscribe(toolkitSlug: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    setSubscribingSlug(toolkitSlug);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit_slug: toolkitSlug }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("[checkout]", data.error);
      }
    } catch (err) {
      console.error("[checkout]", err);
    } finally {
      setSubscribingSlug(null);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your AI Toolkit</h1>
        <p className="text-gray-500 text-base max-w-xl mx-auto">
          Subscribe to the toolkit you need. Start free, upgrade anytime.
        </p>
      </div>

      {/* Toolkit Subscriptions */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {toolkits.map((kit) => (
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
                <button
                  onClick={() => handleSubscribe(kit.slug)}
                  disabled={subscribingSlug === kit.slug}
                  className="text-xs bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subscribingSlug === kit.slug ? "Loading…" : "Subscribe"}
                </button>
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

      {/* Free Plan — compact single row */}
      <div className="mt-6 mb-14 border border-gray-100 rounded-xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: title + desc */}
        <div>
          <span className="text-sm font-semibold text-gray-900">Free Plan</span>
          <span className="ml-2 text-xs text-gray-400">No account required · No credit card needed</span>
        </div>

        {/* Middle: 4 metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span><strong className="text-gray-800">3/day</strong> generations</span>
          <span><strong className="text-gray-800">30</strong> lifetime uses</span>
          <span><strong className="text-gray-800">50+</strong> tools</span>
          <span><strong className="text-gray-800">$0</strong>/month</span>
        </div>

        {/* Right: CTA */}
        <Link href="/toolkits" className="text-xs border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:border-gray-500 transition-colors whitespace-nowrap">
          Start for Free →
        </Link>
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
