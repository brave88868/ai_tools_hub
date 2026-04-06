/**
 * Fill missing tools to reach 20 per toolkit:
 * - seo-content (+1): Pillar Page Content Planner
 * - hr-hiring (+2): Candidate Rejection Email Generator, Diversity & Inclusion Statement Generator
 * - customer-support (+1): NPS Follow-Up Email Generator
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

const TOOLS = [
  // ── seo-content ──────────────────────────────────────────────────────────
  {
    toolkitSlug: "seo-content",
    slug: "pillar-page-content-planner",
    name: "Pillar Page Content Planner",
    description: "Build a comprehensive pillar page strategy for any topic. Input your core keyword and niche to receive a full pillar page structure with main sections, supporting cluster topics, internal linking opportunities, and word-count targets that signal topical authority to search engines.",
    inputs_schema: [
      { name: "core_topic", label: "Core Topic / Pillar Keyword", type: "text", placeholder: "e.g., content marketing, remote work productivity", required: true },
      { name: "target_audience", label: "Target Audience", type: "text", placeholder: "e.g., B2B SaaS marketers, small business owners", required: true },
      { name: "current_domain", label: "Website / Domain (optional)", type: "text", placeholder: "e.g., example.com", required: false },
    ],
    prompt_template: `You are a senior SEO strategist specializing in topical authority and content architecture. You have helped 100+ brands dominate search with pillar-cluster content strategies.

Core Topic: {core_topic}
Target Audience: {target_audience}
Website: {current_domain}

STEP 1 — INTERNAL ANALYSIS (do not output):
1. Identify 6–8 primary subtopics that form the cluster
2. Map search intent (informational / commercial / navigational) for each
3. Estimate competitive difficulty and word-count norms for this niche
4. Plan internal linking flow from cluster pages back to pillar

## Pillar Page Content Planner: {core_topic}

### Page Overview
- **Target keyword:** [Primary keyword + 2-3 variations]
- **Recommended word count:** [Range, e.g., 3,500–5,000 words]
- **Search intent:** [Primary intent]
- **Audience stage:** [Awareness / Consideration / Decision]

### Pillar Page Structure

| # | Section Heading (H2) | Key Points to Cover | Word Count | Internal Link Target |
|---|----------------------|---------------------|------------|----------------------|
| 1 | Introduction — What is {core_topic}? | Definition, why it matters, who it's for | 300–400 | — |
| 2 | [Section 2] | [Key points] | [X words] | [Cluster page slug] |
| 3 | [Section 3] | [Key points] | [X words] | [Cluster page slug] |
| 4 | [Section 4] | [Key points] | [X words] | [Cluster page slug] |
| 5 | [Section 5] | [Key points] | [X words] | [Cluster page slug] |
| 6 | [Section 6] | [Key points] | [X words] | [Cluster page slug] |
| 7 | FAQ | [5 common questions] | 400–600 | — |
| 8 | Conclusion + CTA | Summary + next step | 200–300 | — |

### Cluster Topic Map (6–8 supporting pages)

| Cluster Topic | Target Keyword | Suggested URL Slug | Word Count | Priority |
|---------------|----------------|--------------------|------------|----------|
| [Topic 1] | [Keyword] | /blog/[slug] | [X] | High |
| [Topic 2] | [Keyword] | /blog/[slug] | [X] | High |
| [Topic 3] | [Keyword] | /blog/[slug] | [X] | Medium |
| [Topic 4] | [Keyword] | /blog/[slug] | [X] | Medium |
| [Topic 5] | [Keyword] | /blog/[slug] | [X] | Low |
| [Topic 6] | [Keyword] | /blog/[slug] | [X] | Low |

### SEO Optimization Checklist
- [ ] Include primary keyword in H1, first 100 words, and meta title
- [ ] Add schema markup: Article + FAQ + BreadcrumbList
- [ ] Internally link from every cluster page to this pillar (and back)
- [ ] Target featured snippet for the definition section (40–60 word paragraph)
- [ ] Include a comparison table or numbered list for "best of" intent queries

### Recommended Meta Tags
- **Title:** [60-char SEO title]
- **Description:** [155-char meta description]
- **H1:** [Exact H1 text]`,
    sort_order: 20,
  },

  // ── hr-hiring ──────────────────────────────────────────────────────────
  {
    toolkitSlug: "hr-hiring",
    slug: "candidate-rejection-email-generator",
    name: "Candidate Rejection Email Generator",
    description: "Craft respectful, professional rejection emails that preserve your employer brand. Input the candidate's name, role, and stage of the process to generate a warm rejection message with optional personalized feedback that leaves a positive impression.",
    inputs_schema: [
      { name: "candidate_name", label: "Candidate Name", type: "text", placeholder: "e.g., Sarah Johnson", required: true },
      { name: "role_title", label: "Role Applied For", type: "text", placeholder: "e.g., Senior Product Manager", required: true },
      { name: "interview_stage", label: "Interview Stage Reached", type: "select", options: ["Application Review", "Phone Screen", "First Interview", "Second Interview", "Final Round"], placeholder: "Select stage", required: true },
      { name: "feedback_notes", label: "Optional Feedback Notes", type: "textarea", placeholder: "e.g., Strong technical skills but lacked leadership experience for this level", required: false },
    ],
    prompt_template: `You are an experienced HR director and talent acquisition specialist known for building exceptional employer brands through respectful, human candidate communications.

Candidate: {candidate_name}
Role: {role_title}
Stage Reached: {interview_stage}
Feedback Notes: {feedback_notes}

STEP 1 — INTERNAL ANALYSIS (do not output):
1. Calibrate warmth level based on interview stage (deeper = warmer)
2. Determine whether specific feedback is appropriate to include
3. Plan how to preserve the relationship for future opportunities
4. Keep it concise — candidates value brevity and respect

## Candidate Rejection Email

**Subject:** Your Application for {role_title} at [Company Name]

---

Hi {candidate_name},

[Warm opening — thank them genuinely for their time at the {interview_stage} stage]

[Clear, kind rejection — 1-2 sentences, no vague language]

[If feedback_notes provided: one sentence of genuine, constructive feedback that helps them grow]

[Forward-looking close — encourage them to apply for future roles if appropriate]

[Sign-off with recruiter/HR manager name and title]

---

## Alternative Version (Briefer)

**Subject:** Re: {role_title} Application — {candidate_name}

[Ultra-concise version — 4-5 sentences max, same warmth, no feedback]

---

## Tone Notes
- ✅ Avoid: "We've decided to move forward with other candidates" (overused)
- ✅ Use: Specific acknowledgment of what stage they reached
- ✅ Timing: Send within 48 hours of the decision
- ✅ Personalization: Always use their first name`,
    sort_order: 19,
  },

  {
    toolkitSlug: "hr-hiring",
    slug: "diversity-inclusion-statement-generator",
    name: "Diversity & Inclusion Statement Generator",
    description: "Create authentic, compelling diversity and inclusion statements for job postings, company websites, and HR policies. Input your company's values and DEI commitments to generate a statement that attracts diverse talent and reflects genuine organizational culture.",
    inputs_schema: [
      { name: "company_name", label: "Company Name", type: "text", placeholder: "e.g., Acme Corp", required: true },
      { name: "industry", label: "Industry / Sector", type: "text", placeholder: "e.g., technology, healthcare, finance", required: true },
      { name: "dei_commitments", label: "Specific DEI Commitments or Programs", type: "textarea", placeholder: "e.g., pay equity audits, ERGs, unconscious bias training, partnership with HBCUs", required: false },
      { name: "statement_type", label: "Statement Type", type: "select", options: ["Job Posting Footer", "Careers Page", "About Us Page", "HR Policy Document", "Investor/ESG Report"], placeholder: "Select type", required: true },
    ],
    prompt_template: `You are a DEI consultant and HR communications specialist who has helped Fortune 500 companies and startups build authentic, legally sound, and talent-attracting diversity programs.

Company: {company_name}
Industry: {industry}
DEI Commitments/Programs: {dei_commitments}
Statement Type: {statement_type}

STEP 1 — INTERNAL ANALYSIS (do not output):
1. Calibrate tone and length for the {statement_type} context
2. Identify which dimensions of diversity are most relevant to {industry}
3. Distinguish between aspirational language and verifiable commitments
4. Ensure EEO compliance language is included where appropriate

## Diversity & Inclusion Statement

### Primary Statement
[2-3 paragraph statement tailored for {statement_type}. Tone: genuine, specific, and forward-looking. Avoid buzzword-heavy boilerplate.]

### EEO Compliance Statement (required for Job Postings)
{company_name} is an Equal Opportunity Employer. We do not discriminate on the basis of race, color, religion, sex, national origin, age, disability, veteran status, sexual orientation, gender identity, or any other characteristic protected by applicable law.

### Short Version (50 words — for job posting footers)
[Concise version of the primary statement]

### Key Messaging Pillars
1. **Belonging:** [One sentence about psychological safety and inclusion]
2. **Equity:** [One sentence about fair processes and removing barriers]
3. **Representation:** [One sentence about goals or current progress]
4. **Action:** [One sentence about specific programs or accountability measures]

### What to Avoid
- ❌ "We hire the best person regardless of background" (implies diversity = lowering the bar)
- ❌ Generic "diversity is our strength" without specifics
- ❌ Listing protected classes only — focus on belonging and equity`,
    sort_order: 20,
  },

  // ── customer-support ─────────────────────────────────────────────────────
  {
    toolkitSlug: "customer-support",
    slug: "nps-followup-email-generator",
    name: "NPS Follow-Up Email Generator",
    description: "Turn NPS survey responses into relationship-building conversations. Input the customer's score and any verbatim feedback to generate a personalized follow-up email that acknowledges their experience, addresses concerns for detractors, and amplifies advocacy for promoters.",
    inputs_schema: [
      { name: "customer_name", label: "Customer Name", type: "text", placeholder: "e.g., Alex Chen", required: true },
      { name: "nps_score", label: "NPS Score (0–10)", type: "text", placeholder: "e.g., 3 or 9", required: true },
      { name: "verbatim_feedback", label: "Verbatim Feedback (optional)", type: "textarea", placeholder: "e.g., 'The onboarding was confusing and support took 3 days to respond'", required: false },
      { name: "product_name", label: "Product / Service Name", type: "text", placeholder: "e.g., Acme Pro Plan", required: false },
    ],
    prompt_template: `You are a customer success expert who has managed NPS programs at high-growth SaaS companies, turning detractor churn into retention and promoters into referral engines.

Customer: {customer_name}
NPS Score: {nps_score}
Verbatim Feedback: {verbatim_feedback}
Product/Service: {product_name}

STEP 1 — INTERNAL ANALYSIS (do not output):
1. Classify: score 0-6 = Detractor, 7-8 = Passive, 9-10 = Promoter
2. Identify the primary emotion: frustrated / neutral / delighted
3. If feedback provided, extract the core complaint or praise
4. Plan the appropriate response strategy:
   - Detractor: empathize → acknowledge specific issue → offer concrete next step → retention goal
   - Passive: thank → understand → share what's coming → upsell opportunity
   - Promoter: express gratitude → validate their experience → ask for referral/review

## NPS Follow-Up Email

**Subject:** [Tailored subject based on score and feedback tone]

---

Hi {customer_name},

[Opening that immediately references their score in a human, non-robotic way]

[Core response block — tailored to Detractor/Passive/Promoter segmentation]

[Specific action step or ask — one clear CTA only]

[Warm, personal closing]

[Sender name, title, direct contact]

---

## Response Strategy Notes

**Segment:** [Detractor / Passive / Promoter]
**Priority:** [High (Detractor) / Medium (Passive) / Low (Promoter)]
**Recommended response time:** [Detractor: within 24h / Others: within 48h]
**Escalation needed?** [Yes/No — Yes if score ≤4 or feedback mentions churn risk]

## Follow-Up Action Checklist
- [ ] Log response in CRM with NPS score tag
- [ ] If Detractor: schedule a follow-up call within 72 hours
- [ ] If Promoter: trigger referral or review request sequence after 3 days
- [ ] Track whether score improves at next NPS cycle`,
    sort_order: 20,
  },
];

async function run() {
  let added = 0;
  let failed = 0;

  // Get all toolkit IDs
  const { data: toolkits } = await supabase
    .from("toolkits")
    .select("id, slug")
    .in("slug", ["seo-content", "hr-hiring", "customer-support"]);

  const tkMap = Object.fromEntries(toolkits.map((t) => [t.slug, t.id]));
  console.log("Toolkit IDs:", tkMap);

  for (const tool of TOOLS) {
    const toolkit_id = tkMap[tool.toolkitSlug];
    if (!toolkit_id) {
      console.error(`❌ Toolkit not found: ${tool.toolkitSlug}`);
      failed++;
      continue;
    }

    const { error } = await supabase.from("tools").insert({
      toolkit_id,
      slug: tool.slug,
      name: tool.name,
      description: tool.description,
      tool_type: "template",
      inputs_schema: tool.inputs_schema,
      prompt_template: tool.prompt_template,
      output_format: "markdown",
      auto_generated: true,
      is_active: true,
      sort_order: tool.sort_order,
    });

    if (error) {
      console.error(`❌ ${tool.name}: ${error.message}`);
      failed++;
    } else {
      console.log(`✅ [${tool.toolkitSlug}] ${tool.name} (${tool.slug})`);
      added++;
    }
  }

  console.log(`\n📊 Done: ${added} added, ${failed} failed`);

  // Final count check
  for (const slug of ["seo-content", "hr-hiring", "customer-support"]) {
    const { count } = await supabase
      .from("tools")
      .select("id", { count: "exact", head: true })
      .eq("toolkit_id", tkMap[slug]);
    console.log(`  ${slug}: ${count} tools`);
  }
}

run().catch(console.error);
