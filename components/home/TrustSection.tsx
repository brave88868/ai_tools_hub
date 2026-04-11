const TRUST_ITEMS = [
  {
    icon: "🔒",
    title: "Data Privacy",
    desc: "Your inputs are never stored or used for training.",
  },
  {
    icon: "🤖",
    title: "Top AI Models",
    desc: "Powered by Claude and GPT-4o — the best available.",
  },
  {
    icon: "⚡",
    title: "Fast & Reliable",
    desc: "Results in under 5 seconds, 99.9% uptime.",
  },
  {
    icon: "🌍",
    title: "GDPR Compliant",
    desc: "Fully compliant with EU & international data laws.",
  },
];

export default function TrustSection() {
  return (
    <section className="bg-gray-50 py-7 px-4 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-xl mt-0.5 shrink-0">{item.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
