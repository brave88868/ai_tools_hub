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
  toolkits?: string[];
  expiry?: string | null; // 'continuing' | ISO date string | null
}

const TOOLKIT_COLORS: Record<string, string> = {
  bundle: "bg-purple-100 text-purple-700",
  jobseeker: "bg-blue-100 text-blue-700",
  creator: "bg-pink-100 text-pink-700",
  marketing: "bg-green-100 text-green-700",
  business: "bg-orange-100 text-orange-700",
  legal: "bg-yellow-100 text-yellow-700",
  exam: "bg-cyan-100 text-cyan-700",
  // 6 new toolkits (2026-04-07)
  "data-analytics": "bg-sky-100 text-sky-700",
  "sales": "bg-orange-100 text-orange-800",
  "social-media": "bg-rose-100 text-rose-700",
  "document": "bg-slate-100 text-slate-700",
  "productivity": "bg-amber-100 text-amber-700",
  "ai-prompts": "bg-violet-100 text-violet-700",
  "work-life-templates": "bg-teal-100 text-teal-700",
  "finance": "bg-emerald-100 text-emerald-700",
  "ai-workflow": "bg-cyan-100 text-cyan-700",
};
const TOOLKIT_DEFAULT_COLOR = "bg-gray-100 text-gray-600";

interface BannedIp {
  id: string;
  ip: string;
  reason: string | null;
  created_at: string;
}

interface ToolkitOption {
  slug: string;
  name: string;
}

function randomPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newPassword, setNewPassword] = useState(randomPassword());
  const [newToolkit, setNewToolkit] = useState("free");
  const [toolkitOptions, setToolkitOptions] = useState<ToolkitOption[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  // IP ban
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    supabase
      .from("toolkits")
      .select("slug, name")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setToolkitOptions(data ?? []));
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
      setUsers((prev) => prev.map((u) => u.id === userId ? {
        ...u,
        role: newRole,
        plan: newRole === "pro" ? "pro" : newRole === "user" ? "free" : u.plan,
      } : u));
      setMsg("✓ Role updated");
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setActingId(null);
  }

  async function handlePlanChange(userId: string, newPlan: string) {
    setActingId(userId);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/update-user-plan", {
      method: "PATCH", headers,
      body: JSON.stringify({ user_id: userId, plan: newPlan }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: newPlan } : u));
      setMsg("✓ Plan updated");
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

  async function handleDelete(userId: string, email: string | null) {
    if (!window.confirm(`Delete ${email ?? userId}? This cannot be undone.`)) return;
    setActingId(userId);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/delete-user", {
      method: "DELETE", headers,
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMsg("✓ User deleted");
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setActingId(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setMsg("");
    const headers = await authHeader();
    const res = await fetch("/api/admin/create-user", {
      method: "POST", headers,
      body: JSON.stringify({
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
        toolkit_slug: newToolkit !== "free" ? newToolkit : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      const created: UserRow = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        plan: data.user.plan,
        usage_count: 0,
        banned: false,
        created_at: new Date().toISOString(),
        toolkits: newToolkit !== "free" ? [newToolkit] : [],
      };
      setUsers((prev) => [created, ...prev]);
      setMsg("✓ User created");
      setShowAddForm(false);
      setNewEmail("");
      setNewRole("user");
      setNewPassword(randomPassword());
      setNewToolkit("free");
    } else {
      setMsg(`✗ ${data.error}`);
    }
    setAddLoading(false);
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
          <div className="flex items-center gap-3">
            {msg && <p className="text-sm text-gray-600">{msg}</p>}
            <button
              onClick={() => { setShowAddForm((v) => !v); setMsg(""); }}
              className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Add User
            </button>
          </div>
        </div>

        {/* Inline add-user form */}
        {showAddForm && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">New User</h2>
            <form onSubmit={handleCreateUser} className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Email</label>
                <input
                  type="email" required value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Role</label>
                <select
                  value={newRole} onChange={(e) => setNewRole(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="user">user</option>
                  <option value="pro">pro</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Toolkit</label>
                <select
                  value={newToolkit} onChange={(e) => setNewToolkit(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="free">No Toolkit (free)</option>
                  {toolkitOptions.map((t) => (
                    <option key={t.slug} value={t.slug}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Password</label>
                <input
                  type="text" required value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-36 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit" disabled={addLoading}
                className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {addLoading ? "Creating…" : "Create User"}
              </button>
              <button
                type="button" onClick={() => { setShowAddForm(false); setMsg(""); }}
                className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-center px-3 py-3 font-medium">Role</th>
                    <th className="text-center px-3 py-3 font-medium">Plan</th>
                    <th className="text-left px-3 py-3 font-medium">Toolkits</th>
                    <th className="text-left px-3 py-3 font-medium">Expiry</th>
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
                        <div className="flex flex-col items-center gap-1">
                          <select value={u.role ?? "user"} disabled={actingId === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white disabled:opacity-50">
                            <option value="user">user</option>
                            <option value="pro">pro</option>
                            <option value="admin">admin</option>
                          </select>
                          {u.role === "admin" && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">Admin</span>
                          )}
                          {u.role === "pro" && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Pro</span>
                          )}
                          {(!u.role || u.role === "user") && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Free</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <select
                          value={u.plan ?? "free"}
                          disabled={actingId === u.id}
                          onChange={(e) => handlePlanChange(u.id, e.target.value)}
                          className={`text-xs border rounded px-1.5 py-0.5 bg-white disabled:opacity-50 ${
                            u.plan === "pro"
                              ? "border-indigo-200 text-indigo-700"
                              : "border-gray-200 text-gray-500"
                          }`}
                        >
                          <option value="free">free</option>
                          <option value="pro">pro</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        {(u.toolkits ?? []).length === 0 ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {(u.toolkits ?? []).map((slug) => (
                              <span
                                key={slug}
                                className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TOOLKIT_COLORS[slug] ?? TOOLKIT_DEFAULT_COLOR}`}
                              >
                                {slug === "bundle" ? "Bundle" : slug}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs">
                        {!u.expiry ? (
                          <span className="text-gray-300">N/A</span>
                        ) : u.expiry === "continuing" ? (
                          <span className="text-green-600 font-medium">Continuing</span>
                        ) : (
                          <span className="text-orange-500">
                            {new Date(u.expiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-gray-500">{u.usage_count ?? 0}</td>
                      <td className="px-3 py-2.5 text-center">
                        {u.banned
                          ? <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Banned</span>
                          : <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleBanToggle(u.id, !u.banned)}
                            disabled={actingId === u.id}
                            className={`text-xs px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors ${u.banned ? "border border-gray-200 text-gray-600 hover:border-gray-400" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                          >
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            disabled={actingId === u.id || u.id === currentUserId}
                            title={u.id === currentUserId ? "Cannot delete yourself" : "Delete user"}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Delete
                          </button>
                        </div>
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
