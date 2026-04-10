import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
env.split("\n").forEach((line) => {
  const eq = line.indexOf("=");
  if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
});

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const updates = [
  { old: "Work & Life Templates", new: "Work & Life Toolkit" },
  { old: "Workflow Automation toolkit", new: "Workflow Automation Toolkit" },
];

for (const u of updates) {
  const { data, error } = await sb
    .from("toolkits")
    .update({ name: u.new })
    .eq("name", u.old)
    .select("slug, name");

  if (error) {
    console.error(`❌ Failed to update "${u.old}":`, error.message);
  } else if (data?.length === 0) {
    console.log(`⚠️  No toolkit found with name "${u.old}" — may already be updated`);
  } else {
    console.log(`✅ Updated "${u.old}" → "${u.new}" (slug: ${data[0]?.slug})`);
  }
}

console.log("Done.");
