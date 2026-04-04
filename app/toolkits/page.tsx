import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "AI Toolkits — 6 professional AI tool collections",
  description:
    "Browse all AI toolkits for job seekers, content creators, marketers, businesses, legal needs, and students.",
};

const TOOLKIT_COLORS: Record<string, string> = {
  jobseeker: "border-l-blue-400",
  creator: "border-l-purple-400",
  marketing: "border-l-orange-400",
  business: "border-l-green-400",
  legal: "border-l-red-400",
  exam: "border-l-yellow-400",
};

export default async function ToolkitsPage() {
  const supabase = createAdminClient();
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const bundle = (toolkits ?? []).find((k) => k.slug === "bundle");
  const regular = (toolkits ?? []).filter((k) => k.slug !== "bundle");

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 mb-1">AI Toolkits</h1>
        <p className="text-gray-500">Each toolkit contains 10 AI tools built for a specific workflow.</p>
      </div>

      {/* Bundle — full-width highlight */}
      {bundle && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="text-lg font-bold mb-1">All Toolkits Bundle</h3>
                <p className="text-indigo-100 text-sm">Get unlimited access to all 6 toolkits — best value</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">
                  $39<span className="text-lg font-normal text-indigo-200">/mo</span>
                </div>
                <Link
                  href="/pricing"
                  className="inline-block bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                >
                  Get Bundle →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular toolkits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {regular.map((kit) => (
          <Link
            key={kit.slug}
            href={`/toolkits/${kit.slug}`}
            className={`border-l-4 ${TOOLKIT_COLORS[kit.slug] ?? "border-l-gray-300"} border border-gray-100 rounded-2xl p-6 bg-white hover:shadow-sm transition-all group`}
          >
            <div className="text-3xl mb-3">{kit.icon}</div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">{kit.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                ${kit.price_monthly}<span className="text-xs font-normal text-gray-400">/month</span>
              </span>
              <span className="text-xs text-indigo-500 group-hover:text-indigo-600 transition-colors">
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
