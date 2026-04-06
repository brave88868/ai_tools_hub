import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="bg-black text-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-4xl mb-4">⚡</div>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
          Start Using AI Tools Today
        </h2>
        <p className="text-gray-400 text-lg mb-8">
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
        <p className="text-gray-600 text-xs mt-6">Free forever · No spam · SSL secured</p>
      </div>
    </section>
  );
}
