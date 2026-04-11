"use client";
import { useState } from "react";
import Link from "next/link";

const DEMOS = [
  {
    slug: "resume",
    icon: "📄",
    label: "Resume",
    defaultInput: "Software engineer with 5 years React/Node.js experience at 2 startups",
    systemPrompt:
      "You are an expert resume writer. Generate a professional resume summary paragraph (3-4 sentences). Be specific, results-oriented, and ATS-friendly. Start directly with the summary, no headers.",
  },
  {
    slug: "marketing-copy",
    icon: "📣",
    label: "Marketing",
    defaultInput: "SaaS tool that helps marketers create content 10x faster using AI",
    systemPrompt:
      "You are an expert copywriter. Write 2-3 punchy marketing sentences. Focus on the key benefit and create urgency. No headers, just the copy.",
  },
  {
    slug: "business-plan",
    icon: "📊",
    label: "Business",
    defaultInput: "AI-powered tutoring platform for K-12 students with personalized learning",
    systemPrompt:
      "You are a business consultant. Write a concise executive summary (3-4 sentences). Include problem, solution, target market, and key differentiator.",
  },
];

export default function HeroDemoEmbed() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [input, setInput] = useState(DEMOS[0].defaultInput);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const demo = DEMOS[activeIdx];

  const switchDemo = (idx: number) => {
    setActiveIdx(idx);
    setInput(DEMOS[idx].defaultInput);
    setOutput("");
  };

  const generate = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input, systemPrompt: demo.systemPrompt }),
      });
      const data = await res.json();
      const text: string = data.text ?? "Unable to generate. Please try the full tool.";
      let i = 0;
      const interval = setInterval(() => {
        i += 5;
        setOutput(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, 16);
    } catch {
      setOutput("Unable to generate. Please try the full tool below.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Tool Tabs */}
      <div className="flex border-b border-gray-100 bg-gray-50">
        {DEMOS.map((d, i) => (
          <button
            key={d.slug}
            onClick={() => switchDemo(i)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeIdx === i
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{d.icon}</span>
            <span>{d.label}</span>
          </button>
        ))}
        <Link
          href="/ai-generators"
          className="ml-auto px-3 py-2.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors self-center"
        >
          All →
        </Link>
      </div>

      {/* Input */}
      <div className="p-4">
        <div className="text-xs text-gray-400 mb-1.5">📝 Your Input</div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent leading-relaxed"
        />
        <button
          onClick={generate}
          disabled={loading || !input.trim()}
          className={`mt-2 w-full py-2 rounded-xl text-sm font-semibold transition-all ${
            loading || !input.trim()
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            "Generate with AI →"
          )}
        </button>
      </div>

      {/* Output */}
      <div className="px-4 pb-4">
        <div className="text-xs text-indigo-400 mb-1.5">✨ AI Output</div>
        <div className="min-h-[80px] bg-indigo-50/50 rounded-xl p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {output ? (
            <>
              {output}
              {loading && (
                <span className="inline-block w-1 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
              )}
            </>
          ) : (
            <span className="text-gray-300 text-xs">
              {loading ? "Generating..." : "Click Generate to see AI output..."}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Powered by Claude AI · Free</span>
        <Link
          href={`/ai-generators/${demo.slug}`}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Use full tool →
        </Link>
      </div>
    </div>
  );
}
