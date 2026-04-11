import Link from "next/link";
import HeroDemoEmbed from "@/components/home/HeroDemoEmbed";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 pt-4 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-5">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700
              text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100 w-fit">
              ⚡ 600+ AI Tools · 10,000+ generations · Free to start
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                600+ AI Tools For<br />
                <span className="text-indigo-600">Real Work</span>
              </h1>
              <p className="text-sm font-medium text-gray-400 mt-2 tracking-wide">
                Resumes · Marketing · Business · Study · Legal · Code
              </p>
            </div>

            {/* Description */}
            <p className="text-base text-gray-600 leading-relaxed">
              Generate professional content in seconds.
              Resumes, marketing campaigns, business plans and more.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href="/toolkits"
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm
                  font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                Start Free →
              </Link>
              <Link href="/ai-generators"
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl
                  text-sm font-semibold hover:border-indigo-400 hover:text-indigo-600
                  transition-colors">
                Explore Tools
              </Link>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                How It Works
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { step: "1", icon: "📝", title: "Describe your need",
                    desc: "Type your background, product, or topic." },
                  { step: "2", icon: "⚡", title: "AI generates instantly",
                    desc: "Professional content ready in under 30 seconds." },
                  { step: "3", icon: "✅", title: "Copy or download to use",
                    desc: "Edit, copy, or download and apply directly to your work." },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs
                      font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">
                        {item.icon} {item.title}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>✓ No credit card required</span>
              <span>✓ 4,000+ users</span>
              <span>✓ SSL secured</span>
            </div>

            {/* Value proposition */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-gray-700">
              <span>⚡ Save Time</span>
              <span>🎯 Better Quality</span>
              <span>🛡️ Lower Risk</span>
              <span>📊 Consistent Output</span>
              <span>🔁 Repeatable Results</span>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="flex flex-col gap-4">

            {/* Example Output */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Example Output
                </span>
                <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100
                  px-2 py-0.5 rounded-full font-medium">
                  AI Resume Generator
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                Software Engineer Resume Summary
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Results-driven software engineer with 5+ years of experience building
                scalable React and Node.js applications. Led development of two startup
                products used by 50,000+ users. Passionate about clean code and
                high-impact delivery.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center
                justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</span>
                  <span className="text-xs text-gray-400">Generated in 8 seconds</span>
                </div>
                <Link href="/ai-generators/resume"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  Try it →
                </Link>
              </div>
            </div>

            {/* Live Demo */}
            <HeroDemoEmbed />

          </div>

        </div>
      </div>
    </section>
  );
}
