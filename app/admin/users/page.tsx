"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserRow {
  id: string;
  email: string | null;
  role: string | null;
  plan: string | null;
  usage_count: number | null;
  banned: boolean | null;
  created_at: string;
}

interface BannedIp {
  id: string;
  ip: string;
  reason: string | null;
  created_at: string;
}

async function authHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    "Authorization": `Bearer ${session?.access_token ?? ""}`,
    "Content-Type": "application/json",
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [ipInput, setIpInput] = useState("");
  const [ipReason, setIpReason] = useState("");
  const [ipMsg, setIpMsg] = useState("");

  async function loadUsers() {
    const headers = await authHeader();
    const res = await fetch("/api/admin/users", { headers });
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }

  async function loadBannedIps() {
    const headers = await authHeader();
    const res = await fetch("/api/admin/users/ban-ip", { headers });
    const data = await res.json();
    setBannedIps(data.banned_ips ?? []);
  }

  useEffect(() => {
    loadUsers();
    loadBannedIps();
  }, []);

  async function handleRoleChange(userId: string, newRole: string) {
    setActingId(userId);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/users/set-role", {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setMsg("✓ Role updated");
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setActingId(null);
  }

  async function handleBanToggle(userId: string, banned: boolean) {
    setActingId(userId);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/users/ban", {
      method: "POST", headers,
      body: JSON.stringify({ user_id: userId, banned }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, banned } : u));
      setMsg(banned ? "✓ User banned" : "✓ User unbanned");
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setActingId(null);
  }

  async function handleBanIp(e: React.FormEvent) {
    e.preventDefault();
    setIpMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/users/ban-ip", {
      method: "POST", headers,
      body: JSON.stringify({ ip: ipInput.trim(), reason: ipReason }),
    });
    const data = await res.json();
    if (res.ok) {
      setIpMsg("✓ IP banned");
      setIpInput(""); setIpReason("");
      loadBannedIps();
    } else {
      setIpMsg(`✗ ${data.error}`);
    }
  }

  async function handleUnbanIp(ip: string) {
    const headers = await authHeader();
    await fetch("/api/admin/users/ban-ip", {
      method: "DELETE", headers,
      body: JSON.stringify({ ip }),
    });
    setBannedIps((prev) => prev.filter((b) => b.ip !== ip));
  }

  return (
    <div className="space-y-10">
      {/* Users table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            Users <span className="text-gray-400 font-normal text-base">({users.length})</span>
          </h1>
          {msg && <p className="text-sm text-gray-600">{msg}</p>}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-center px-3 py-3 font-medium">Role</th>
                    <th className="text-center px-3 py-3 font-medium">Plan</th>
                    <th className="text-center px-3 py-3 font-medium">Uses</th>
                    <th className="text-center px-3 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Joined</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className={u.banned ? "bg-red-50" : "hover:bg-gray-50"}>
                      <td className="px-4 py-2.5 text-gray-800 text-xs max-w-[200px] truncate">{u.email ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center">
                        <select value={u.role ?? "user"} disabled={actingId === u.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white disabled:opacity-50">
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.plan === "pro" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
                          {u.plan ?? "free"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-500">{u.usage_count ?? 0}</td>
                      <td className="px-3 py-2.5 text-center">
                        {u.banned
                          ? <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Banned</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => handleBanToggle(u.id, !u.banned)} disabled={actingId === u.id}
                          className={`text-xs px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors ${u.banned ? "border border-gray-200 text-gray-600 hover:border-gray-400" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* IP Ban */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">IP Bans</h2>
        <form onSubmit={handleBanIp} className="flex gap-2 mb-4 flex-wrap">
          <input type="text" value={ipInput} onChange={(e) => setIpInput(e.target.value)}
            placeholder="IP address (e.g. 1.2.3.4)" required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <input type="text" value={ipReason} onChange={(e) => setIpReason(e.target.value)}
            placeholder="Reason (optional)"
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <button type="submit" className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Ban IP</button>
          {ipMsg && <span className="self-center text-sm text-gray-600">{ipMsg}</span>}
        </form>

        {bannedIps.length === 0 ? (
          <p className="text-gray-400 text-sm">No banned IPs.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  <th className="text-left px-4 py-3 font-medium">IP</th>
                  <th className="text-left px-4 py-3 font-medium">Reason</th>
                  <th className="text-right px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bannedIps.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{b.ip}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{b.reason ?? "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => handleUnbanIp(b.ip)} className="text-xs text-red-400 hover:text-red-600">Unban</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
