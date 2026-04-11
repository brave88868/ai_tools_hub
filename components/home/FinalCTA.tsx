import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="w-full bg-black text-white py-10">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="text-3xl mb-3">⚡</div>
        <h2 className="text-2xl md:text-3xl font-extrabold mb-3 tracking-tight">
          Start Using AI Tools Today
        </h2>
        <p className="text-white text-base mb-6">
          Join 4,000+ professionals saving hours every week.
          <br />No credit card required.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/toolkits"
            className="inline-block bg-white text-black font-bold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors text-base"
          >
            Start Free →
          </Link>
          <Link
            href="/pricing"
            className="inline-block border border-gray-600 text-gray-300 font-semibold px-8 py-3.5 rounded-xl hover:border-gray-400 hover:text-white transition-colors text-base"
          >
            See Pricing
          </Link>
        </div>
        <p className="text-white opacity-70 text-xs mt-6">3 free uses/day · No credit card · SSL secured</p>
      </div>
    </section>
  );
}
