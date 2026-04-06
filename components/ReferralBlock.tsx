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

interface AffiliateStats {
  total_earned: number;
  pending: number;
  paid: number;
  commission_rate: number;
}

export default function ReferralBlock({ userId }: Props) {
  const referralLink = `https://aitoolsstation.com/?ref=${userId.slice(0, 8)}`;
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    invited_count: 0,
    paid_count: 0,
    rewards_count: 0,
  });
  const [affiliate, setAffiliate] = useState<AffiliateStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [referralRes, affiliateRes] = await Promise.all([
        fetch("/api/referral/stats", { headers }),
        fetch("/api/affiliate/stats", { headers }),
      ]);

      if (referralRes.ok) setStats(await referralRes.json());
      if (affiliateRes.ok) setAffiliate(await affiliateRes.json());
    }
    loadStats();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 space-y-4">
      <p className="text-xs text-gray-500">
        Share your link. When a friend subscribes, you earn 1 free month of All Toolkits Bundle ($49 value).
      </p>

      {/* Referral link */}
      <div className="flex items-center gap-2">
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

      {/* Referral stats */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span>
          Invited: <strong className="text-gray-900">{stats.invited_count}</strong>{" "}
          {stats.invited_count === 1 ? "user" : "users"}
        </span>
        <span>Paid: <strong className="text-gray-900">{stats.paid_count}</strong></span>
        <span>
          Rewards: <strong className="text-gray-900">{stats.rewards_count}</strong>{" "}
          {stats.rewards_count === 1 ? "month" : "months"} free
        </span>
      </div>

      {/* Affiliate commission block */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700 mb-1">
          Affiliate Commission{" "}
          <span className="text-gray-400 font-normal">
            (Earn {affiliate ? `${Math.round((affiliate.commission_rate ?? 0.20) * 100)}%` : "20%"} per paying referral)
          </span>
        </p>
        {affiliate ? (
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>
              Pending:{" "}
              <strong className="text-amber-600">
                ${(affiliate.pending / 100).toFixed(2)}
              </strong>
            </span>
            <span>
              Paid out:{" "}
              <strong className="text-green-600">
                ${(affiliate.paid / 100).toFixed(2)}
              </strong>
            </span>
            <span>
              Total earned:{" "}
              <strong className="text-gray-900">
                ${(affiliate.total_earned / 100).toFixed(2)}
              </strong>
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No commissions yet. Start referring to earn!</p>
        )}
      </div>
    </div>
  );
}
