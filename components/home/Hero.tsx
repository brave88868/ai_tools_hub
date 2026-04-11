import Link from "next/link";
import HeroDemoEmbed from "@/components/home/HeroDemoEmbed";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Left: Value */}
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              ⚡ 600+ AI Tools · 10,000+ generations · Free to start
            </div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-2">
              600+ AI Tools For<br />
              <span className="text-indigo-600">Real Work</span>
            </h1>
            <p className="text-base font-medium text-gray-500 mb-4 tracking-wide">
              Resumes · Marketing · Business · Study
            </p>
            <p className="text-base text-gray-600 mb-5 leading-relaxed">
              Generate professional content in seconds.
              Resumes, marketing campaigns, business plans and more.
            </p>
            <div className="flex flex-wrap gap-3 mb-5">
              <Link
                href="/toolkits"
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Start Free →
              </Link>
              <Link
                href="/ai-generators"
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                Explore Tools
              </Link>
            </div>

            {/* Example Output */}
            <div className="mt-5 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Example Output
                </span>
                <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                  AI Resume Generator
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800 mb-1">
                Software Engineer Resume Summary
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Results-driven software engineer with 5+ years of experience building
                scalable React and Node.js applications. Led development of two startup
                products used by 50,000+ users. Passionate about clean code and
                high-impact delivery.
              </p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-yellow-500">⭐⭐⭐⭐⭐</span>
                <span className="text-xs text-gray-400">Generated in 8 seconds</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-4">
              <span>✓ No credit card required</span>
              <span>✓ 4,000+ users</span>
              <span>✓ SSL secured</span>
            </div>
          </div>

          {/* Right: Interactive Demo */}
          <HeroDemoEmbed />

        </div>
      </div>
    </section>
  );
}
