"use client";

import { useState } from "react";
import type { InputField } from "@/types";
import FileUploadInput from "@/components/tools/FileUploadInput";

interface Props {
  fields: InputField[];
  onSubmit: (inputs: Record<string, string>) => void;
  loading?: boolean;
  supportsFileUpload?: boolean;
}

export default function InputForm({ fields, onSubmit, loading = false, supportsFileUpload = false }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fileHints, setFileHints] = useState<Record<string, string>>({});

  function handleChange(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function getTargetFieldName(fileFieldName: string): string {
    return fileFieldName.replace(/_file$/, "");
  }

  function handleFileChange(fileFieldName: string, file: File | null) {
    if (!file) return;
    const targetName = getTargetFieldName(fileFieldName);
    if (file.type === "application/pdf") {
      setFileHints((prev) => ({
        ...prev,
        [fileFieldName]: "PDF detected — please paste your text manually in the field above.",
      }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      setValues((prev) => ({ ...prev, [targetName]: text }));
      setFileHints((prev) => ({ ...prev, [fileFieldName]: `✓ File loaded: ${file.name}` }));
    };
    reader.readAsText(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submitValues: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "file") {
        submitValues[field.name] = values[field.name] ?? "";
      } else {
        // Include text extracted from file fields (stored under the target name)
        const targetName = getTargetFieldName(field.name);
        submitValues[targetName] = values[targetName] ?? "";
      }
    }
    onSubmit(submitValues);
  }

  // First text/textarea field name (for file upload injection)
  const firstTextField = fields.find((f) => f.type === "textarea" || f.type === "text");

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field, fieldIndex) => (
        <div key={field.name}>
          {/* File upload above first text field */}
          {supportsFileUpload && fieldIndex === 0 && firstTextField && field.name === firstTextField.name && (
            <FileUploadInput
              label="Upload your document (PDF, DOCX, TXT)"
              onTextExtracted={(text) => setValues((prev) => ({ ...prev, [field.name]: text }))}
            />
          )}

          <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              name={field.name}
              placeholder={field.placeholder ?? ""}
              required={field.required}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none transition-all"
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === "select" && field.options ? (
            <select
              name={field.name}
              required={field.required}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : field.type === "file" ? (
            <FileUploadInput
              label="Click to upload or drag & drop"
              accept=".pdf,.docx,.txt"
              onTextExtracted={(text) => {
                const targetName = getTargetFieldName(field.name);
                setValues((prev) => ({ ...prev, [targetName]: text.slice(0, 6000) }));
              }}
            />
          ) : (
            <input
              type="text"
              name={field.name}
              placeholder={field.placeholder ?? ""}
              required={field.required}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all"
              value={values[field.name] ?? ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Generating...
          </>
        ) : (
          <>Generate ✦</>
        )}
      </button>
    </form>
  );
}
