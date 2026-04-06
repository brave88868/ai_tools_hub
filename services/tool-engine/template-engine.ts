// Layer 1 — Template Engine
// 读取 /prompts/[toolkit]/[tool].txt，替换 {variable} 占位符，调用 OpenAI
// 若文件不存在，fallback 使用 tool.prompt_template 字段（auto-generated 工具）

import fs from "fs/promises";
import path from "path";
import { openai, OPENAI_MODEL } from "@/lib/openai";

// Mode A: text-processing tools that need structured dual-panel output
const TEXT_PROCESSING_SLUGS = [
  "resume-optimizer",
  "linkedin-profile-optimizer",
  "essay-writing-feedback-generator",
  "meta-title-description-optimizer",
  "blog-post-seo-optimizer",
  "meeting-notes-optimizer",
  "reading-notes-to-action-items-converter",
  "board-meeting-minutes-generator",
  "meeting-notes-to-project-plan-converter",
  "email-copywriting-optimizer",
  "job-posting-optimizer",
  "customer-feedback-response-optimizer",
];

const TEXT_PROCESSING_FORMAT = `

IMPORTANT: Structure your entire response using EXACTLY these markers (no other format):

=== OPTIMIZED CONTENT ===
[Insert the complete optimized document here — full text, no truncation]

=== CHANGES MADE ===
• [Change 1 heading]: [Specific reason this improves the document]
• [Change 2 heading]: [Specific reason this improves the document]
• [Change 3 heading]: [Specific reason this improves the document]
• [Change 4 heading]: [Specific reason this improves the document]
• [Change 5 heading]: [Specific reason this improves the document]`;

export async function runTemplateTool(
  tool: { slug: string; prompt_file?: string; prompt_template?: string; name?: string; description?: string },
  inputs: Record<string, string>
): Promise<string> {
  let promptTemplate: string | null = null;

  // 1. 优先读取文件
  if (tool.prompt_file) {
    const promptPath = path.join(process.cwd(), "prompts", tool.prompt_file);
    try {
      promptTemplate = await fs.readFile(promptPath, "utf-8");
    } catch {
      // 文件不存在，继续尝试 inline
    }
  }

  // 2. Fallback：使用 DB 中存储的 prompt_template
  if (!promptTemplate && tool.prompt_template) {
    promptTemplate = tool.prompt_template;
  }

  // 3. 最终 fallback：用工具名称生成通用 prompt
  if (!promptTemplate) {
    const inputSummary = Object.entries(inputs)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    promptTemplate = `You are an AI assistant helping with "${tool.name ?? tool.slug}".
${tool.description ? `Tool description: ${tool.description}` : ""}

User inputs:
${inputSummary}

Please provide a helpful, detailed, and well-structured response.`;
  }

  // Mode A: append structured output format instructions
  if (TEXT_PROCESSING_SLUGS.includes(tool.slug ?? "")) {
    promptTemplate += TEXT_PROCESSING_FORMAT;
  }

  // 替换所有 {variable} 占位符
  const prompt = promptTemplate.replace(
    /\{(\w+)\}/g,
    (_, key) => inputs[key] ?? `[${key} not provided]`
  );

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content ?? "";
}
