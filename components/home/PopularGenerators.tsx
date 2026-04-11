import Link from "next/link";

const DEMOS = [
  {
    slug: "resume",
    icon: "📄",
    title: "AI Resume Generator",
    input: "Software engineer, 5 years React/Node.js experience",
    output: "Results-driven software engineer with 5+ years building scalable web applications at high-growth startups...",
    category: "Career",
  },
  {
    slug: "marketing-copy",
    icon: "📣",
    title: "AI Marketing Copy Generator",
    input: "SaaS tool that helps marketers save 10 hours/week",
    output: "Stop wasting hours on repetitive copy. Our AI writes high-converting marketing content in seconds...",
    category: "Marketing",
  },
  {
    slug: "business-plan",
    icon: "📊",
    title: "AI Business Plan Generator",
    input: "Online tutoring platform for K-12 students",
    output: "Executive Summary: EduAI is an innovative online tutoring platform leveraging AI to provide personalized...",
    category: "Business",
  },
  {
    slug: "flashcard",
    icon: "🃏",
    title: "AI Flashcard Generator",
    input: "Photosynthesis - biology chapter notes",
    output: "Q: What is photosynthesis? A: The process by which plants convert sunlight, CO₂ and water into glucose...",
    category: "Education",
  },
  {
    slug: "youtube-title",
    icon: "🎬",
    title: "AI YouTube Title Generator",
    input: "Tutorial on how to learn React in 30 days",
    output: "I Learned React in 30 Days (Here&apos;s Exactly How) → &apos;The TRUTH About Learning React Fast...&apos;",
    category: "Creator",
  },
  {
    slug: "email",
    icon: "✉️",
    title: "AI Email Generator",
    input: "Follow-up email after job interview at Google",
    output: "Subject: Thank you – Software Engineer Interview | Dear [Name], Thank you for taking the time...",
    category: "Business",
  },
];

export default function PopularGenerators() {
  return (
    <section className="bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              See What AI Can Do
            </h2>
            <p className="text-sm text-gray-500 mt-1 pl-4">Real examples — input on the left, AI output on the right</p>
          </div>
          <Link href="/ai-generators" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
            View all generators →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMOS.map((demo) => (
            <div key={demo.slug} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <span className="text-xl">{demo.icon}</span>
                <span className="font-semibold text-sm text-gray-900">{demo.title}</span>
                <span className="ml-auto text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{demo.category}</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                <div className="p-3">
                  <div className="text-xs text-gray-400 mb-1.5">📝 Input</div>
                  <div className="text-xs text-gray-600 leading-relaxed line-clamp-3">{demo.input}</div>
                </div>
                <div className="p-3 bg-indigo-50/40">
                  <div className="text-xs text-indigo-400 mb-1.5">✨ AI Output</div>
                  <div className="text-xs text-gray-700 leading-relaxed line-clamp-3">{demo.output}</div>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100 flex justify-end">
                <Link href={`/ai-generators/${demo.slug}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  Try free →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
