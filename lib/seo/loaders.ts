import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "seo");

export interface UseCaseMeta {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
  recommendedTools: string[];
  steps: string[];
  faqs: { q: string; r: string }[];
}

export interface CompareTool {
  name: string;
  slug?: string; // internal slug if it's our own tool
  tagline: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  pricing: string;
}

export interface CompareMeta {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
  winner: string; // tool name or "depends"
  winnerReason: string;
  toolA: CompareTool;
  toolB: CompareTool;
  comparisonRows: { feature: string; a: string; b: string }[];
  faqs: { q: string; r: string }[];
  relatedSlugs: string[]; // other compare page slugs
}

export interface ProfessionMeta {
  slug: string;
  title: string;
  h1: string;
  metaDescription: string;
  intro: string;
  recommendedTools: string[];
  steps: string[];
  faqs: { q: string; r: string }[];
}

function readJson<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

// Use-case pages (/blog/[slug])
export function getUseCases(): UseCaseMeta[] {
  return readJson<UseCaseMeta>("use-cases.json");
}

export function getUseCase(slug: string): UseCaseMeta | undefined {
  return getUseCases().find((u) => u.slug === slug);
}

// Compare pages (/compare/[slug])
export function getCompares(): CompareMeta[] {
  return readJson<CompareMeta>("compares.json");
}

export function getCompare(slug: string): CompareMeta | undefined {
  return getCompares().find((c) => c.slug === slug);
}

// Profession pages (/ai-tools-for/[slug])
export function getProfessions(): ProfessionMeta[] {
  return readJson<ProfessionMeta>("professions.json");
}

export function getProfession(slug: string): ProfessionMeta | undefined {
  return getProfessions().find((p) => p.slug === slug);
}
