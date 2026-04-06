import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white pt-16 pb-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          Free to start · No credit card required
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-5 leading-tight">
          150+ AI Tools That{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Actually Save You Hours
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Generate resumes, marketing copy, business plans and more.
          Professional AI tools built for real workflows.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
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

        <p className="text-sm text-gray-400">
          Join 4,000+ professionals · 3 free uses/day · Upgrade anytime
        </p>
      </div>
    </section>
  );
}
