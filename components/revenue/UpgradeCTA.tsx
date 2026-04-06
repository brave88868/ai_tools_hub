"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Props {
  trigger: string;
  toolName?: string;
  className?: string;
}

interface PromptData {
  headline: string;
  subtext: string;
  cta_label: string;
  cta_url: string;
}

const HIDE_KEY_PREFIX = "upgrade_cta_hidden_";

export default function UpgradeCTA({ trigger, toolName, className = "" }: Props) {
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 检查 7 天内是否已关闭
    const hideUntil = localStorage.getItem(`${HIDE_KEY_PREFIX}${trigger}`);
    if (hideUntil && Date.now() < parseInt(hideUntil)) return;

    fetch(`/api/revenue/upgrade-prompt?trigger=${encodeURIComponent(trigger)}`)
      .then((r) => r.json())
      .then((data: PromptData) => {
        setPrompt(data);
        setVisible(true);
        // 记录展示
        fetch("/api/revenue/track-upgrade-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trigger }),
        }).catch(() => {});
      })
      .catch(() => {});
  }, [trigger]);

  function handleClose() {
    setVisible(false);
    // 7 天后才再次显示
    localStorage.setItem(`${HIDE_KEY_PREFIX}${trigger}`, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }

  if (!visible || !prompt) return null;

  const subtext = toolName
    ? prompt.subtext.replace("{toolName}", toolName)
    : prompt.subtext;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}
    >
      <div className="bg-gradient-to-r from-indigo-500 to-violet-500 p-5 text-white">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white/60 hover:text-white text-lg leading-none transition-colors"
          aria-label="Close"
        >
          ×
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70 mb-1">
          Upgrade your plan
        </p>
        <h3 className="text-base font-bold mb-1 pr-6">{prompt.headline}</h3>
        <p className="text-sm text-white/80 mb-4">{subtext}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={prompt.cta_url}
            className="bg-white text-indigo-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors"
          >
            {prompt.cta_label}
          </Link>
          <p className="text-xs text-white/60">⭐ Trusted by 4,000+ professionals</p>
        </div>
      </div>
    </div>
  );
}
