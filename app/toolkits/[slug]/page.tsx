import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { notFound } from "next/navigation";

// ── Work & Life Templates — category grouping (client-side, no DB column needed) ──
const WLT_SLUG_TO_CATEGORY: Record<string, string> = {
  // Sales Templates (13)
  "cold-outreach-email-template":       "Sales Templates",
  "follow-up-email-template":           "Sales Templates",
  "demo-request-email-template":        "Sales Templates",
  "partnership-proposal-email-template":"Sales Templates",
  "sales-call-script-template":         "Sales Templates",
  "discovery-call-questions-template":  "Sales Templates",
  "product-demo-script-template-wlt":   "Sales Templates",
  "closing-script-template":            "Sales Templates",
  "sales-pipeline-tracker-template":    "Sales Templates",
  "lead-qualification-template":        "Sales Templates",
  "lead-followup-schedule-template":    "Sales Templates",
  "customer-success-checkin-template":  "Sales Templates",
  "renewal-reminder-template":          "Sales Templates",
  // Marketing Templates (14)
  "google-ads-copy-template-wlt":       "Marketing Templates",
  "facebook-ads-copy-template":         "Marketing Templates",
  "linkedin-ads-copy-template":         "Marketing Templates",
  "blog-outline-template":              "Marketing Templates",
  "linkedin-post-template-wlt":         "Marketing Templates",
  "twitter-thread-template":            "Marketing Templates",
  "youtube-video-script-template-wlt":  "Marketing Templates",
  "newsletter-template-wlt":            "Marketing Templates",
  "seo-article-outline-template":       "Marketing Templates",
  "keyword-research-sheet-template":    "Marketing Templates",
  "content-brief-template-wlt":         "Marketing Templates",
  "marketing-plan-template":            "Marketing Templates",
  "campaign-plan-template-wlt":         "Marketing Templates",
  "brand-messaging-template":           "Marketing Templates",
  // Operations Templates (12)
  "project-plan-template-wlt":          "Operations Templates",
  "sprint-planning-template":           "Operations Templates",
  "task-tracker-template":              "Operations Templates",
  "kanban-board-template":              "Operations Templates",
  "sop-template-wlt":                   "Operations Templates",
  "process-documentation-template":     "Operations Templates",
  "workflow-checklist-template":        "Operations Templates",
  "team-kpi-tracker-template-wlt":      "Operations Templates",
  "okr-planning-template-wlt":          "Operations Templates",
  "performance-review-template-wlt":    "Operations Templates",
  "weekly-operations-report-template":  "Operations Templates",
  "operations-dashboard-template":      "Operations Templates",
  // Business Analytics (6)
  "business-case-template-wlt":         "Business Analytics",
  "roi-analysis-template":              "Business Analytics",
  "cost-benefit-analysis-template":     "Business Analytics",
  "market-analysis-template-wlt":       "Business Analytics",
  "swot-analysis-template-wlt":         "Business Analytics",
  "pestle-analysis-template":           "Business Analytics",
  // Decision Tools (4)
  "decision-matrix-template-wlt":       "Decision Tools",
  "tradeoff-analysis-template":         "Decision Tools",
  "scenario-planning-template":         "Decision Tools",
  "strategic-options-comparison-template":"Decision Tools",
  // Data Analytics (3)
  "data-analysis-report-template-wlt":  "Data Analytics",
  "dashboard-requirement-template":     "Data Analytics",
  "insights-summary-template":          "Data Analytics",
  // Product Management (9)
  "product-roadmap-template":           "Product Management",
  "feature-prioritization-template-wlt":"Product Management",
  "prd-template":                       "Product Management",
  "user-story-template":                "Product Management",
  "user-interview-guide-template":      "Product Management",
  "customer-feedback-template-wlt":     "Product Management",
  "product-discovery-checklist-template":"Product Management",
  "product-metrics-dashboard-template": "Product Management",
  "feature-impact-analysis-template":   "Product Management",
  // Productivity Templates (8)
  "weekly-work-plan-template-wlt":      "Productivity Templates",
  "monthly-goals-template":             "Productivity Templates",
  "quarterly-planning-template":        "Productivity Templates",
  "task-list-template":                 "Productivity Templates",
  "priority-matrix-template":           "Productivity Templates",
  "meeting-agenda-template-wlt":        "Productivity Templates",
  "meeting-notes-template":             "Productivity Templates",
  "action-items-tracker-template":      "Productivity Templates",
  // Scheduling Templates (6)
  "daily-schedule-template":            "Scheduling Templates",
  "weekly-planner-template":            "Scheduling Templates",
  "time-blocking-schedule-template":    "Scheduling Templates",
  "goal-planning-template":             "Scheduling Templates",
  "habit-tracker-template":             "Scheduling Templates",
  "personal-okr-template":              "Scheduling Templates",
  // Finance Templates (8)
  "budget-planner-template-wlt":        "Finance Templates",
  "expense-tracker-template":           "Finance Templates",
  "profit-loss-template":               "Finance Templates",
  "cash-flow-forecast-template":        "Finance Templates",
  "investment-tracker-template":        "Finance Templates",
  "financial-projection-template":      "Finance Templates",
  "investment-analysis-template":       "Finance Templates",
  "startup-valuation-template":         "Finance Templates",
  // HR Templates (5)
  "job-description-template-wlt":       "HR Templates",
  "interview-evaluation-template":      "HR Templates",
  "employee-onboarding-checklist-template-wlt":"HR Templates",
  "candidate-scoring-template-wlt":     "HR Templates",
  "career-development-plan-template":   "HR Templates",
  // Study Templates (5)
  "study-planner-template":             "Study Templates",
  "revision-schedule-template":         "Study Templates",
  "exam-preparation-template-wlt":      "Study Templates",
  "flashcard-template":                 "Study Templates",
  "learning-notes-template-wlt":        "Study Templates",
  // Legal Templates (5)
  "contract-template-wlt":              "Legal Templates",
  "nda-template-wlt":                   "Legal Templates",
  "partnership-agreement-template":     "Legal Templates",
  "proposal-template-wlt":              "Legal Templates",
  "service-agreement-template":         "Legal Templates",
  // AI Prompt Templates (8)
  "ai-marketing-prompt-template":       "AI Prompt Templates",
  "ai-coding-prompt-template":          "AI Prompt Templates",
  "ai-research-prompt-template":        "AI Prompt Templates",
  "blog-writing-prompt-template":       "AI Prompt Templates",
  "linkedin-post-prompt-template":      "AI Prompt Templates",
  "business-plan-prompt-template":      "AI Prompt Templates",
  "startup-pitch-prompt-template":      "AI Prompt Templates",
  "market-analysis-prompt-template":    "AI Prompt Templates",
  // AI Work Tools (3)
  "ai-resume-prompt-template":          "AI Work Tools",
  "cover-letter-prompt-template":       "AI Work Tools",
  "interview-preparation-prompt-template":"AI Work Tools",
};

