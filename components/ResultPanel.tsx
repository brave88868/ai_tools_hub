"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from "docx";

interface Props {
  result: string;
  format?: "text" | "markdown" | "json";
  toolSlug?: string;
  toolName?: string;
}

export default function ResultPanel({ result, format = "markdown", toolSlug, toolName }: Props) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    const filename = (toolName ?? "result").toLowerCase().replace(/\s+/g, "-");

    const lines = result.split("\n");
    const paragraphs = lines.map((line) => {
      if (!line.trim()) {
        return new Paragraph({ text: "" });
      }
      // Markdown heading: ## Heading or # Heading
      if (line.startsWith("## ")) {
        return new Paragraph({
          text: line.replace(/^##\s*/, ""),
          heading: HeadingLevel.HEADING_2,
        });
      }
      if (line.startsWith("# ")) {
        return new Paragraph({
          text: line.replace(/^#\s*/, ""),
          heading: HeadingLevel.HEADING_1,
        });
      }
      // ALL CAPS short line = section header (resume style)
      if (line.trim() === line.trim().toUpperCase() && line.trim().length < 60 && line.trim().length > 2) {
        return new Paragraph({
          text: line.trim(),
          heading: HeadingLevel.HEADING_2,
        });
      }
      // Bullet point lines
      if (line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ")) {
        return new Paragraph({
          children: [new TextRun({ text: line.replace(/^[\s\-•]+/, ""), size: 24 })],
          bullet: { level: 0 },
        });
      }
      // Bold markdown: **text**
      const boldMatch = line.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        return new Paragraph({
          children: [new TextRun({ text: boldMatch[1], bold: true, size: 24 })],
        });
      }
      return new Paragraph({
        children: [new TextRun({ text: line, size: 24 })],
      });
    });

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

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

  return (
    <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Result</span>
      </div>

      {/* Resume optimizer — optimization summary */}
      {toolSlug === "resume-optimizer" && (
        <div className="mx-4 mt-4 p-4 bg-green-50 border border-green-100 rounded-xl">
          <h4 className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">✓ Optimizations Applied</h4>
          <ul className="text-xs text-green-600 space-y-1">
            <li>• Tailored keywords for the job description</li>
            <li>• Strengthened action verbs and metrics</li>
            <li>• Improved formatting and structure</li>
            <li>• Enhanced professional summary</li>
          </ul>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {format === "markdown" ? (
          <div className="prose prose-sm max-w-none text-gray-700">
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

      {/* Footer — Copy + Download */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={handleCopy}
          className="flex-1 text-xs text-gray-600 border border-gray-200 rounded-lg py-2 hover:border-gray-400 transition-colors"
        >
          {copied ? "✓ Copied" : "Copy Text"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-1.5 flex-1 text-xs text-indigo-600 border border-indigo-200 rounded-lg py-2 hover:bg-indigo-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download .docx
        </button>
      </div>
    </div>
  );
}
