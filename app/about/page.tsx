import { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "About AI Tools Station | AI Productivity Platform",
  description:
    "AI Tools Station offers 600+ AI tools designed to automate professional workflows including resumes, marketing content, study tools and more.",
};

export default function AboutPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-12">

      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">About AI Tools Station</h1>
        <div className="flex flex-wrap gap-4 justify-center mt-3 mb-6 text-sm text-gray-500">
          <span>✓ Trusted by <strong className="text-gray-700">4,000+</strong> users worldwide</span>
          <span>✓ <strong className="text-gray-700">10,000+</strong> AI generations created</span>
          <span>✓ <strong className="text-gray-700">600+</strong> AI tools available</span>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A professional AI tools platform helping individuals and teams automate real work.
          600+ AI tools across 24 professional toolkits — trusted worldwide.
        </p>
      </section>

      {/* Left / Right split */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">

        {/* Left: Mission + What We Build */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              AI has enormous potential, but most tools are hard to use in real workflows.
              AI Tools Station makes AI practical — structured workflows that turn simple
              inputs into professional outputs instantly.
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Save time on repetitive tasks</li>
              <li>✅ Improve output quality</li>
              <li>✅ Standardize professional workflows</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What We Build</h2>
            <div className="space-y-3">
              {[
                { icon: "⚡", title: "AI Generators", desc: "Resumes, business plans, marketing campaigns, presentations and more." },
                { icon: "🧰", title: "Professional Toolkits", desc: "24 toolkits for job seekers, marketers, students, businesses and creators." },
                { icon: "🔁", title: "Workflow Automation", desc: "Guided workflows that produce consistent, high-quality outputs." },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{item.title}</div>
                    <div className="text-xs text-gray-600">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Technology Stack */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Technology & Infrastructure</h2>
          <p className="text-sm text-gray-600 mb-4">
            Built on modern, scalable technologies for performance, reliability and security.
          </p>
          <div className="space-y-3">
            {[
              { icon: "🤖", name: "AI Models", desc: "OpenAI API — advanced LLMs for context-aware outputs" },
              { icon: "⚡", name: "Next.js", desc: "High-performance web framework with server-side rendering" },
              { icon: "☁️", name: "Vercel", desc: "Global edge deployment for fast and reliable access" },
              { icon: "🗄️", name: "Supabase", desc: "PostgreSQL — secure and scalable database" },
              { icon: "💳", name: "Stripe", desc: "Enterprise-grade payment infrastructure" },
            ].map((tech) => (
              <div key={tech.name} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{tech.icon}</span>
                <div>
                  <div className="font-semibold text-gray-900 text-xs">{tech.name}</div>
                  <div className="text-xs text-gray-500">{tech.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="border-t border-gray-100 pt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h2>
        <p className="text-sm text-gray-600 mb-6">
          Questions, feedback or partnership inquiries? We would love to hear from you.
        </p>
        <ContactForm />
      </section>

    </main>
  );
}
