"use client";

import { useState, useRef } from "react";

interface FileUploadInputProps {
  onTextExtracted: (text: string) => void;
  accept?: string;
  label?: string;
}

export default function FileUploadInput({
  onTextExtracted,
  accept = ".pdf,.doc,.docx,.txt",
  label = "Upload Document",
}: FileUploadInputProps) {
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError("");
    setFileName(file.name);

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const text = await file.text();
        onTextExtracted(text);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/tools/extract-text", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to extract text");
      const data = await res.json();
      onTextExtracted(data.text);
    } catch {
      setError("Failed to read file. Please try pasting the text instead.");
      setFileName("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          fileName
            ? "border-indigo-300 bg-indigo-50"
            : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></span>
            Reading file...
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
            <span>📄</span>
            <span className="font-medium">{fileName}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName("");
                onTextExtracted("");
              }}
              className="text-gray-400 hover:text-gray-600 ml-1"
            >
              ✕
            </button>
          </div>
        ) : (
          <div>
            <div className="text-2xl mb-1">📎</div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT · or drag & drop</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
