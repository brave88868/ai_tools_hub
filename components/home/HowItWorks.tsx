const STEPS = [
  {
    number: "01",
    icon: "🎯",
    title: "Choose a Tool",
    desc: "Browse 600+ AI tools across 24 professional toolkits — for job seekers, creators, marketers, and more.",
  },
  {
    number: "02",
    icon: "✏️",
    title: "Enter Your Input",
    desc: "Paste your resume, job description, topic, or content. Our AI understands context, not just keywords.",
  },
  {
    number: "03",
    icon: "⚡",
    title: "Get AI Results Instantly",
    desc: "Receive professional, ready-to-use output in seconds. Download, copy, or refine with one click.",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-50 py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-700">From input to professional output in under 30 seconds</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* connector line — desktop only */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-indigo-100" />
          {STEPS.map((step) => (
            <div key={step.number} className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white border-2 border-indigo-100 rounded-2xl text-2xl mb-4 shadow-sm">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-indigo-400 mb-1 uppercase tracking-widest">Step {step.number}</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
