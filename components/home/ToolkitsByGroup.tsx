import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import ToolkitTabsClient from "./ToolkitTabsClient";

const GROUPS = [
  {
    label: "For Job Seekers & Students",
    slugs: ["jobseeker", "hr-hiring", "exam"],
  },
  {
    label: "For Professionals",
    slugs: ["work-life-templates", "productivity", "document", "meeting", "knowledge"],
  },
  {
    label: "For Business",
    slugs: ["business", "sales", "finance", "email-marketing", "presentation-toolkit", "customer-support"],
  },
  {
    label: "For Creators & Marketers",
    slugs: ["creator", "social-media", "seo-content", "marketing", "ai-prompts"],
  },
  {
    label: "For Developers & Analysts",
    slugs: ["data-analytics", "workflow-automation-toolkit", "ai-workflow"],
  },
  {
    label: "For Legal & Compliance",
    slugs: ["legal", "compliance-toolkit"],
  },
];

export default async function ToolkitsByGroup() {
  const supabase = createAdminClient();

  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("slug, name, description, icon, price_monthly")
    .eq("is_active", true)
    .neq("slug", "bundle");

  const toolkitMap = Object.fromEntries(
    (toolkits ?? []).map((kit) => [kit.slug, kit])
  );

  return (
    <section className="py-8 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-indigo-500 pl-3">
            Explore by Workflow
          </h2>
          <span className="text-sm text-gray-400 hidden sm:inline">Find tools for your job</span>
          <Link
            href="/toolkits"
            className="ml-auto text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            All toolkits →
          </Link>
        </div>
        <ToolkitTabsClient groups={GROUPS} toolkitMap={toolkitMap} />
      </div>
    </section>
  );
}
