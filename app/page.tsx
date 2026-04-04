import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "AI Tools Hub — 50+ AI tools to boost productivity",
  description:
    "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
};

export default async function HomePage() {
  const supabase = createAdminClient();

  const { data: popularTools } = await supabase
    .from("tools")
    .select("slug, name, description, toolkits(slug)")
    .eq("is_active", true)
    .order("sort_order")
    .limit(6);

  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-20 text-center">
        <div className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full mb-6">
          50+ AI tools · Free to start
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
          AI Tools for Real<br />Workflows
        </h1>
        <p className="text-xl text-gray-500 mb-8 max-w-xl mx-auto">
          AI tools for job seekers, content creators, marketers, and small businesses.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/toolkits"
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Start Using Tools →
          </Link>
          <Link
            href="/pricing"
            className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors"
          >
            See Pricing
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free · 3 uses/day · No credit card required</p>
      </section>

      {/* Popular Tools */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Popular Tools</h2>
          <Link href="/toolkits" className="text-sm text-gray-400 hover:text-gray-600">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(popularTools ?? []).map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="border border-gray-200 rounded-xl p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-black">{tool.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{tool.description}</p>
              <div className="mt-3 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Try tool →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Toolkits */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Toolkits</h2>
            <p className="text-gray-500 text-sm">Each toolkit is a collection of AI tools built for a specific workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(toolkits ?? []).map((kit) => (
              <Link
                key={kit.slug}
                href={`/toolkits/${kit.slug}`}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-sm transition-all group"
              >
                <div className="text-3xl mb-3">{kit.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">{kit.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">${kit.price_monthly}/month</span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-900 transition-colors">Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: "01", title: "Choose a tool", desc: "Browse 50+ AI tools across 5 professional toolkits." },
            { step: "02", title: "Input your content", desc: "Paste your resume, topic, contract, or any content." },
            { step: "03", title: "Get AI output", desc: "Receive optimized, ready-to-use content in seconds." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-3xl font-bold text-gray-100 mb-3">{item.step}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="bg-black text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-400 mb-10">Start free. Upgrade when you need more.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            <div className="border border-gray-700 rounded-2xl p-6">
              <div className="text-lg font-semibold mb-1">Free</div>
              <div className="text-3xl font-bold mb-4">$0</div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ 3 generations/day</li>
                <li>✓ 30 lifetime uses</li>
                <li>✓ All tools available</li>
                <li>✓ No credit card required</li>
              </ul>
            </div>
            <div className="border border-gray-500 rounded-2xl p-6 bg-gray-900">
              <div className="text-lg font-semibold mb-1">Pro</div>
              <div className="text-3xl font-bold mb-4">
                $9<span className="text-sm font-normal text-gray-400">/month per toolkit</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ 100 generations/day</li>
                <li>✓ Unlimited toolkit access</li>
                <li>✓ Priority AI processing</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-block mt-8 bg-white text-black px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            View full pricing →
          </Link>
        </div>
      </section>
    </main>
  );
}
