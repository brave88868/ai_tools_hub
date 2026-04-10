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
    <section className="pt-10 pb-2 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 border-l-4 border-indigo-500 pl-4">Explore Toolkits by Workflow</h2>
          <p className="text-lg text-gray-700 pl-5">Find the right tools for your work</p>
        </div>

        <ToolkitTabsClient groups={GROUPS} toolkitMap={toolkitMap} />

        <div className="text-center">
          <Link
            href="/toolkits"
            className="inline-flex items-center gap-2 text-base font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Explore all 24 toolkits →
          </Link>
        </div>
      </div>
    </section>
  );
}
