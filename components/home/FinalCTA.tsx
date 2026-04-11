import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-8">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">
          Start Using AI Tools Today
        </h2>
        <p className="text-white/80 text-sm mb-5">
          Join 4,000+ professionals. No credit card required.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/toolkits"
            className="inline-block bg-white text-indigo-700 font-bold px-7 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Start Free →
          </Link>
          <Link
            href="/ai-generators"
            className="inline-block border border-white/40 text-white font-semibold px-7 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-sm"
          >
            Browse Generators
          </Link>
        </div>
        <p className="text-white/60 text-xs mt-5">3 free uses/day · No credit card · SSL secured</p>
      </div>
    </section>
  );
}
