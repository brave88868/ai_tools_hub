export interface AiPrompt {
  id: string;
  tool_slug: string | null;
  category: string;
  title: string;
  slug: string;
  prompt_text: string;
  example_output: string | null;
  use_case: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  keywords: string[];
  is_active: boolean;
  view_count: number;
  copy_count: number;
  created_at: string;
}

export interface GeneratePromptsPayload {
  category?: string;
  tool_slug?: string;
  count?: number;
}
