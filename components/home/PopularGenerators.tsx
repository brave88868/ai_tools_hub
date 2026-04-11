"use client";
import { useState, useRef } from "react";
import Link from "next/link";

const DEMOS = [
  {
    slug: "resume",
    icon: "📄",
    title: "Resume",
    category: "Career",
    placeholder: "Describe your background...\ne.g. Software engineer, 5 years React/Node.js experience at startups",
    defaultInput: "Software engineer with 5 years experience in React and Node.js, worked at 2 startups",
    systemPrompt: "You are an expert resume writer. Generate a professional resume summary paragraph (3-4 sentences) based on the user's background. Be specific, results-oriented, and ATS-friendly. Start directly with the summary, no headers.",
  },
  {
    slug: "marketing-copy",
    icon: "📣",
    title: "Marketing",
    category: "Marketing",
    placeholder: "Describe your product or service...\ne.g. SaaS tool that helps marketers save 10 hours/week",
    defaultInput: "SaaS tool that helps marketers create content 10x faster using AI",
    systemPrompt: "You are an expert copywriter. Write 2-3 punchy marketing sentences for the product described. Focus on the key benefit and create urgency. Be conversational and compelling. No headers, just the copy.",
  },
  {
    slug: "business-plan",
    icon: "📊",
    title: "Business Plan",
    category: "Business",
    placeholder: "Describe your business idea...\ne.g. Online tutoring platform for K-12 students",
    defaultInput: "AI-powered online tutoring platform for K-12 students with personalized learning paths",
    systemPrompt: "You are a business consultant. Write a concise executive summary (3-4 sentences) for the business idea. Include the problem, solution, target market, and key differentiator. Be professional and investor-ready.",
  },
];

export default function PopularGenerators() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [input, setInput] = useState(DEMOS[0].defaultInput);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const demo = DEMOS[activeIdx];

  const switchDemo = (idx: number) => {
    setActiveIdx(idx);
    setInput(DEMOS[idx].defaultInput);
    setOutput("");
  };

  const generate = async () => {
    if (!input.trim() || loading) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/demo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({ input, systemPrompt: demo.systemPrompt }),
      });
      const data = await res.json();
      const text: string = data.text ?? "Something went wrong. Please try the full tool below.";

      // Reveal text progressively (simulate streaming)
      let i = 0;
      const interval = setInterval(() => {
        i += 5;
        setOutput(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, 12);
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        setOutput("Unable to generate. Please try the full tool below.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              Try AI Generators Live
            </h2>
            <p className="text-sm text-gray-500 mt-1 pl-4">
              Type your input and see real AI output instantly
            </p>
          </div>
          <Link
            href="/ai-generators"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View all generators →
          </Link>
        </div>

        {/* Tool Selector Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {DEMOS.map((d, i) => (
            <button
              key={d.slug}
              onClick={() => switchDemo(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeIdx === i
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <span>{d.icon}</span>
              <span>{d.title}</span>
            </button>
          ))}
        </div>

        {/* Interactive Demo Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Panel Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-xl">{demo.icon}</span>
            <span className="font-semibold text-sm text-gray-900">AI {demo.title} Generator</span>
            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
              {demo.category}
            </span>
            <Link
              href={`/ai-generators/${demo.slug}`}
              className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Full tool →
            </Link>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* Left: Input */}
            <div className="p-4">
              <div className="mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  📝 Your Input
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={demo.placeholder}
                rows={5}
                className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent leading-relaxed"
              />
              <button
                onClick={generate}
                disabled={loading || !input.trim()}
                className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  loading || !input.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  "Generate with AI →"
                )}
              </button>
            </div>

            {/* Right: Output */}
            <div className="p-4 bg-indigo-50/30">
              <div className="mb-3">
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                  ✨ AI Output
                </span>
              </div>
              {output ? (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {output}
                  {loading && (
                    <span className="inline-block w-1 h-4 bg-indigo-400 ml-0.5 animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[120px] text-center">
                  <div className="text-3xl mb-2 opacity-30">{demo.icon}</div>
                  <p className="text-sm text-gray-400">
                    {loading ? "Generating your content..." : "Click generate to see AI output"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer bar */}
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Powered by Claude AI · Free to use
            </span>
            <Link
              href={`/ai-generators/${demo.slug}`}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Use full {demo.title} generator →
            </Link>
          </div>
        </div>

        {/* More generators link */}
        <div className="mt-3 text-center">
          <Link
            href="/ai-generators"
            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            + 20 more AI generators available free →
          </Link>
        </div>
      </div>
    </section>
  );
}
