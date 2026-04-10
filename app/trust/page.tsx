import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trust & Security | AI Tools Station",
  description:
    "How AI Tools Station protects user data, ensures responsible AI use, and maintains security and privacy standards.",
};

export default function TrustPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">

      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Trust & Security</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI Tools Station is designed with privacy, security and responsible AI use in mind.
          We provide transparent and reliable AI-powered tools while protecting user data.
        </p>
      </section>

      {/* Trust Architecture */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Trust Architecture</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: "🔧", title: "Structured Prompt System", desc: "Our tools rely on structured prompt engineering designed to produce consistent outputs rather than random AI responses." },
            { icon: "🔄", title: "Workflow Design", desc: "Each AI tool follows a defined workflow to guide the AI model toward relevant, structured results for specific professional tasks." },
            { icon: "📈", title: "Continuous Optimization", desc: "We continuously improve prompts, tools and workflows based on performance feedback and evolving AI capabilities." },
            { icon: "💡", title: "Transparent AI Usage", desc: "We clearly indicate when outputs are AI-generated and encourage users to review results before professional use." },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-xl p-6">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Privacy */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Privacy</h2>
        <div className="bg-gray-50 rounded-xl p-6 space-y-3 text-gray-600 text-sm">
          <p>✅ User inputs are processed securely and are <strong>not used to train AI models</strong>.</p>
          <p>✅ We minimize data storage — only retaining information necessary for platform functionality.</p>
          <p>✅ All communication is protected through <strong>SSL encrypted connections</strong>.</p>
          <p>✅ User account data is stored securely using industry-standard database infrastructure.</p>
        </div>
      </section>

      {/* Responsible AI */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsible AI Use</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          AI-generated outputs should always be reviewed before being used in professional contexts.
          Our platform focuses on providing tools that <strong>assist users</strong> rather than
          replace human judgment.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Users retain full responsibility for how they use generated content.
          We encourage transparency when sharing AI-generated work.
        </p>
      </section>

      {/* Compliance */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy & Compliance</h2>
        <p className="text-gray-600 mb-6">
          AI Tools Station aims to align with widely recognized data protection and privacy principles.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            { icon: "🔒", label: "SSL Encryption" },
            { icon: "📦", label: "Data Minimization" },
            { icon: "🛡️", label: "Secure Infrastructure" },
            { icon: "🤝", label: "Responsible AI" },
          ].map((item) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm">
          As global AI and data privacy regulations evolve, we will continue improving
          our compliance and governance practices.
        </p>
      </section>

      {/* CTA */}
      <section className="text-center border border-gray-200 rounded-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">See How Our AI Works</h2>
        <p className="text-gray-600 mb-4">
          Learn about the methodology behind our AI tools and how we ensure quality outputs.
        </p>
        <Link
          href="/methodology"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Read Our Methodology →
        </Link>
      </section>

    </main>
  );
}
