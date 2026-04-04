"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TOOLKIT_COLORS: Record<string, string> = {
  jobseeker: "border-l-blue-400",
  creator: "border-l-purple-400",
  marketing: "border-l-orange-400",
  business: "border-l-green-400",
  legal: "border-l-red-400",
  exam: "border-l-yellow-400",
};

interface Toolkit {
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  icon: string;
}

export default function ToolkitsPage() {
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

  const regular = toolkits.filter((k) => k.slug !== "bundle");

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <p className="text-sm text-gray-500 mb-4">Each toolkit contains 10 AI tools built for a specific workflow.</p>

      {/* Bundle Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-2xl mb-1">⚡</div>
            <h3 className="text-white font-bold text-lg mb-0.5">All Toolkits Bundle</h3>
            <p className="text-white/70 text-sm">Get unlimited access to all 6 toolkits — best value</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white font-bold text-2xl">$39<span className="text-base font-normal text-white/70">/mo</span></span>
            <button
              onClick={() => handleSubscribe("bundle")}
              disabled={subscribingSlug === "bundle"}
              className="bg-white text-indigo-600 font-medium text-sm px-5 py-2 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {subscribingSlug === "bundle" ? "Loading…" : "Get Bundle →"}
            </button>
          </div>
        </div>
      </div>

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
                ${kit.price_monthly}<span className="text-xs font-medium text-gray-700">/month</span>
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
