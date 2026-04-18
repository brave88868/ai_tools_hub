import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Methodology | How AI Tools Station Generates High-Quality Results" },
  description:
    "Learn how AI Tools Station uses structured prompt engineering and workflow design to generate consistent, high-quality AI outputs.",
  alternates: { canonical: "https://www.aitoolsstation.com/methodology" },
};

export default function MethodologyPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">

      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          How Our AI Tools Generate High-Quality Results
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Structured prompt engineering and workflow design guide AI models
          toward consistent, practical outputs for real work.
        </p>
      </section>

      {/* Left: flow diagram / Right: prompt + workflow */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

        {/* Left: Flow diagram */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex flex-col items-center gap-2">
              {[
                { icon: "📥", label: "User Input" },
                { icon: "🔧", label: "Structured Prompt System" },
                { icon: "🤖", label: "AI Model Processing" },
                { icon: "⚙️", label: "Workflow Logic" },
                { icon: "📄", label: "Structured Output" },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-1 w-full">
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-800 w-full text-center">
                    {step.icon} {step.label}
                  </div>
                  {i < 4 && <div className="text-gray-400">↓</div>}
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            User input is converted into a structured prompt, processed by the AI model,
            then shaped by workflow logic into a clear, usable output.
          </p>
        </div>

        {/* Right: Prompt Engineering + Workflow */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Structured Prompt Engineering</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Each tool uses purpose-built prompts — not generic AI queries.
              Our prompt framework is designed to:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Guide AI toward the intended task</li>
              <li>✅ Structure outputs into clear sections</li>
              <li>✅ Ensure consistency across inputs</li>
              <li>✅ Produce professional-quality results</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Workflow-Driven Design</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Each tool follows a defined workflow — not a single prompt.
              Example: Resume Generator steps:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {["User information", "Role targeting", "Skills & achievements", "Structured resume output"].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quality cards + CTA */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 grid grid-cols-3 gap-4">
          {[
            { icon: "✏️", title: "Prompt Refinement", desc: "Continuously improving clarity and instructions" },
            { icon: "📋", title: "Output Structure", desc: "Refining formats for maximum usability" },
            { icon: "🔄", title: "Continuous Updates", desc: "Evolving with AI advances and user feedback" },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-600">{item.desc}</div>
            </div>
          ))}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 flex flex-col justify-center text-center">
          <div className="text-sm font-bold text-gray-900 mb-2">Try Our Tools</div>
          <p className="text-xs text-gray-600 mb-3">See methodology in action</p>
          <Link
            href="/toolkits"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            Explore →
          </Link>
        </div>
      </section>

    </main>
  );
}
