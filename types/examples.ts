export interface GeneratedExample {
  id: string;
  tool_slug: string;
  title: string;
  content: string;
  slug: string;
  keywords: string[];
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateExamplePayload {
  tool_slug: string;
  raw_output: string;
  input_context: string;
}

export interface CreateExampleResponse {
  success: boolean;
  data?: {
    slug: string;
    url: string;
  };
  error?: string;
}
