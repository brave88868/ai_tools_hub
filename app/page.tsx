import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "AI Tools Hub — 50+ AI tools to boost productivity",
  description:
    "Free AI tools for resume optimization, content creation, marketing copy, business analysis, and legal documents.",
};

const TOOLKIT_COLORS: Record<string, string> = {
  jobseeker: "border-l-blue-400",
  creator: "border-l-purple-400",
  marketing: "border-l-orange-400",
  business: "border-l-green-400",
  legal: "border-l-red-400",
  exam: "border-l-yellow-400",
  bundle: "border-l-indigo-400",
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
    .neq("slug", "bundle")
    .order("sort_order");

  return (
    <main>
      {/* Hero — compact */}
      <section className="pt-8 pb-3 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1.5 rounded-full mb-2">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
            50+ AI tools · Free to start
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-2">
            AI Tools for{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Real Workflows
            </span>
          </h1>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mb-3">
            Professional AI tools for job seekers, creators, marketers, and businesses.
          </p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Link
              href="/toolkits"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-lg shadow-indigo-200"
            >
              Start Using Tools →
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-gray-400 transition-colors"
            >
              See Pricing
            </Link>
          </div>
          <p className="text-xs text-gray-400">Free · 3 uses/day · No credit card required</p>
        </div>
      </section>

      {/* Popular Tools — visible on first screen */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Popular Tools</h2>
          <Link href="/toolkits" className="text-sm text-indigo-500 hover:text-indigo-600">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(popularTools ?? []).map((tool) => {
            const toolkitSlug = (Array.isArray(tool.toolkits) ? tool.toolkits[0]?.slug : (tool.toolkits as { slug: string } | null)?.slug) ?? "";
            return (
              <div
                key={tool.slug}
                className="border border-gray-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-lg flex items-center justify-center text-sm">
                    {toolkitSlug === "jobseeker" ? "💼" : toolkitSlug === "creator" ? "🎬" : toolkitSlug === "marketing" ? "📣" : toolkitSlug === "business" ? "📊" : toolkitSlug === "legal" ? "⚖️" : "🎓"}
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Free</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{tool.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-2 line-clamp-2">{tool.description}</p>
                <Link href={`/tools/${tool.slug}`} className="text-xs text-indigo-500 font-medium hover:text-indigo-600">
                  Try tool →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Toolkits */}
      <section className="bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Toolkits</h2>
            <p className="text-gray-500 text-sm">Each toolkit is a collection of AI tools built for a specific workflow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(toolkits ?? []).map((kit) => (
              <Link
                key={kit.slug}
                href={`/toolkits/${kit.slug}`}
                className={`border-l-4 ${TOOLKIT_COLORS[kit.slug] ?? "border-l-gray-300"} border border-gray-100 rounded-2xl p-4 bg-white hover:shadow-sm transition-all group`}
              >
                <div className="text-2xl mb-2">{kit.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{kit.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">${kit.price_monthly}/month</span>
                  <span className="text-xs text-indigo-500 group-hover:text-indigo-600 transition-colors">Explore →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Choose a tool", desc: "Browse 50+ AI tools across 6 professional toolkits." },
            { step: "02", title: "Input your content", desc: "Paste your resume, topic, contract, or any content." },
            { step: "03", title: "Get AI output", desc: "Receive optimized, ready-to-use content in seconds." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-4xl font-bold text-gray-100 mb-2">{item.step}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="bg-black text-white py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-gray-400 mb-6">Start free. Upgrade when you need more.</p>
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
                from $9<span className="text-sm font-normal text-gray-400">/month per toolkit</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Unlimited daily generations</li>
                <li>✓ Unlimited toolkit access</li>
                <li>✓ Priority AI processing</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-block mt-5 bg-white text-black px-8 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            View full pricing →
          </Link>
        </div>
      </section>
    </main>
  );
}
