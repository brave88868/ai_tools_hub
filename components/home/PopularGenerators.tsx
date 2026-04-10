import Link from "next/link";

const GENERATORS = [
  { slug: "resume", icon: "📄", title: "AI Resume Generator", desc: "Create professional resumes tailored to any job" },
  { slug: "business-plan", icon: "📊", title: "AI Business Plan Generator", desc: "Generate structured business plans in minutes" },
  { slug: "marketing-copy", icon: "📣", title: "AI Marketing Copy Generator", desc: "Write high-converting marketing copy instantly" },
  { slug: "flashcard", icon: "🃏", title: "AI Flashcard Generator", desc: "Turn any topic into study flashcards automatically" },
  { slug: "youtube-title", icon: "🎬", title: "AI YouTube Title Generator", desc: "Create click-worthy video titles that rank" },
  { slug: "email", icon: "✉️", title: "AI Email Generator", desc: "Write professional emails for any situation" },
];

export default function PopularGenerators() {
  return (
    <section className="bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
              Popular AI Generators
            </h2>
            <p className="text-sm text-gray-600 mt-1 pl-4">Free to use · No signup required</p>
          </div>
          <Link
            href="/ai-generators"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GENERATORS.map((gen) => (
            <Link
              key={gen.slug}
              href={`/ai-generators/${gen.slug}`}
              className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="text-2xl mb-2">{gen.icon}</div>
              <div className="font-semibold text-gray-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                {gen.title}
              </div>
              <div className="text-xs text-gray-500 line-clamp-1">{gen.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
