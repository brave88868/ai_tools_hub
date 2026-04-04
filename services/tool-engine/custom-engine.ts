// Layer 3 — Custom Engine
// Registry 模式：每个自定义工具注册 handler，按 slug 查找执行

import type { Tool } from "@/types";

type CustomHandler = (tool: Tool, inputs: Record<string, string>) => Promise<string>;

const registry = new Map<string, CustomHandler>();

export function registerCustomTool(slug: string, handler: CustomHandler) {
  registry.set(slug, handler);
}

export async function runCustomTool(
  tool: Tool,
  inputs: Record<string, string>
): Promise<string> {
  const handler = registry.get(tool.slug);
  if (!handler) {
    return `Custom tool "${tool.slug}" is not yet implemented.`;
  }
  return handler(tool, inputs);
}
