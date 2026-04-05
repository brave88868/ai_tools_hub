interface ToolLink {
  slug: string;
  name: string;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Injects internal links into markdown content.
 * Each tool name is linked to /tools/[slug] on first occurrence only.
 * Skips occurrences already inside a markdown link or URL.
 */
export function injectInternalLinks(content: string, tools: ToolLink[]): string {
  let result = content;

  // Sort longest name first to match greedily (e.g. "Resume Optimizer" before "Resume")
  const sorted = [...tools].sort((a, b) => b.name.length - a.name.length);

  for (const tool of sorted) {
    const escaped = escapeRegex(tool.name);
    // Match the tool name NOT already inside [...] or preceded by /tools/
    const regex = new RegExp(
      `(?<!\\[|/tools/)\\b(${escaped})\\b(?![^[]*\\])`,
      "i"
    );
    result = result.replace(regex, `[$1](/tools/${tool.slug})`);
  }

  return result;
}
