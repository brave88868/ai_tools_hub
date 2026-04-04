// ToolCard component — placeholder for Step 3 (UI)
import type { Tool } from "@/types";

export default function ToolCard({ tool }: { tool: Tool }) {
  return <div>{tool.name}</div>;
}
