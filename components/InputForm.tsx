"use client";

import { useState } from "react";
import type { InputField } from "@/types";

interface Props {
  fields: InputField[];
  onSubmit: (inputs: Record<string, string>) => void;
  loading?: boolean;
}

export default function InputForm({ fields, onSubmit, loading = false }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fileHints, setFileHints] = useState<Record<string, string>>({});

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  // file 字段：找同名对应的 textarea（去掉 _file 后缀，或直接找 "resume" 对应 "resume_file"）
  function getTargetFieldName(fileFieldName: string): string {
    // e.g. "resume_file" → "resume"
    return fileFieldName.replace(/_file$/, "");
  }

  function handleFileChange(fileFieldName: string, file: File | null) {
    if (!file) return;

    const targetName = getTargetFieldName(fileFieldName);

    if (file.type === "application/pdf") {
      setFileHints((prev) => ({
        ...prev,
        [fileFieldName]: "PDF detected — please paste your resume text manually in the field above.",
      }));
      return;
    }

    // .txt or other text files
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      setValues((prev) => ({ ...prev, [targetName]: text }));
      setFileHints((prev) => ({
        ...prev,
        [fileFieldName]: `✓ File loaded: ${file.name}`,
      }));
    };
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Exclude file-type fields from submission — they only populate other fields
    const submitValues: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "file") {
        submitValues[field.name] = values[field.name] ?? "";
      }
    }
    onSubmit(submitValues);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder ?? ""}
              required={field.required}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-vertical"
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === "select" && field.options ? (
            <select
              name={field.name}
              required={field.required}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "file" ? (
            <div>
              <input
                type="file"
                accept=".txt,.pdf"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                onChange={(e) => handleFileChange(field.name, e.target.files?.[0] ?? null)}
              />
              {fileHints[field.name] && (
                <p className={`mt-1.5 text-xs ${fileHints[field.name].startsWith("✓") ? "text-green-600" : "text-amber-600"}`}>
                  {fileHints[field.name]}
                </p>
              )}
            </div>
          ) : (
            <input
              type="text"
              name={field.name}
              placeholder={field.placeholder ?? ""}
              required={field.required}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Generating...
          </span>
        ) : (
          "Generate ✨"
        )}
      </button>
    </form>
  );
}
