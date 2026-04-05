"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Props {
  onClose: () => void;
  toolkitSlug?: string;
  isLoggedIn?: boolean;
  errorType?: string; // "free_limit_reached" | "lifetime_limit_reached"
}

interface PromptCopy {
  headline: string;
  subtext: string;
}

export default function UpgradeModal({ onClose, toolkitSlug, isLoggedIn = false, errorType }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState<PromptCopy | null>(null);

  useEffect(() => {
    if (!isLoggedIn || !errorType) return;
    const trigger = errorType === "lifetime_limit_reached" ? "lifetime_limit" : "daily_limit";
    fetch(`/api/revenue/upgrade-prompt?trigger=${trigger}`)
      .then((r) => r.json())
      .then((data) => setCopy({ headline: data.headline, subtext: data.subtext }))
      .catch(() => {});
    // 记录展示
    fetch("/api/revenue/track-upgrade-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger }),
    }).catch(() => {});
  }, [isLoggedIn, errorType]);

  async function handleSubscribe() {
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

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🚀</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Create a Free Account
            </h2>
            <p className="text-gray-500 text-sm">
              Get 3 free uses per day — no credit card required
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => { router.push("/signup"); onClose(); }}
              className="block w-full bg-black text-white text-center rounded-xl py-3 text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Sign Up Free →
            </button>
            <button
              onClick={() => { router.push("/login"); onClose(); }}
              className="block w-full border border-gray-200 text-gray-700 text-center rounded-xl py-3 text-sm font-medium hover:border-gray-400 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={onClose}
              className="block w-full text-gray-400 text-center rounded-xl py-3 text-sm hover:text-gray-600 transition-colors"
            >
              Maybe later
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">⭐ Trusted by 1,000+ professionals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {copy?.headline ?? "You've used your free generations"}
          </h2>
          <p className="text-gray-500 text-sm">
            {copy?.subtext ?? "Subscribe to continue using AI tools with unlimited generations."}
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

        {/* Viral referral prompt */}
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            Not ready to upgrade?{" "}
            <a
              href="/dashboard/referrals"
              onClick={onClose}
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Invite friends to unlock +20 more uses per invite →
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">⭐ Trusted by 1,000+ professionals</p>
      </div>
    </div>
  );
}
