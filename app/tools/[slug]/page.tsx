"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import InputForm from "@/components/InputForm";
import ResultPanel from "@/components/ResultPanel";
import UpgradeModal from "@/components/UpgradeModal";
import ReactMarkdown from "react-markdown";
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx";
import type { Tool, InputField } from "@/types";
import FeedbackModal from "@/components/FeedbackModal";
import UpgradeCTA from "@/components/revenue/UpgradeCTA";
import EmailCapture from "@/components/revenue/EmailCapture";
import { CopyButton } from "@/components/ui/CopyButton";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";

// ── Doc tool config — only slugs that actually exist in the DB ────────────
const DOC_TOOL_CONFIG: Record<string, {
  splitMarker: string;
  endMarker?: string;
  label1: string;
  label2: string;
  downloadName: string;
}> = {
  "resume-optimizer": {
    splitMarker: "## OPTIMIZED RESUME",
    endMarker: "## KEYWORD ANALYSIS",
    label1: "✏️ What Changed & Why",
    label2: "📄 Optimized Resume Preview",
    downloadName: "optimized-resume",
  },
  "linkedin-profile-optimizer": {
    splitMarker: "## OPTIMIZED PROFILE",
    label1: "✏️ What Changed & Why",
    label2: "📄 Optimized LinkedIn Profile",
    downloadName: "optimized-linkedin-profile",
  },
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
}

function parseDocToolOutput(output: string, splitMarker: string, endMarker?: string) {
  const startIdx = output.indexOf(splitMarker);
  if (startIdx === -1) return { summary: output, document: "" };

  const docStart = startIdx + splitMarker.length;

  if (endMarker) {
    const endIdx = output.indexOf(endMarker, docStart);
    if (endIdx !== -1) {
      const beforeDoc = output.slice(0, startIdx).trim();
      const afterDoc = output.slice(endIdx).trim();
      const summary = [beforeDoc, afterDoc].filter(Boolean).join("\n\n");
      const document = output.slice(docStart, endIdx).trim();
      return { summary, document };
    }
  }

  return {
    summary: output.slice(0, startIdx).trim(),
    document: output.slice(docStart).trim(),
  };
}

