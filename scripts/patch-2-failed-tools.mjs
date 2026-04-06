/**
 * Patches the 2 tools that failed in generate-6-new-toolkits.mjs
 * - instagram-caption-generator  (social-media toolkit)
 * - meeting-agenda-generator-prod (productivity toolkit)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // 1. Check what slugs already exist
  const { data: existing } = await supabase
    .from("tools")
    .select("slug, toolkit_id")
    .in("slug", ["instagram-caption-generator", "meeting-agenda-generator-prod",
                  "instagram-caption-gen", "meeting-agenda-generator"]);

  console.log("Existing conflicting slugs:", existing?.map(r => r.slug));

  // 2. Get toolkit IDs
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("id, slug")
    .in("slug", ["social-media", "productivity"]);

  const tkMap = Object.fromEntries(toolkits.map(t => [t.slug, t.id]));
  console.log("Toolkit IDs:", tkMap);

  // 3. Fix instagram-caption-generator — try with a unique slug
  const igSlug = "instagram-caption-generator-sm"; // sm = social-media
  const { error: igErr } = await supabase.from("tools").upsert({
    toolkit_id: tkMap["social-media"],
    slug: igSlug,
    name: "Instagram Caption Generator",
    description: "Generate engaging, platform-optimized Instagram captions for any photo or reel. Input your content context, target audience, and tone to receive scroll-stopping captions complete with relevant hashtags, emojis, and a compelling call-to-action.",
    tool_type: "template",
    inputs_schema: [
      { name: "content_description", label: "Content Description", type: "textarea", placeholder: "Describe your photo or video (e.g., 'Sunset beach photo from our Hawaii vacation, relaxed and happy vibe')", required: true },
      { name: "tone", label: "Caption Tone", type: "select", options: ["Casual & Fun", "Professional", "Inspirational", "Promotional", "Educational"], placeholder: "Select tone", required: true },
      { name: "target_audience", label: "Target Audience", type: "text", placeholder: "e.g., travel enthusiasts aged 25-35", required: false },
    ],
    prompt_template: `You are an expert Instagram content strategist with 10+ years of experience growing accounts to 100K+ followers across travel, lifestyle, business, and creator niches.

Content Description: {content_description}
Caption Tone: {tone}
Target Audience: {target_audience}

STEP 1 — INTERNAL ANALYSIS (do not output):
1. Identify the core emotion or message this content conveys
2. Determine the best hook style for this tone and audience
3. Plan hashtag strategy: 5 niche + 5 mid-size + 3 broad = 13 total
4. Consider engagement triggers (question, CTA, relatable statement)

## Instagram Caption

**Hook (first line — must stop the scroll):**
[Attention-grabbing opening line]

**Caption Body:**
[2-3 sentences that tell the story, evoke emotion, or deliver value. Match the {tone} perfectly.]

**Call-to-Action:**
[One clear, conversational CTA — invite comments, saves, or shares]

## Hashtags
[13 relevant hashtags grouped: niche | mid-size | broad]

## Alt Version (A/B test option)
[A shorter, punchier alternative caption]

**Pro Tip:** Post within the first hour of your audience's peak activity time for maximum reach.`,
    output_format: "markdown",
    seo_title: "Instagram Caption Generator — AI Captions with Hashtags",
    seo_description: "Generate scroll-stopping Instagram captions with hashtags and CTAs in seconds. Perfect for creators, brands, and social media managers.",
    auto_generated: true,
    is_active: true,
    sort_order: 5,
  }, { onConflict: "slug" });

  if (igErr) {
    console.error("❌ Instagram Caption Generator failed:", igErr.message);
  } else {
    console.log(`✅ Instagram Caption Generator inserted as slug: ${igSlug}`);
  }

  // 4. Fix meeting-agenda-generator-prod
  // The slug 'meeting-agenda-generator-prod' might conflict if it somehow already exists
  // Or the toolkit_id might be wrong. Let's use a cleaner slug.
  const maSlug = "productivity-meeting-agenda-generator";
  const { error: maErr } = await supabase.from("tools").upsert({
    toolkit_id: tkMap["productivity"],
    slug: maSlug,
    name: "Meeting Agenda Generator",
    description: "Create structured, time-boxed meeting agendas that keep discussions focused and productive. Input your meeting type, objectives, attendees, and duration to generate a professional agenda with clear sections, time allocations, and preparation notes for each participant.",
    tool_type: "template",
    inputs_schema: [
      { name: "meeting_objective", label: "Meeting Objective", type: "textarea", placeholder: "e.g., Q3 planning session to align product roadmap priorities and assign ownership for key initiatives", required: true },
      { name: "meeting_type", label: "Meeting Type", type: "select", options: ["Team Standup", "Strategy Session", "Project Kickoff", "Retrospective", "One-on-One", "Client Meeting", "Board Meeting"], placeholder: "Select meeting type", required: true },
      { name: "duration_minutes", label: "Duration (minutes)", type: "text", placeholder: "e.g., 60", required: true },
      { name: "attendees", label: "Attendees & Roles", type: "text", placeholder: "e.g., Sarah (PM), John (Dev Lead), Maria (Design), 2 stakeholders", required: false },
    ],
    prompt_template: `You are an expert facilitator and productivity consultant with 15+ years of experience running high-impact meetings at Fortune 500 companies and fast-growing startups.

Meeting Objective: {meeting_objective}
Meeting Type: {meeting_type}
Duration: {duration_minutes} minutes
Attendees: {attendees}

STEP 1 — INTERNAL ANALYSIS (do not output):
1. Calculate time allocation per section based on {duration_minutes}
2. Identify the primary decision or outcome needed
3. Determine pre-work that should be sent in advance
4. Plan for buffer time and action items

## Meeting Agenda: {meeting_type}

**Meeting Details**
- Duration: {duration_minutes} minutes
- Objective: [One clear sentence]
- Expected Output: [Specific deliverable or decision]

## Agenda Items

| Time | Item | Owner | Format |
|------|------|-------|--------|
| [X min] | Welcome & Context Setting | Facilitator | Brief |
| [X min] | [Main agenda item 1] | [Owner] | Discussion |
| [X min] | [Main agenda item 2] | [Owner] | Decision |
| [X min] | [Main agenda item 3] | [Owner] | Workshop |
| [X min] | Action Items & Next Steps | All | Review |
| [X min] | Wrap-up | Facilitator | Summary |

## Pre-Meeting Preparation
- **Organizer:** [Specific prep tasks]
- **All attendees:** [What to review or prepare]

## Success Criteria
[How will you know this meeting was successful?]

## Post-Meeting Actions
[Template for follow-up email with action items]`,
    output_format: "markdown",
    seo_title: "Meeting Agenda Generator — Structured AI Agendas",
    seo_description: "Generate time-boxed, structured meeting agendas with clear objectives and action items. Keep every meeting focused and productive.",
    auto_generated: true,
    is_active: true,
    sort_order: 9,
  }, { onConflict: "slug" });

  if (maErr) {
    console.error("❌ Meeting Agenda Generator failed:", maErr.message);
  } else {
    console.log(`✅ Meeting Agenda Generator inserted as slug: ${maSlug}`);
  }

  // 5. Final count check
  const { count } = await supabase
    .from("tools")
    .select("id", { count: "exact", head: true })
    .in("toolkit_id", Object.values(tkMap));

  console.log(`\n📊 Total tools in social-media + productivity toolkits: ${count}`);
}

run().catch(console.error);
