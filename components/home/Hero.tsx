import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Left: Value */}
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              ⚡ 600+ AI Tools · Free to start
            </div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              AI Tools Built For<br />
              <span className="text-indigo-600">Real Work</span>
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Create resumes, marketing campaigns, business plans and study materials in seconds.
            </p>
            <div className="flex flex-wrap gap-3 mb-6">
              <Link
                href="/toolkits"
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Start Free →
              </Link>
              <Link
                href="/ai-generators"
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                Explore Tools
              </Link>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>✓ No credit card required</span>
              <span>✓ Free to start</span>
              <span>✓ Trusted by 4,000+ users</span>
            </div>
          </div>

          {/* Right: Demo Preview */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Live Demo</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-400 mb-2">📝 Your Input</div>
                <div className="text-sm text-gray-600 leading-relaxed">
                  &quot;Software engineer with 5 years experience in React and Node.js&quot;
                </div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="text-xs text-indigo-400 mb-2">✨ AI Output</div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  Results-driven software engineer with 5+ years building scalable web applications...
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">AI Resume Generator</span>
              <Link href="/ai-generators/resume" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                Try free →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
