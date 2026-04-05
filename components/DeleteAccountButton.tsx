"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {},
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete account.");
        setLoading(false);
        return;
      }
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-red-200 rounded-xl p-4 text-center text-sm text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors w-full"
      >
        Delete Account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Delete your account?</h2>
            <p className="text-sm text-gray-500 mb-4">
              This will permanently delete your account and all associated data.
              This action <strong>cannot be undone</strong>.
            </p>
            {error && (
              <p className="text-xs text-red-500 mb-3">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setError(""); }}
                disabled={loading}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
