import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Default model for tool execution
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Cheap model for bulk SEO generation
export const CLAUDE_SEO_MODEL = "claude-haiku-4-5-20251001";
