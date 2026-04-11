"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ToolkitTabsClient from "@/components/home/ToolkitTabsClient";

const GROUPS = [
  {
    label: "For Job Seekers & Students",
    slugs: ["jobseeker", "hr-hiring", "exam"],
  },
  {
    label: "For Professionals",
    slugs: ["work-life-templates", "productivity", "document", "meeting", "knowledge"],
  },
  {
    label: "For Business",
    slugs: ["business", "sales", "finance", "email-marketing", "presentation-toolkit", "customer-support"],
  },
  {
    label: "For Creators & Marketers",
    slugs: ["creator", "social-media", "seo-content", "marketing", "ai-prompts"],
  },
  {
    label: "For Developers & Analysts",
    slugs: ["data-analytics", "workflow-automation-toolkit", "ai-workflow"],
  },
  {
    label: "For Legal & Compliance",
    slugs: ["legal", "compliance-toolkit"],
  },
];

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

  const bundle = toolkits.find((k) => k.slug === "bundle");
  const regular = toolkits.filter((k) => k.slug !== "bundle");

  const toolkitMap = Object.fromEntries(
    regular.map((kit) => [kit.slug, kit])
  );

  return (
    <main className="max-w-6xl mx-auto px-4 pt-6 pb-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Toolkits for Professional Workflows</h1>
        <p className="text-base text-gray-600">24 toolkits · 600+ AI tools — pick what you need</p>
      </div>

      {/* Bundle Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-2xl mb-1">⚡</div>
            <h3 className="text-white font-bold text-lg mb-0.5">{bundle?.name ?? "All Toolkits Bundle"}</h3>
            <p className="text-white/70 text-sm">{bundle?.description ?? "Get unlimited access to all toolkits — best value"}</p>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-white font-bold text-2xl">
              ${bundle?.price_monthly ?? 49}<span className="text-base font-normal text-white/70">/mo</span>
            </span>
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

      {/* Pricing info */}
      <p className="text-center text-sm text-gray-500 mb-4">
        Individual toolkits from <strong className="text-gray-700">$9/mo</strong> ·{" "}
        All toolkits bundle <strong className="text-gray-700">$49/mo</strong> ·{" "}
        Cancel anytime
      </p>

      {/* Grouped Tabs */}
      {regular.length > 0 && (
        <ToolkitTabsClient
          groups={GROUPS}
          toolkitMap={toolkitMap}
          onSubscribe={handleSubscribe}
          subscribingSlug={subscribingSlug}
        />
      )}
    </main>
  );
}
