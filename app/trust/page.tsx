import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust & Security | AI Tools Station",
  description:
    "How AI Tools Station protects user data, ensures responsible AI use, and maintains security and privacy standards.",
  alternates: { canonical: "https://www.aitoolsstation.com/trust" },
};

export default function TrustPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">

      {/* Hero */}
      <section className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Trust & Security</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Designed with privacy, security and responsible AI use in mind.
          Transparent, reliable AI tools that protect your data.
        </p>
      </section>

      {/* Data Privacy + Responsible AI */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">🔒 Data Privacy</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✅ Inputs are <strong>not used to train AI models</strong></li>
            <li>✅ Minimal data storage — only what&apos;s needed</li>
            <li>✅ All transfers protected by SSL encryption</li>
            <li>✅ Account data secured with industry standards</li>
          </ul>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">🤝 Responsible AI Use</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            AI outputs should always be reviewed before professional use.
            Our tools <strong>assist users</strong> — not replace human judgment.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Users retain full responsibility for how they apply generated content.
            We encourage transparency when sharing AI-generated work.
          </p>
        </div>
      </section>

      {/* Trust Architecture 2x2 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Our Trust Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "🔧", title: "Structured Prompt System", desc: "Purpose-built prompts that produce consistent outputs — not random AI responses." },
            { icon: "🔄", title: "Workflow Design", desc: "Defined workflows guide the AI toward relevant, structured results for each task." },
            { icon: "📈", title: "Continuous Optimization", desc: "Prompts and workflows are regularly improved based on feedback and AI advances." },
            { icon: "💡", title: "Transparent AI Usage", desc: "We clearly indicate AI-generated outputs and encourage user review before use." },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-xl p-4 flex gap-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{item.title}</div>
                <div className="text-xs text-gray-600">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance + CTA */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Privacy & Compliance</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { icon: "🔒", label: "SSL Encryption" },
              { icon: "📦", label: "Data Minimization" },
              { icon: "🛡️", label: "Secure Infrastructure" },
              { icon: "🤝", label: "Responsible AI" },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl mb-1">{item.icon}</div>
                <div className="text-xs font-medium text-gray-700">{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            As AI regulations evolve, we continue improving our compliance practices.
          </p>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 flex flex-col justify-center text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">See How Our AI Works</h2>
          <p className="text-sm text-gray-600 mb-4">
            Learn about the methodology behind our tools and how we ensure quality outputs.
          </p>
          <Link
            href="/methodology"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Read Our Methodology →
          </Link>
        </div>
      </section>

    </main>
  );
}
