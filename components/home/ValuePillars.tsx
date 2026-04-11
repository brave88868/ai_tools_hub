const pillars = [
  {
    icon: "⚡",
    title: "Save Time",
    desc: "Stop rewriting the same prompts. Ready-made AI tools designed for real workflows — use once, reuse forever.",
  },
  {
    icon: "🎯",
    title: "Improve Quality",
    desc: "Structured prompts designed by professionals. Get better outputs than generic AI for resumes, proposals and marketing copy.",
  },
  {
    icon: "🔁",
    title: "Consistent Results",
    desc: "Turn one-off prompts into standardized workflows. Same high quality every time you need it.",
  },
];

export default function ValuePillars() {
  return (
    <section className="bg-gray-50 py-6 px-4 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100">
              <div className="text-2xl flex-shrink-0">{pillar.icon}</div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-0.5">{pillar.title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{pillar.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
