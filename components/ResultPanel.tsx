"use client";

import ReactMarkdown from "react-markdown";

interface Props {
  result: string;
  format?: "text" | "markdown" | "json";
}

export default function ResultPanel({ result, format = "markdown" }: Props) {
  if (!result) return null;

  function handleCopy() {
    navigator.clipboard.writeText(result);
  }

  return (
    <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-600">AI Output</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-500 hover:text-black transition-colors px-3 py-1 rounded-lg hover:bg-gray-200"
        >
          Copy
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {format === "markdown" ? (
          <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        ) : format === "json" ? (
          <pre className="text-xs bg-gray-50 rounded-xl p-4 overflow-auto whitespace-pre-wrap">
            {JSON.stringify(JSON.parse(result), null, 2)}
          </pre>
        ) : (
          <pre className="text-sm whitespace-pre-wrap text-gray-800 font-sans leading-relaxed">
            {result}
          </pre>
        )}
      </div>
    </div>
  );
}
