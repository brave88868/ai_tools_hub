"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface RewardRow {
  id: string;
  uses_granted: number;
  type: string;
  reward_type: string | null;
  milestone: string | null;
  applied: boolean;
  created_at: string;
}

interface InviteRow {
  created_at: string;
}

interface ReferralDetail {
  invite_count: number;
  total_uses_granted: number;
  bonus_uses: number;
  rewards: RewardRow[];
  invites: InviteRow[];
}

const MILESTONES = [
  { invites: 1, reward: "+20 uses", label: "First Invite" },
  { invites: 5, reward: "+100 uses", label: "5 Invites" },
  { invites: 20, reward: "Pro 1 Month", label: "20 Invites" },
];

export default function ReferralsDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReferralDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      // getUser() 向服务器验证，比 getSession() 更可靠
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { setLoading(false); return; }
      setUserId(currentUser.id);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token ?? "";
      if (!accessToken) { setLoading(false); return; }
      const res = await fetch("/api/referral/detail", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setDetail(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  const referralLink = userId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${userId.slice(0, 8)}`
    : "";

  function handleCopy() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inviteCount = detail?.invite_count ?? 0;

  // Next milestone
  const nextMilestone = MILESTONES.find((m) => inviteCount < m.invites);
  const nextMilestoneText = nextMilestone
    ? `${nextMilestone.invites - inviteCount} more invite${nextMilestone.invites - inviteCount !== 1 ? "s" : ""} to unlock ${nextMilestone.reward}`
    : "All milestones unlocked! 🎉";

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Dashboard
        </Link>
        <span className="text-gray-200">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Invite Friends</h1>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Invite link */}
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Invite friends → earn free Bundle access</h2>
            <p className="text-sm text-gray-500 mb-4">
              Each successful referral = <strong>1 free month of All Toolkits Bundle ($49 value)</strong> for you.
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 border border-indigo-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none font-mono"
              />
              <button
                onClick={handleCopy}
                className="bg-black text-white text-sm px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap font-semibold"
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Invites", value: inviteCount },
              {
                label: "Rewards Earned",
                value: `+${detail?.total_uses_granted ?? 0} uses`,
              },
              { label: "Next Milestone", value: nextMilestone ? nextMilestone.reward : "All done 🎉" },
            ].map(({ label, value }) => (
              <div key={label} className="border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Milestone progress */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Milestone Progress</h2>
            <div className="space-y-5">
              {MILESTONES.map((m) => {
                const pct = Math.min(100, Math.round((inviteCount / m.invites) * 100));
                const done = inviteCount >= m.invites;
                return (
                  <div key={m.invites}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${done ? "text-green-600" : "text-gray-700"}`}>
                          {done ? "✓" : `${inviteCount}/${m.invites}`} — {m.label}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${done ? "text-green-600" : "text-indigo-600"}`}>
                        {m.reward}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${done ? "bg-green-400" : "bg-indigo-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {nextMilestone && (
              <p className="text-xs text-gray-400 mt-4 text-center">{nextMilestoneText}</p>
            )}
          </div>

          {/* Invite history */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Invite History</h2>
            </div>
            {!detail?.invites.length ? (
              <p className="text-gray-400 text-sm px-5 py-8 text-center">
                No invites yet. Share your link to start earning!
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400">
                    <th className="text-left px-5 py-3 font-medium">#</th>
                    <th className="text-left px-5 py-3 font-medium">Signed Up</th>
                    <th className="text-right px-5 py-3 font-medium">Reward</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.invites.map((inv, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {new Date(inv.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-semibold text-green-600">+20 uses</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Rewards Status */}
          {!!detail?.rewards.length && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Reward Status</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400">
                    <th className="text-left px-5 py-3 font-medium">Reward</th>
                    <th className="text-left px-5 py-3 font-medium">Earned</th>
                    <th className="text-right px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.rewards.map((rw, i) => {
                    const rewardLabel =
                      rw.reward_type === "free_month_bundle"
                        ? "Free Bundle Month"
                        : rw.uses_granted
                        ? `+${rw.uses_granted} uses`
                        : rw.milestone ?? "Bonus";
                    return (
                      <tr key={rw.id ?? i} className="hover:bg-gray-50">
                        <td className="px-5 py-3 text-xs text-gray-800 font-medium">{rewardLabel}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {new Date(rw.created_at).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {rw.applied ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              ✓ Applied
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 px-5 py-3 border-t border-gray-100">
                Free month rewards are applied every Sunday. Pending rewards will be active within 7 days.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
