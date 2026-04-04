// Layer 2 — Config Engine
// 从 tool_workflows 表加载多步骤流程，顺序执行，上一步输出传入下一步

import { openai, OPENAI_MODEL } from "@/lib/openai";
import { createServerClient } from "@/lib/supabase";

export async function runConfigTool(
  tool: { id: string; slug: string },
  inputs: Record<string, string>
): Promise<string> {
  const supabase = createServerClient();

  const { data: steps, error } = await supabase
    .from("tool_workflows")
    .select("*")
    .eq("tool_id", tool.id)
    .order("step_order", { ascending: true });

  if (error || !steps || steps.length === 0) {
    throw new Error(`No workflow steps found for tool: ${tool.slug}`);
  }

  let previousOutput = "";

  for (const step of steps) {
    const stepInputs: Record<string, string> = { ...inputs, previous_output: previousOutput };
    const prompt = (step.prompt_template as string).replace(
      /\{(\w+)\}/g,
      (_: string, key: string) => stepInputs[key] ?? `[${key} not provided]`
    );

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    previousOutput = response.choices[0]?.message?.content ?? "";
  }

  return previousOutput;
}