const WLT_CATEGORY_ORDER = [
  "Sales Templates",
  "Marketing Templates",
  "Operations Templates",
  "Business Analytics",
  "Decision Tools",
  "Data Analytics",
  "Product Management",
  "Productivity Templates",
  "Scheduling Templates",
  "Finance Templates",
  "HR Templates",
  "Study Templates",
  "Legal Templates",
  "AI Prompt Templates",
  "AI Work Tools",
];

const WLT_CATEGORY_ICONS: Record<string, string> = {
  "Sales Templates":       "💼",
  "Marketing Templates":   "📣",
  "Operations Templates":  "⚙️",
  "Business Analytics":    "📊",
  "Decision Tools":        "🎯",
  "Data Analytics":        "📈",
  "Product Management":    "🗺️",
  "Productivity Templates":"⚡",
  "Scheduling Templates":  "📅",
  "Finance Templates":     "💰",
  "HR Templates":          "👥",
  "Study Templates":       "📚",
  "Legal Templates":       "⚖️",
  "AI Prompt Templates":   "🤖",
  "AI Work Tools":         "✨",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data: kit } = await supabase
    .from("toolkits")
    .select("name, description")
    .eq("slug", slug)
    .single();
  return {
    title: kit ? `${kit.name} — AI Tools Station` : "Toolkit",
    description: kit?.description ?? "",
  };
}

export default async function ToolkitPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: kit } = await supabase
    .from("toolkits")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!kit) notFound();

  const { data: toolsRaw } = await supabase
    .from("tools")
    .select("slug, name, description, tool_type")
    .eq("toolkit_id", kit.id)
    .eq("is_active", true)
    .order("sort_order");
  const toolList = toolsRaw ?? [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-sm text-gray-400 mb-6">
        <Link href="/toolkits" className="hover:text-gray-600">Toolkits</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-600">{kit.name}</span>
      </div>

      <div className="mb-10">
        <div className="text-4xl mb-3">{kit.icon}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{kit.name}</h1>
        <p className="text-gray-500 mb-4">{kit.description}</p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            <strong className="text-gray-900">${kit.price_monthly}</strong>/month
          </span>
          <span className="text-sm text-gray-400">{toolList.length} tools included</span>
        </div>
      </div>

      {slug === "legal" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-xs text-amber-700">
          ⚠️ These tools provide general informational analysis only. They do not constitute legal advice.
        </div>
      )}

      {slug === "compliance-toolkit" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-xs text-amber-700">
          ⚠️ These tools provide general informational analysis only. They do not constitute legal, compliance, or regulatory advice. Please consult a qualified compliance professional or attorney.
        </div>
      )}

      {slug === "work-life-templates" ? (() => {
        // Group tools by category using the slug→category map
        const grouped: Record<string, typeof toolList> = {};
        for (const tool of toolList) {
          const cat = WLT_SLUG_TO_CATEGORY[tool.slug] ?? "Other";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(tool);
        }
        return (
          <div>
            {/* Category quick-nav */}
            <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-gray-100">
              {WLT_CATEGORY_ORDER.map((cat) => {
                const count = grouped[cat]?.length ?? 0;
                if (count === 0) return null;
                return (
                  <a
                    key={cat}
                    href={`#cat-${cat.toLowerCase().replace(/ /g, "-")}`}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    {WLT_CATEGORY_ICONS[cat]} {cat}
                    <span className="text-gray-400">({count})</span>
                  </a>
                );
              })}
            </div>

            {/* Category sections */}
            {WLT_CATEGORY_ORDER.map((cat) => {
              const catTools = grouped[cat];
              if (!catTools || catTools.length === 0) return null;
              return (
                <div
                  key={cat}
                  id={`cat-${cat.toLowerCase().replace(/ /g, "-")}`}
                  className="mb-12 scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-2xl">{WLT_CATEGORY_ICONS[cat]}</span>
                    <h2 className="text-xl font-bold text-gray-900">{cat}</h2>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                      {catTools.length} templates
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catTools.map((tool) => (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className="border border-gray-200 rounded-xl p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
                      >
                        <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-black">{tool.name}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{tool.description}</p>
                        <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Use template →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })() : (
        /* All other toolkits — original flat grid, unchanged */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolList.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="border border-gray-200 rounded-xl p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-black">{tool.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-3">{tool.description}</p>
              <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Try tool →</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
