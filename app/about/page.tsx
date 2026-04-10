import { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "About AI Tools Station | AI Productivity Platform",
  description:
    "AI Tools Station offers 600+ AI tools designed to automate professional workflows including resumes, marketing content, study tools and more.",
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-16">

      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About AI Tools Station
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          AI Tools Station is a professional AI tools platform designed to help
          individuals and teams automate real-world work.
        </p>
        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mt-4">
          Our platform transforms advanced AI capabilities into practical tools
          that generate resumes, marketing content, business plans, study materials,
          presentations and more — in seconds.
        </p>
        <p className="text-base text-gray-500 mt-4">
          600+ AI tools across 24 professional toolkits. Trusted by thousands of users worldwide.
        </p>
      </section>

      {/* Mission */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Artificial intelligence has the potential to dramatically improve productivity,
          but many AI systems remain difficult to use in everyday workflows.
          AI Tools Station was created to bridge that gap.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Our mission is to make AI practical, accessible, and useful for real work.
          Rather than asking users to learn complex prompting techniques, we design
          structured AI workflows that transform simple inputs into professional outputs.
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>✅ Save time on repetitive tasks</li>
          <li>✅ Improve the quality of generated content</li>
          <li>✅ Standardize professional workflows</li>
        </ul>
      </section>

      {/* What We Build */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Build</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "AI Generators",
              desc: "Generate resumes, business plans, marketing campaigns, presentations and study materials using structured AI workflows.",
            },
            {
              icon: "🧰",
              title: "Professional Toolkits",
              desc: "24 specialized toolkits designed for different roles — job seekers, marketers, students, entrepreneurs and creators.",
            },
            {
              icon: "🔁",
              title: "Workflow Automation",
              desc: "Each tool converts complex AI prompting into a guided workflow that produces consistent, high-quality outputs.",
            },
          ].map((item) => (
            <div key={item.title} className="border border-gray-200 rounded-xl p-6">
              <div className="text-2xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology & Infrastructure</h2>
        <p className="text-gray-600 mb-6">
          Built using modern technologies designed for performance, scalability and reliability.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "🤖", name: "AI Models", desc: "OpenAI API — advanced large language models for context-aware outputs" },
            { icon: "⚡", name: "Application Framework", desc: "Next.js — high-performance web framework with server-side rendering" },
            { icon: "☁️", name: "Cloud Infrastructure", desc: "Vercel — global edge deployment for fast and reliable access" },
            { icon: "🗄️", name: "Database", desc: "Supabase (PostgreSQL) — secure and scalable database infrastructure" },
            { icon: "💳", name: "Payments", desc: "Stripe — trusted global payment platform with enterprise-grade security" },
          ].map((tech) => (
            <div key={tech.name} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <span className="text-2xl">{tech.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{tech.name}</div>
                <div className="text-xs text-gray-600 mt-1">{tech.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h2>
        <p className="text-gray-600 mb-6">
          Have questions, feedback or partnership inquiries? Send us a message
          and we will get back to you as soon as possible.
        </p>
        <ContactForm />
      </section>

    </main>
  );
}
