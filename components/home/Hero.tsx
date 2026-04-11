import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white pt-8 pb-4 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Powered by OpenAI */}
        <p className="text-lg font-medium text-indigo-600 text-center mb-1">
          ⚡ Powered by OpenAI — enterprise-grade AI for professional results
        </p>

        {/* Badge — plain text, no background */}
        <p className="text-lg font-medium text-indigo-600 text-center mb-1">
          🔒 Free to start · No credit card required · Your data is never stored
        </p>

        {/* Trust signals */}
        <p className="text-lg font-medium text-indigo-600 text-center mb-4">
          🔒 SSL Encrypted &nbsp;·&nbsp; ✓ 4,000+ Professionals &nbsp;·&nbsp; ⭐ No Login Required to Try
        </p>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-3 leading-tight w-full" style={{ wordSpacing: '0.15em' }}>
          AI Tools For{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Real Work
          </span>
        </h1>

        <p className="text-base text-gray-700 max-w-2xl mx-auto mb-4 leading-relaxed">
          Generate resumes, business plans, marketing campaigns and study
          materials in seconds. 600+ AI tools across 24 professional workflows.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
          <span className="text-sm text-gray-700">⚡ Save hours of manual work</span>
          <span className="text-sm text-gray-700">🎯 Improve output quality</span>
          <span className="text-sm text-gray-700">🔁 Standardize your workflows</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-4 mt-6">
          <Link
            href="/toolkits"
            className="inline-flex items-center gap-2 bg-black text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            Start Free →
          </Link>
          <Link
            href="/toolkits"
            className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl text-base font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Explore Tools
          </Link>
        </div>

        <p className="text-sm text-gray-700 mt-4">
          Trusted by 4,000+ professionals · No credit card required · Free to start
        </p>
      </div>
    </section>
  );
}
