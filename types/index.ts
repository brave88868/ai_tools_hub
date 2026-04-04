// ============================================================
// Core Types — AI Tools Hub
// ============================================================

export type ToolType = "template" | "config" | "custom";
export type OutputFormat = "text" | "markdown" | "json";
export type SubscriptionStatus = "active" | "canceled" | "past_due";

export interface Toolkit {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  stripe_price_id: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface InputField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface Tool {
  id: string;
  toolkit_id: string;
  slug: string;
  name: string;
  description: string;
  tool_type: ToolType;
  prompt_file: string;
  inputs_schema: InputField[];
  output_format: OutputFormat;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  // Supabase join — present when selected with toolkits(slug, name)
  toolkits?: { slug: string; name: string } | null;
}

export interface ToolWorkflow {
  id: string;
  tool_id: string;
  step_order: number;
  step_name: string;
  prompt_template: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  plan: "free" | "pro";
  usage_count: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  toolkit_slug: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  current_period_end: string;
  created_at: string;
}

export interface ToolRunRequest {
  tool_slug: string;
  inputs: Record<string, string>;
  session_id?: string;
}

export interface ToolRunResponse {
  success: boolean;
  result?: string;
  error?: string;
  usage_count?: number;
}
