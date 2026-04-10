import Link from "next/link";

const generators = [
  {
    icon: "📄",
    title: "AI Resume Generator",
    desc: "Create professional resumes tailored to any job.",
    href: "/tools/resume-optimizer",
  },
  {
    icon: "📊",
    title: "AI Business Plan Generator",
    desc: "Generate structured business plans in minutes.",
    href: "/tools/business-plan-generator",
  },
  {
    icon: "📣",
    title: "AI Marketing Copy Generator",
    desc: "Write high-converting marketing copy instantly.",
    href: "/tools/marketing-copy-generator",
  },
  {
    icon: "🃏",
    title: "AI Flashcard Generator",
    desc: "Turn any topic into study flashcards automatically.",
    href: "/tools/flashcard-generator",
  },
  {
    icon: "📝",
    title: "AI Proposal Generator",
    desc: "Create professional proposals for any project.",
    href: "/tools/proposal-generator",
  },
  {
    icon: "✉️",
    title: "AI Email Generator",
    desc: "Write professional emails for any situation.",
    href: "/tools/email-generator",
  },
];

export default function PopularGenerators() {
  return (
    <section className="bg-gray-50 py-14 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Popular AI Generators</h2>
          <p className="text-lg text-gray-700">Our most-used tools — ready in seconds</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {generators.map((gen) => (
            <Link
              key={gen.title}
              href={gen.href}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all group block"
            >
              <div className="text-3xl mb-3">{gen.icon}</div>
              <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {gen.title}
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed mb-3">{gen.desc}</p>
              <span className="text-xs font-medium text-indigo-500 group-hover:text-indigo-700 transition-colors">
                Use Tool →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
