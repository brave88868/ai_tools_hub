"use client";

import { useState } from "react";
import Link from "next/link";

interface Subscription {
  toolkit_slug: string;
  status: string;
  current_period_end: string;
  stripe_subscription_id: string;
}

export default function SubscriptionList({ subscriptions }: { subscriptions: Subscription[] }) {
  const [subs, setSubs] = useState(subscriptions);
  const [canceling, setCanceling] = useState<string | null>(null);

  if (subs.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm mb-4">No active subscriptions yet.</p>
        <Link
          href="/pricing"
          className="inline-block bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          View Plans →
        </Link>
      </div>
    );
  }

  async function handleCancel(sub: Subscription) {
    const endDate = new Date(sub.current_period_end).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const confirmed = window.confirm(
      `Are you sure? You'll still have access until ${endDate}.`
    );
    if (!confirmed) return;

    setCanceling(sub.stripe_subscription_id);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripe_subscription_id: sub.stripe_subscription_id }),
      });
      if (res.ok) {
        setSubs((prev) =>
          prev.map((s) =>
            s.stripe_subscription_id === sub.stripe_subscription_id
              ? { ...s, status: "canceling" }
              : s
          )
        );
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch {
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setCanceling(null);
    }
  }

  return (
    <div className="space-y-3">
      {subs.map((sub) => {
        const isCanceling = sub.status === "canceling";
        const endDate = new Date(sub.current_period_end).toLocaleDateString("en-AU");
        return (
          <div
            key={sub.stripe_subscription_id}
            className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4"
          >
            <div>
              <div className="text-sm font-medium text-gray-900 capitalize">
                {sub.toolkit_slug} Toolkit
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {isCanceling ? `Access until ${endDate}` : `Renews ${endDate}`}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isCanceling
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isCanceling ? "Canceling" : "Active"}
              </span>
              {!isCanceling && (
                <button
                  onClick={() => handleCancel(sub)}
                  disabled={canceling === sub.stripe_subscription_id}
                  className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50"
                >
                  {canceling === sub.stripe_subscription_id ? "Canceling…" : "Cancel"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
