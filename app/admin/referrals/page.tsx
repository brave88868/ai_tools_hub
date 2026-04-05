import { createAdminClient } from "@/lib/supabase";

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  status: string;
  created_at: string;
  referrer_email: string | null;
  referred_email: string | null;
  reward_applied: boolean;
}

export default async function AdminReferralsPage() {
  const admin = createAdminClient();

  // Fetch referrals with referrer and referred user info via FK joins
  const { data: referrals } = await admin
    .from("referrals")
    .select(`
      id,
      referrer_id,
      referred_user_id,
      status,
      created_at,
      referrer:users!referrals_referrer_id_fkey(email),
      referred:users!referrals_referred_user_id_fkey(email)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  // Fetch reward flags per referral (which referrers have been rewarded)
  const referrerIds = [...new Set((referrals ?? []).map((r) => r.referrer_id))];
  const rewardedSet = new Set<string>();
  if (referrerIds.length > 0) {
    const { data: rewards } = await admin
      .from("referral_rewards")
      .select("user_id")
      .in("user_id", referrerIds);
    (rewards ?? []).forEach((r: { user_id: string }) => rewardedSet.add(r.user_id));
  }

  const rows: ReferralRow[] = (referrals ?? []).map((r) => ({
    id: r.id,
    referrer_id: r.referrer_id,
    referred_user_id: r.referred_user_id,
    status: r.status,
    created_at: r.created_at,
    referrer_email: (r.referrer as unknown as { email: string } | null)?.email ?? null,
    referred_email: (r.referred as unknown as { email: string } | null)?.email ?? null,
    reward_applied: rewardedSet.has(r.referrer_id),
  }));

  const stats = {
    total: rows.length,
    pending: rows.filter((r) => r.status === "pending").length,
    completed: rows.filter((r) => r.status === "completed").length,
    rewarded: rows.filter((r) => r.status === "rewarded").length,
  };

  const statusStyle: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    rewarded: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">
        Referrals <span className="text-gray-400 font-normal text-base">({rows.length})</span>
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Completed", value: stats.completed },
          { label: "Rewarded", value: stats.rewarded },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left px-4 py-3 font-medium">Invited User</th>
                <th className="text-left px-4 py-3 font-medium">Referred By</th>
                <th className="text-center px-3 py-3 font-medium">Status</th>
                <th className="text-center px-3 py-3 font-medium">Reward</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                    No referrals yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-700 truncate max-w-[200px]">
                      {row.referred_email ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 truncate max-w-[200px]">
                      {row.referrer_email ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusStyle[row.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {row.reward_applied ? (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                          ✓ Applied
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-400">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
