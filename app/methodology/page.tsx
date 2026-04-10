import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Methodology | How AI Tools Station Generates High-Quality Results",
  description:
    "Learn how AI Tools Station uses structured prompt engineering and workflow design to generate consistent, high-quality AI outputs.",
};

export default function MethodologyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">

      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          How Our AI Tools Generate High-Quality Results
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI Tools Station uses structured prompt engineering and workflow design
          to guide AI models toward consistent and practical outputs.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How Our AI Tools Work</h2>
        <div className="bg-gray-50 rounded-xl p-8 mb-6">
          <div className="flex flex-col items-center gap-3">
            {[
              { icon: "📥", label: "User Input" },
              { icon: "🔧", label: "Structured Prompt System" },
              { icon: "🤖", label: "AI Model Processing" },
              { icon: "⚙️", label: "Workflow Logic" },
              { icon: "📄", label: "Structured Output" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="bg-white border border-gray-200 rounded-lg px-8 py-3 font-medium text-gray-800 text-sm w-64 text-center">
                  {step.icon} {step.label}
                </div>
                {i < 4 && <div className="text-gray-400 text-lg">↓</div>}
              </div>
            ))}
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">
          When a user enters input, the platform converts that information into a
          structured prompt designed specifically for the selected workflow. The AI model
          processes the prompt and workflow logic helps structure the response
          to improve clarity, relevance and usability.
        </p>
      </section>

      {/* Prompt Engineering */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Structured Prompt Engineering</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Unlike simple AI tools that rely on generic prompts, AI Tools Station uses a
          structured prompt engineering framework. Each tool is built on prompts designed to:
        </p>
        <ul className="space-y-2 text-gray-600 mb-4">
          <li>✅ Guide the AI model toward the intended task</li>
          <li>✅ Structure outputs into clear, usable sections</li>
          <li>✅ Improve consistency across different inputs</li>
          <li>✅ Produce professional-quality results for specific workflows</li>
        </ul>
      </section>

      {/* Workflow Design */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Workflow-Driven AI Tools</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Each AI tool is designed around a specific workflow rather than a single prompt.
          For example, a resume generator guides the AI through structured steps:
        </p>
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex flex-col gap-3">
            {["User information", "Role targeting", "Skills and achievements", "Structured resume output"].map((step, i) => (
              <div key={i}>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 font-medium text-sm">{step}</span>
                </div>
                {i < 3 && <div className="ml-3 text-gray-400 text-sm pl-3">↓</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Optimization */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quality Optimization</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {[
            { icon: "✏️", title: "Prompt Refinement", desc: "Continuously improving prompt clarity and instruction quality" },
            { icon: "📋", title: "Output Structure", desc: "Refining output formats for maximum usability" },
            { icon: "🎯", title: "Use Case Targeting", desc: "Adjusting workflows for specific professional contexts" },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
              <div className="text-xs text-gray-600">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Continuous Improvement */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Continuous Improvement</h2>
        <p className="text-gray-600 leading-relaxed">
          AI technology evolves rapidly, and our platform evolves with it.
          AI Tools Station continuously updates its tools, prompts and workflows
          to take advantage of improvements in AI models and incorporate user feedback.
          This ongoing optimization allows the platform to deliver increasingly reliable
          and useful AI-powered tools.
        </p>
      </section>

      {/* CTA */}
      <section className="text-center border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Try Our AI Tools</h2>
        <p className="text-gray-600 mb-4">
          See our methodology in action with 600+ professional AI tools.
        </p>
        <Link
          href="/toolkits"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Explore Toolkits →
        </Link>
      </section>

    </main>
  );
}
