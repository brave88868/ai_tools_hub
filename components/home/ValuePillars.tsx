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
    <section className="bg-gray-50 pt-2 pb-4 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Use AI Tools Station?</h2>
          <p className="text-lg text-gray-700">Purpose-built AI tools beat generic chatbots for professional work</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm"
            >
              <div className="text-4xl mb-4">{pillar.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{pillar.title}</h3>
              <p className="text-base text-gray-700 leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
