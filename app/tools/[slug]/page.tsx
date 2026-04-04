"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import InputForm from "@/components/InputForm";
import ResultPanel from "@/components/ResultPanel";
import UpgradeModal from "@/components/UpgradeModal";
import ReactMarkdown from "react-markdown";
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx";
import type { Tool, InputField } from "@/types";

// ── Doc tool config — only slugs that actually exist in the DB ────────────
const DOC_TOOL_CONFIG: Record<string, {
  splitMarker: string;
  label1: string;
  label2: string;
  downloadName: string;
}> = {
  "resume-optimizer": {
    splitMarker: "## OPTIMIZED RESUME",
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
  "nda-analyzer": {
    splitMarker: "## ANNOTATED NDA",
    label1: "📋 NDA Analysis",
    label2: "📄 Analysis Report",
    downloadName: "nda-analysis-report",
  },
  "contract-risk-analyzer": {
    splitMarker: "## ANNOTATED CONTRACT",
    label1: "📋 Contract Analysis",
    label2: "📄 Analysis Report",
    downloadName: "contract-analysis-report",
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

function parseDocToolOutput(output: string, splitMarker: string) {
  const idx = output.indexOf(splitMarker);
  if (idx === -1) return { summary: output, document: "" };
  return {
    summary: output.slice(0, idx).trim(),
    document: output.slice(idx + splitMarker.length).trim(),
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
  const slug = params.slug as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [outputFormat, setOutputFormat] = useState<"text" | "markdown" | "json">("markdown");
  const [error, setError] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeToolkit, setUpgradeToolkit] = useState<string | undefined>();
  const [pageLoading, setPageLoading] = useState(true);
  const [docExpanded, setDocExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTool() {
      const { data, error } = await supabase
        .from("tools")
        .select("*, toolkits(slug, name)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setError("Tool not found");
      } else {
        setTool(data as Tool);
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

      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_slug: slug, inputs, session_id: sessionId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error === "free_limit_reached" || data.error === "lifetime_limit_reached") {
          setUpgradeToolkit(data.toolkit_slug);
          setShowUpgrade(true);
          return;
        }
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data.output);
      setOutputFormat(data.output_format ?? "markdown");
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
  const docParts = isDocTool ? parseDocToolOutput(result, docConfig.splitMarker) : null;

  return (
    <div className="min-h-screen bg-white">
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          toolkitSlug={upgradeToolkit}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
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

        {/* Legal disclaimer */}
        {tool.toolkits?.slug === "legal" && (
          <p className="mt-6 text-xs text-gray-400 text-center">
            ⚠️ This tool provides general informational analysis only. It does not constitute legal advice.
          </p>
        )}
      </div>
    </div>
  );
}
