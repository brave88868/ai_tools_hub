// ToolkitCard component — placeholder for Step 3 (UI)
import type { Toolkit } from "@/types";

export default function ToolkitCard({ toolkit }: { toolkit: Toolkit }) {
  return <div>{toolkit.name}</div>;
}
