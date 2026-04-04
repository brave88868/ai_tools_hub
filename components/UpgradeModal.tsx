"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  toolkitSlug?: string;
}

export default function UpgradeModal({ onClose, toolkitSlug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      onClose();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit_slug: toolkitSlug ?? "jobseeker" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push(toolkitSlug ? `/pricing?toolkit=${toolkitSlug}` : "/pricing");
        onClose();
      }
    } catch {
      router.push(toolkitSlug ? `/pricing?toolkit=${toolkitSlug}` : "/pricing");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            You&apos;ve used your 3 free generations
          </h2>
          <p className="text-gray-500 text-sm">
            Subscribe to continue using AI tools with unlimited generations.
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
          <div className="text-2xl font-bold text-gray-900">
            $9<span className="text-sm font-normal text-gray-500">/month</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">Unlimited generations · Cancel anytime</div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="block w-full bg-black text-white text-center rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Loading…" : "Subscribe Now"}
          </button>
          <button
            onClick={onClose}
            className="block w-full text-gray-500 text-center rounded-xl py-3 text-sm hover:text-gray-800 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
