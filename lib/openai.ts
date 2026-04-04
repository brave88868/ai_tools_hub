import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model for tool execution
export const OPENAI_MODEL = "gpt-4o-mini";

// Cheap model for bulk SEO generation
export const OPENAI_SEO_MODEL = "gpt-4o-mini";
