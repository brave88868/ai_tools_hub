import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// 手动读取 .env.local
const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const stripe = new Stripe(vars.STRIPE_SECRET_KEY);
const supabase = createClient(
  vars.NEXT_PUBLIC_SUPABASE_URL,
  vars.SUPABASE_SERVICE_ROLE_KEY
);

// lookup_key 不符合 _toolkit_ 格式的特殊映射
const SPECIAL_MAPPINGS = {
  all_toolkits_monthly: "bundle",
};

async function syncPrices() {
  console.log("🔄 开始同步 Stripe → Supabase 价格...\n");

  const prices = await stripe.prices.list({ active: true, limit: 100 });

  let synced = 0;
  let skipped = 0;

  for (const price of prices.data) {
    const lookupKey = price.lookup_key ?? "";
    const newPrice = Math.round((price.unit_amount ?? 0) / 100);

    // 特殊映射优先
    let slug = SPECIAL_MAPPINGS[lookupKey] ?? null;

    // 标准格式：exam_toolkit_monthly → exam
    if (!slug && lookupKey.includes("_toolkit_")) {
      slug = lookupKey.split("_toolkit_")[0];
    }

    if (!slug || newPrice <= 0) {
      console.log(`⏭  跳过 (无匹配 lookup_key): ${lookupKey || "(空)"}`);
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("toolkits")
      .update({ price_monthly: newPrice })
      .eq("slug", slug);

    if (error) {
      console.log(`❌ ${slug} → $${newPrice} 失败: ${error.message}`);
    } else {
      console.log(`✅ ${slug} → $${newPrice}`);
      synced++;
    }
  }

  console.log(`\n完成：${synced} 个同步成功，${skipped} 个跳过。`);
}

syncPrices().catch(console.error);
