const EXAMPLES = [
  {
    tool: "Resume Summary",
    emoji: "💼",
    color: "from-blue-50 to-indigo-50",
    border: "border-blue-100",
    accent: "text-blue-600",
    before: {
      label: "Your Input",
      text: "5 years software engineer. Worked at startups. Know React and Node. Looking for senior role.",
    },
    after: {
      label: "AI Output",
      text: "Results-driven Software Engineer with 5+ years of experience building scalable web applications at high-growth startups. Proficient in React and Node.js, with a track record of delivering full-stack features from concept to production. Seeking a Senior Engineer role to drive technical excellence and mentor junior developers.",
    },
  },
  {
    tool: "YouTube Title",
    emoji: "🎬",
    color: "from-purple-50 to-violet-50",
    border: "border-purple-100",
    accent: "text-purple-600",
    before: {
      label: "Your Input",
      text: "Video about how to learn programming fast as a beginner",
    },
    after: {
      label: "AI Output",
      text: "I Learned to Code in 30 Days (Here's Exactly How)\n→ \"The TRUTH About Learning Programming Fast (What Schools Won't Tell You)\"\n→ \"From Zero to First Job: My 90-Day Coding Journey\"",
    },
  },
  {
    tool: "Marketing Email",
    emoji: "📣",
    color: "from-orange-50 to-amber-50",
    border: "border-orange-100",
    accent: "text-orange-600",
    before: {
      label: "Your Input",
      text: "SaaS product for project management. Want to get free trial signups.",
    },
    after: {
      label: "AI Output",
      text: "Subject: Your team is losing 3 hours/week to bad project management\n\nHi [Name],\n\nMost project managers we talk to say the same thing: \"We have a tool, but nobody uses it.\"\n\nThat's exactly why we built [Product] — a project management tool that teams actually love...",
    },
  },
];

export default function ExampleResults() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">See What AI Can Do</h2>
        <p className="text-gray-500">Real examples — input on the left, AI output on the right</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {EXAMPLES.map((ex) => (
          <div
            key={ex.tool}
            className={`bg-gradient-to-br ${ex.color} border ${ex.border} rounded-2xl p-5 flex flex-col gap-4`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{ex.emoji}</span>
              <span className={`text-sm font-bold ${ex.accent}`}>{ex.tool}</span>
            </div>

            {/* Before */}
            <div className="bg-white/70 rounded-xl p-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{ex.before.label}</div>
              <p className="text-xs text-gray-500 leading-relaxed">{ex.before.text}</p>
            </div>

            {/* Arrow */}
            <div className="text-center text-gray-300 text-lg">↓</div>

            {/* After */}
            <div className="bg-white rounded-xl p-3 shadow-sm">
              <div className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${ex.accent}`}>{ex.after.label}</div>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{ex.after.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
