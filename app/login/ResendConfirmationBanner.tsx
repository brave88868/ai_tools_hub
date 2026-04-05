"use client";

import { useState } from "react";

export default function ResendConfirmationBanner({ email: initialEmail }: { email?: string }) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleResend() {
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to resend. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="max-w-md mx-auto mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 text-center">
        ✓ Confirmation email resent to <strong>{email}</strong>. Please check your inbox.
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
      <p className="text-sm font-medium text-amber-800 mb-1">Confirmation link expired</p>
      <p className="text-xs text-amber-600 mb-3">
        Your confirmation link has expired or is invalid. Enter your email to receive a new one.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="flex-1 border border-amber-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-amber-400 bg-white"
        />
        <button
          onClick={handleResend}
          disabled={status === "sending" || !email.trim()}
          className="bg-amber-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {status === "sending" ? "Sending…" : "Resend Email"}
        </button>
      </div>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
      )}
    </div>
  );
}
