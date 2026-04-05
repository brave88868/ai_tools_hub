import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Product Roadmap | AI Tools Hub",
  description:
    "See what we're building next, what's planned, and what's already shipped. Submit new feature requests.",
  openGraph: {
    title: "Product Roadmap | AI Tools Hub",
    description: "See what we're building, what's planned, and what's been released.",
    url: "https://aitoolsstation.com/roadmap",
    siteName: "AI Tools Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Product Roadmap | AI Tools Hub",
    description: "See what we're building, what's planned, and what's been released.",
  },
};

type FeatureStatus = "planned" | "in_progress" | "released" | "open";

interface Feature {
  id: string;
  title: string;
  description: string | null;
  votes: number;
  status: FeatureStatus;
}

const COLUMNS: {
  status: FeatureStatus;
  label: string;
  headerClass: string;
  bodyClass: string;
  dotClass: string;
}[] = [
  {
    status: "planned",
    label: "Planned",
    headerClass: "bg-blue-50 border-blue-200 text-blue-700",
    bodyClass: "border-blue-200 bg-blue-50/50",
    dotClass: "bg-blue-400",
  },
  {
    status: "in_progress",
    label: "In Progress",
    headerClass: "bg-yellow-50 border-yellow-200 text-yellow-700",
    bodyClass: "border-yellow-200 bg-yellow-50/50",
    dotClass: "bg-yellow-400",
  },
  {
    status: "released",
    label: "Released",
    headerClass: "bg-green-50 border-green-200 text-green-700",
    bodyClass: "border-green-200 bg-green-50/50",
    dotClass: "bg-green-400",
  },
  {
    status: "open",
    label: "Open",
    headerClass: "bg-gray-50 border-gray-200 text-gray-600",
    bodyClass: "border-gray-200 bg-gray-50/50",
    dotClass: "bg-gray-300",
  },
];

export default async function RoadmapPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("features")
    .select("id, title, description, votes, status")
    .order("votes", { ascending: false });

  const features = (data ?? []) as Feature[];

  const grouped = Object.fromEntries(
    COLUMNS.map((col) => [
      col.status,
      features.filter((f) => f.status === col.status),
    ])
  ) as Record<FeatureStatus, Feature[]>;

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Product Roadmap</h1>
          <p className="text-gray-500 text-sm">
            What we&apos;re building, what&apos;s planned, and what&apos;s shipped.
          </p>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {COLUMNS.map((col) => {
          const items = grouped[col.status] ?? [];
          return (
            <div key={col.status} className="flex flex-col">
              {/* Column header */}
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl border-t border-x ${col.headerClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${col.dotClass} flex-shrink-0`} />
                <span className="text-xs font-semibold uppercase tracking-wider flex-1">
                  {col.label}
                </span>
                <span className="text-xs font-bold opacity-70">{items.length}</span>
              </div>

              {/* Cards */}
              <div
                className={`border border-t-0 rounded-b-xl ${col.bodyClass} flex-1 p-3 space-y-2.5 min-h-[140px]`}
              >
                {items.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6 italic">Nothing here yet</p>
                ) : (
                  items.map((f) => (
                    <div
                      key={f.id}
                      className="bg-white rounded-lg border border-gray-100 p-3.5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-gray-900 mb-1 leading-snug">
                        {f.title}
                      </p>
                      {f.description && (
                        <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-2">
                          {f.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span>▲</span>
                        <span>{f.votes}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

    </main>
  );
}
