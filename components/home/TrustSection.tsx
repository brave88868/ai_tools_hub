export default function TrustSection() {
  return (
    <section className="py-6 px-4 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">

          {/* Left: headline */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-0.5">
              Trusted Infrastructure
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Powered by leading AI models.<br />
              Encrypted data. No training on user inputs.
            </p>
          </div>

          {/* Right: brand badges */}
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
            {[
              { name: "OpenAI",     color: "bg-black text-white" },
              { name: "Anthropic",  color: "bg-orange-50 text-orange-700 border border-orange-200" },
              { name: "Supabase",   color: "bg-green-50 text-green-700 border border-green-200" },
              { name: "Stripe",     color: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
            ].map((b) => (
              <span
                key={b.name}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${b.color}`}
              >
                {b.name}
              </span>
            ))}
            <span className="text-xs text-gray-400 flex items-center gap-1">
              🔒 GDPR
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              ✅ SSL
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
