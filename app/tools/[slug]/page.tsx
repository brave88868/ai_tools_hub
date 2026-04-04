"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import InputForm from "@/components/InputForm";
import ResultPanel from "@/components/ResultPanel";
import UpgradeModal from "@/components/UpgradeModal";
import type { Tool, InputField } from "@/types";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("session_id", sid);
  }
  return sid;
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

  return (
    <div className="min-h-screen bg-white">
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          toolkitSlug={upgradeToolkit}
        />
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-400 mb-6">
          <a href="/toolkits" className="hover:text-gray-600">Toolkits</a>
          <span className="mx-2">›</span>
          <a
            href={`/toolkits/${tool.toolkits?.slug}`}
            className="hover:text-gray-600 capitalize"
          >
            {tool.toolkits?.name}
          </a>
          <span className="mx-2">›</span>
          <span className="text-gray-600">{tool.name}</span>
        </div>

        {/* Tool Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{tool.name}</h1>
          {tool.description && (
            <p className="text-gray-500 text-base">{tool.description}</p>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {inputFields.length > 0 ? (
            <InputForm fields={inputFields} onSubmit={handleSubmit} loading={loading} />
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

        {/* Result */}
        {result && <ResultPanel result={result} format={outputFormat} />}

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
