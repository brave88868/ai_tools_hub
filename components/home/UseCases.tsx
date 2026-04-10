import Link from "next/link";

const useCases = [
  {
    icon: "💼",
    title: "For Job Seekers",
    tools: ["Resume Optimizer", "Cover Letter Generator", "Interview Answer Generator"],
    href: "/toolkits/jobseeker",
  },
  {
    icon: "📣",
    title: "For Marketers",
    tools: ["Ad Copy Generator", "Email Campaign Writer", "Social Media Content"],
    href: "/toolkits/marketing",
  },
  {
    icon: "🎓",
    title: "For Students",
    tools: ["Flashcard Generator", "Study Plan Creator", "Essay Outline Generator"],
    href: "/toolkits/exam",
  },
  {
    icon: "🏢",
    title: "For Businesses",
    tools: ["Business Plan Generator", "Proposal Writer", "Contract Analyzer"],
    href: "/toolkits/business",
  },
];

export default function UseCases() {
  return (
    <section className="py-14 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">AI Tools For Every Workflow</h2>
          <p className="text-lg text-gray-700">Find the right tools for your work</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {useCases.map((uc) => (
            <Link
              key={uc.title}
              href={uc.href}
              className="border border-gray-100 rounded-2xl p-5 bg-white hover:shadow-md hover:border-indigo-200 transition-all group block"
            >
              <div className="text-3xl mb-3">{uc.icon}</div>
              <h3 className="text-base font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                {uc.title}
              </h3>
              <ul className="space-y-1 mb-4">
                {uc.tools.map((tool) => (
                  <li key={tool} className="text-xs text-gray-700">
                    · {tool}
                  </li>
                ))}
              </ul>
              <span className="text-xs font-medium text-indigo-500 group-hover:text-indigo-700 transition-colors">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
