"use client";

import { useState } from "react";
import Link from "next/link";

interface Subscription {
  toolkit_slug: string;
  status: string;
  current_period_end: string | null;
  stripe_subscription_id: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  // Treat missing/epoch data (before 2000) as unset
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface ConfirmModalProps {
  endDate: string;
  onKeep: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function CancelConfirmModal({ endDate, onKeep, onConfirm, loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onKeep}
      />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Cancel subscription?</h3>
        <p className="text-sm text-gray-700 mb-6">
          Are you sure? You&apos;ll keep access until{" "}
          <span className="font-medium text-gray-700">{endDate}</span>.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onKeep}
            className="w-full bg-indigo-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Keep Subscription
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full border border-red-200 text-red-600 text-sm py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {loading ? "Canceling…" : "Cancel Subscription"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionList({ subscriptions }: { subscriptions: Subscription[] }) {
  const [subs, setSubs] = useState(subscriptions);
  const [pendingSub, setPendingSub] = useState<Subscription | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (subs.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center">
        <p className="text-gray-600 text-sm mb-4">No active subscriptions yet.</p>
        <Link
          href="/pricing"
          className="inline-block bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
        >
          View Plans →
        </Link>
      </div>
    );
  }

  async function handleConfirmCancel() {
    if (!pendingSub) return;
    setCanceling(true);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripe_subscription_id: pendingSub.stripe_subscription_id,
        }),
      });

      if (res.ok) {
        const endDate = formatDate(pendingSub.current_period_end);
        setSubs((prev) =>
          prev.map((s) =>
            s.stripe_subscription_id === pendingSub.stripe_subscription_id
              ? { ...s, status: "canceling" }
              : s
          )
        );
        setSuccessMsg(`Subscription cancelled. Access continues until ${endDate}.`);
        setPendingSub(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to cancel. Please try again.");
      }
    } catch {
      alert("Failed to cancel. Please try again.");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <>
      {/* Cancel confirm modal */}
      {pendingSub && (
        <CancelConfirmModal
          endDate={formatDate(pendingSub.current_period_end)}
          onKeep={() => setPendingSub(null)}
          onConfirm={handleConfirmCancel}
          loading={canceling}
        />
      )}

      {/* Success message */}
      {successMsg && (
        <div className="mb-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-3">
        {subs.map((sub) => {
          const isCanceling = sub.status === "canceling";
          const endDate = formatDate(sub.current_period_end);
          return (
            <div
              key={sub.stripe_subscription_id}
              className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {sub.toolkit_slug} Toolkit
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {isCanceling
                    ? `Access until ${endDate}`
                    : `Renews ${endDate}`}
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
                    onClick={() => { setSuccessMsg(null); setPendingSub(sub); }}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
