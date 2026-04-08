"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "invite_banner_dismissed";

export default function InviteBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-xl">🎁</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Invite friends → earn free AI uses
          </p>
          <p className="text-xs text-gray-700 mt-0.5">
            Each invite = <strong>+20 uses</strong> for you · 5 invites = Bundle Pro 1 month
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/dashboard/referrals"
          className="text-xs bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
        >
          Get My Link →
        </Link>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
