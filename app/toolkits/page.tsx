import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "AI Toolkits — 5 professional AI tool collections",
  description:
    "Browse all AI toolkits for job seekers, content creators, marketers, businesses, and legal needs.",
};

export default async function ToolkitsPage() {
  const supabase = createAdminClient();
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Toolkits</h1>
        <p className="text-gray-500">Each toolkit contains 10 AI tools built for a specific workflow.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(toolkits ?? []).map((kit) => (
          <Link
            key={kit.slug}
            href={`/toolkits/${kit.slug}`}
            className="border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-sm transition-all group"
          >
            <div className="text-3xl mb-3">{kit.icon}</div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">{kit.name}</h2>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">{kit.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">
                ${kit.price_monthly}<span className="text-xs font-normal text-gray-400">/month</span>
              </span>
              <span className="text-xs bg-black text-white px-3 py-1.5 rounded-lg group-hover:bg-gray-800 transition-colors">
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
