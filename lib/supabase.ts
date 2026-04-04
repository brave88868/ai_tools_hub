import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// 浏览器客户端（"use client" 组件用）
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 管理员客户端（service role key — 绕过 RLS，server only）
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
