"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import InputForm from "@/components/InputForm";
import ResultPanel from "@/components/ResultPanel";
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

export default function EmbedPage() {
  const params = useParams();
  const toolSlug = params.tool_slug as string;

  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [outputFormat, setOutputFormat] = useState<"text" | "markdown" | "json">("markdown");
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function loadTool() {
      const { data, error } = await supabase
        .from("tools")
        .select("*, toolkits(slug, name)")
        .eq("slug", toolSlug)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setError("Tool not found");
      } else {
        setTool(data as Tool);
      }
      setPageLoading(false);
    }
    if (toolSlug) loadTool();
  }, [toolSlug]);

  async function handleSubmit(inputs: Record<string, string>) {
    setLoading(true);
    setResult("");
    setError("");

    try {
      const sessionId = getSessionId();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ tool_slug: toolSlug, inputs, session_id: sessionId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error === "Tool not found" || !tool) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Tool not found.</p>
      </div>
    );
  }

  const inputFields: InputField[] = Array.isArray(tool.inputs_schema) ? tool.inputs_schema : [];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Stripped-down tool widget */}
      <div className="flex-1 p-4 max-w-2xl mx-auto w-full">
        {/* Tool header */}
        <div className="mb-4 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{tool.name}</h2>
          {tool.description && (
            <p className="text-xs text-gray-500 mt-0.5">{tool.description}</p>
          )}
        </div>

        {/* Input Form */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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

        {/* Loading */}
        {loading && (
          <div className="mt-4 text-center text-sm text-gray-400 animate-pulse">
            Generating AI output…
          </div>
        )}

        {/* Error */}
        {error && error !== "Tool not found" && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <ResultPanel
            result={result}
            format={outputFormat}
            toolSlug={toolSlug}
            toolName={tool.name}
          />
        )}
      </div>

      {/* Attribution */}
      <div className="border-t border-gray-100 py-2 px-4 bg-gray-50 flex items-center justify-center">
        <a
          href="https://www.aitoolsstation.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Powered by <span className="font-semibold text-gray-600">aitoolsstation.com</span>
        </a>
      </div>
    </div>
  );
}
