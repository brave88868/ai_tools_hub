"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
}

interface ReferralStats {
  invited_count: number;
  paid_count: number;
  rewards_count: number;
}

export default function ReferralBlock({ userId }: Props) {
  const referralLink = `https://aitoolsstation.com/?ref=${userId.slice(0, 8)}`;
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    invited_count: 0,
    paid_count: 0,
    rewards_count: 0,
  });

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/referral/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    }
    loadStats();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-3">
        Share your link. When a friend subscribes, you earn 1 free month.
      </p>

      {/* Referral link */}
      <div className="flex items-center gap-2 mb-4">
        <input
          readOnly
          value={referralLink}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 bg-gray-50 focus:outline-none"
        />
        <button
          onClick={handleCopy}
          className="text-xs bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span>
          Invited:{" "}
          <strong className="text-gray-900">{stats.invited_count}</strong>{" "}
          {stats.invited_count === 1 ? "user" : "users"}
        </span>
        <span>
          Paid:{" "}
          <strong className="text-gray-900">{stats.paid_count}</strong>
        </span>
        <span>
          Rewards:{" "}
          <strong className="text-gray-900">{stats.rewards_count}</strong>{" "}
          {stats.rewards_count === 1 ? "month" : "months"} free
        </span>
      </div>
    </div>
  );
}
