"use client";

import { useState } from "react";

interface Props {
  userId: string;
  referralCount: number;
  rewardCount: number;
}

export default function ReferralBlock({ userId, referralCount, rewardCount }: Props) {
  const referralLink = `https://aitoolsstation.com/?ref=${userId}`;
  const [copied, setCopied] = useState(false);

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
      <div className="flex gap-6 text-xs text-gray-500">
        <span>
          <strong className="text-gray-900">{referralCount}</strong> referral{referralCount !== 1 ? "s" : ""}
        </span>
        <span>
          <strong className="text-gray-900">{rewardCount}</strong> month{rewardCount !== 1 ? "s" : ""} free earned
        </span>
      </div>
    </div>
  );
}
