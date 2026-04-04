// Layer 1 — Template Engine
// 读取 /prompts/[toolkit]/[tool].txt，替换 {variable} 占位符，调用 OpenAI

import fs from "fs/promises";
import path from "path";
import { openai, OPENAI_MODEL } from "@/lib/openai";

export async function runTemplateTool(
  tool: { slug: string; prompt_file: string },
  inputs: Record<string, string>
): Promise<string> {
  if (!tool.prompt_file) {
    throw new Error(`Tool ${tool.slug} has no prompt_file configured`);
  }

  const promptPath = path.join(process.cwd(), "prompts", tool.prompt_file);

  let promptTemplate: string;
  try {
    promptTemplate = await fs.readFile(promptPath, "utf-8");
  } catch {
    throw new Error(`Prompt file not found: ${promptPath}`);
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