async function downloadDocx(content: string, filename: string) {
  const lines = content.split("\n");
  const paragraphs = lines.map((line) => {
    if (!line.trim()) return new Paragraph({ text: "" });
    if (line.startsWith("## ")) {
      return new Paragraph({ text: line.replace(/^##\s*/, ""), heading: HeadingLevel.HEADING_2 });
    }
    if (line.startsWith("# ")) {
      return new Paragraph({ text: line.replace(/^#\s*/, ""), heading: HeadingLevel.HEADING_1 });
    }
    if (line.trim() === line.trim().toUpperCase() && line.trim().length > 2 && line.trim().length < 60) {
      return new Paragraph({ text: line.trim(), heading: HeadingLevel.HEADING_2 });
    }
    if (line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ")) {
      return new Paragraph({
        children: [new TextRun({ text: line.replace(/^[\s\-•]+/, ""), size: 24 })],
        bullet: { level: 0 },
      });
    }
    const boldMatch = line.match(/^\*\*(.+)\*\*$/);
    if (boldMatch) {
      return new Paragraph({ children: [new TextRun({ text: boldMatch[1], bold: true, size: 24 })] });
    }
    return new Paragraph({ children: [new TextRun({ text: line, size: 24 })] });
  });

  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ToolPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParams.get("preview") === "true";

  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [outputFormat, setOutputFormat] = useState<"text" | "markdown" | "json">("markdown");
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeToolkit, setUpgradeToolkit] = useState<string | undefined>();
  const [upgradeErrorType, setUpgradeErrorType] = useState<string | undefined>();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [docExpanded, setDocExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [toolUseCases, setToolUseCases] = useState<Array<{ slug: string; title: string | null; meta: Record<string, string> | null }>>([]);
  const [relatedTools, setRelatedTools] = useState<Array<{ slug: string; name: string }>>([]);

  useEffect(() => {
    async function loadTool() {
      // Resolve auth + role first so we can decide the query filter
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setIsLoggedIn(!!currentUser);

      let resolvedRole = "";
      if (currentUser) {
        const { data: ur } = await supabase.from("users").select("role").eq("id", currentUser.id).single();
        resolvedRole = ur?.role ?? "";
        setUserRole(resolvedRole);
      }

      // Admin + ?preview=true → allow inactive tools; everyone else must see active only
      const allowInactive = isPreview && resolvedRole === "admin";

      const query = supabase
        .from("tools")
        .select("*, toolkits(slug, name)")
        .eq("slug", slug);
      if (!allowInactive) query.eq("is_active", true);

      const { data, error } = await query.single();

      if (error || !data) {
        setError("Tool not found");
      } else {
        setTool(data as Tool);
        // page_view 埋点（非关键，失败不影响用户体验）
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_type: "page_view", tool_slug: slug, metadata: { page: `/tools/${slug}` } }),
        }).catch(() => {});
        // 加载该工具的 use-case 页面（最多 6 条）
        supabase
          .from("seo_pages")
          .select("slug, title, meta")
          .eq("tool_slug", slug)
          .eq("type", "use_case")
          .limit(6)
          .then(({ data: ucs }) => { if (ucs) setToolUseCases(ucs as typeof toolUseCases); });
        // 加载同 toolkit 的相关工具（最多 5 个，排除当前工具）
        if (data.toolkit_id) {
          supabase
            .from("tools")
            .select("slug, name")
            .eq("toolkit_id", data.toolkit_id)
            .eq("is_active", true)
            .neq("slug", slug)
            .order("sort_order", { ascending: true })
            .limit(5)
            .then(({ data: rt }) => { if (rt) setRelatedTools(rt); });
        }
      }
      setPageLoading(false);
    }
    if (slug) loadTool();
  }, [slug]);

  async function handleSubmit(inputs: Record<string, string>) {
    setLoading(true);
    setResult("");
    setError("");
    setDocExpanded(false);

    try {
      const sessionId = getSessionId();
      // getUser() 向服务器验证 token，比 getSession() 更可靠（不返回过期/缓存态）
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setIsLoggedIn(!!currentUser);
      // getSession() 获取 access_token（只在确认有效 user 后使用）
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = currentUser ? (session?.access_token ?? "") : "";

      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ tool_slug: slug, inputs, session_id: sessionId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error === "free_limit_reached" || data.error === "lifetime_limit_reached") {
          setUpgradeToolkit(data.toolkit_slug);
          setUpgradeErrorType(data.error);
          setShowUpgrade(true);
          return;
        }
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data.output);
      setOutputFormat(data.output_format ?? "markdown");

      // 异步创建 UGC example 页（不阻塞用户体验）
      const inputContext = Object.values(inputs)
        .filter(Boolean)
        .slice(0, 2)
        .join(" ")
        .substring(0, 120);
      fetch("/api/examples/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_slug: slug,
          raw_output: data.output,
          input_context: inputContext,
        }),
      }).catch(() => {});
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error === "Tool not found" || !tool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tool not found</h1>
          <p className="text-gray-500">The tool you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const inputFields: InputField[] = Array.isArray(tool.inputs_schema) ? tool.inputs_schema : [];

  const docConfig = DOC_TOOL_CONFIG[slug];
  const isDocTool = !!docConfig && !!result;
  const docParts = isDocTool ? parseDocToolOutput(result, docConfig.splitMarker, docConfig.endMarker) : null;

  return (
    <div className="min-h-screen bg-white">
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          toolkitSlug={upgradeToolkit}
          isLoggedIn={isLoggedIn}
          errorType={upgradeErrorType}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-6 md:py-12">
        {/* Tool Header */}
        <div className="border-b border-gray-100 pb-6 mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <a href="/toolkits" className="hover:text-gray-600">Toolkits</a>
            <span>›</span>
            <a href={`/toolkits/${tool.toolkits?.slug}`} className="hover:text-gray-600 capitalize">
              {tool.toolkits?.name}
            </a>
            <span>›</span>
            <span className="text-gray-600">{tool.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{tool.name}</h1>
          {tool.description && (
            <p className="text-gray-500 text-sm">{tool.description}</p>
          )}
        </div>

        {/* Compliance disclaimer — above form */}
        {tool.toolkits?.slug === "compliance" && (
          <div className="mb-4">
            <ComplianceDisclaimer />
          </div>
        )}

        {/* Input Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {inputFields.length > 0 ? (
            <InputForm
              fields={inputFields}
              onSubmit={handleSubmit}
              loading={loading}
              supportsFileUpload={tool.supports_file_upload ?? false}
            />
          ) : (
            <p className="text-gray-400 text-sm">This tool has no input fields configured.</p>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mt-6 text-center text-sm text-gray-400 animate-pulse">
            Generating AI output...
          </div>
        )}

        {/* Error */}
        {error && error !== "Tool not found" && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Doc tools — dual view (summary + collapsible document) */}
        {isDocTool && docParts && docConfig && (
          <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
            {/* Section 1: Analysis / summary */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {docConfig.label1}
              </span>
            </div>
            <div className="p-4 prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown>{docParts.summary || "*No summary available.*"}</ReactMarkdown>
            </div>

            {/* Section 2: Document preview (collapsible) */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setDocExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-600 uppercase tracking-wide"
              >
                <span>{docConfig.label2}</span>
                <span>{docExpanded ? "▲ Collapse" : "▼ Expand"}</span>
              </button>
              {docExpanded && (
                <div className="p-4 prose prose-sm max-w-none text-gray-700 border-t border-gray-100">
                  <ReactMarkdown>{docParts.document || "*No document content.*"}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(docParts.document || result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 text-xs text-gray-600 border border-gray-200 rounded-lg py-2 hover:border-gray-400 transition-colors"
              >
                {copied ? "✓ Copied" : "Copy Document Text"}
              </button>
              <button
                onClick={() => downloadDocx(docParts.document || result, docConfig.downloadName)}
                className="flex-1 text-xs bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-lg py-2 hover:opacity-90 transition-opacity"
              >
                ↓ Download .docx
              </button>
            </div>
          </div>
        )}

        {/* All other tools — standard ResultPanel */}
        {!isDocTool && result && (
          <ResultPanel
            result={result}
            format={outputFormat}
            toolSlug={slug}
            toolName={tool.name}
          />
        )}

        {/* Post-result CTAs */}
        {result && !isLoggedIn && (
          <EmailCapture toolSlug={slug} />
        )}
        {result && isLoggedIn && userRole === "user" && (
          <UpgradeCTA trigger="result_page" toolName={tool.name} className="mt-4" />
        )}
        {/* Viral referral prompt — shown after any result for logged-in free users */}
        {result && isLoggedIn && userRole === "user" && (
          <div className="mt-3 flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
            <span className="text-base">💡</span>
            <p className="text-xs text-gray-600 flex-1">
              Loving the results?{" "}
              <a href="/dashboard/referrals" className="font-semibold text-indigo-600 hover:text-indigo-800 underline">
                Share with friends and earn +20 free uses
              </a>{" "}
              per invite.
            </p>
          </div>
        )}

        {/* Legal disclaimer */}
        {tool.toolkits?.slug === "legal" && (
          <p className="mt-6 text-xs text-gray-400 text-center">
            ⚠️ This tool provides general informational analysis only. It does not constitute legal advice.
          </p>
        )}

        {/* Compliance disclaimer — below result */}
        {tool.toolkits?.slug === "compliance" && result && (
          <div className="mt-4">
            <ComplianceDisclaimer />
          </div>
        )}

        {/* Use Cases for This Tool — internal linking for SEO */}
        {toolUseCases.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Use Cases for {tool.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {toolUseCases.map((uc) => {
                const profession = (uc.meta?.profession ?? "").replace(/-/g, " ");
                return (
                  <a
                    key={uc.slug}
                    href={`/use-cases/${uc.slug}`}
                    className="border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 hover:border-indigo-200 hover:text-indigo-600 transition-all line-clamp-2 capitalize"
                  >
                    {uc.title ?? profession}
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Related tools in same category */}
        {relatedTools.length > 0 && tool.toolkits && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              More {tool.toolkits.name} Tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedTools.map((rt) => (
                <a
                  key={rt.slug}
                  href={`/tools/${rt.slug}`}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                >
                  {rt.name}
                </a>
              ))}
              <a
                href={`/toolkits/${tool.toolkits.slug}`}
                className="border border-indigo-100 bg-indigo-50 rounded-lg px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-100 transition-all"
              >
                View all →
              </a>
            </div>
          </div>
        )}

        {/* Alternatives */}
        <div className="mt-6 flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
          <div>
            <p className="text-xs font-medium text-gray-700">Looking for alternatives?</p>
            <p className="text-xs text-gray-400 mt-0.5">Compare {tool.name} with similar AI tools</p>
          </div>
          <a
            href={`/${slug}-alternatives`}
            className="shrink-0 text-xs text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-all"
          >
            See alternatives →
          </a>
        </div>

        {/* Embed Section */}
        <details className="mt-8 rounded-xl border border-gray-200 overflow-hidden">
          <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
            <span className="text-sm font-medium text-gray-700">Embed this tool on your website</span>
            <span className="text-xs text-gray-400">Show embed code ▼</span>
          </summary>
          <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 my-3">
              Add this AI tool to your website for free. Your visitors get the tool, you get the traffic.
            </p>
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-gray-300 select-all break-all">
              {`<iframe src="https://aitoolsstation.com/embed/${slug}" width="100%" height="600" frameborder="0"></iframe>`}
            </div>
            <div className="mt-2">
              <CopyButton
                text={`<iframe src="https://aitoolsstation.com/embed/${slug}" width="100%" height="600" frameborder="0"></iframe>`}
              />
            </div>
          </div>
        </details>

        {/* Feedback */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <FeedbackModal toolSlug={slug} />
        </div>
      </div>
    </div>
  );
}
