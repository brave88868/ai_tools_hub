/**
 * discover-tools.mjs
 * AI 为每个 toolkit 发现 3 个新工具 idea，写入 tool_ideas 表（status=pending）
 * 在 /operator/tools 审核 Approve 后才正式上线
 * 运行：node scripts/discover-tools.mjs
 */
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const TOOLKITS = [
  { slug: 'jobseeker', description: 'resume, cover letters, job interviews, career development, LinkedIn' },
  { slug: 'creator', description: 'YouTube content, video scripts, social media, channel growth' },
  { slug: 'marketing', description: 'ad copy, email marketing, landing pages, SEO content, social media' },
  { slug: 'business', description: 'business strategy, proposals, executive reports, team management' },
  { slug: 'legal', description: 'contract analysis, legal documents, compliance, privacy policies' },
  { slug: 'exam', description: 'IELTS, TOEFL, SAT, GMAT, GRE, professional certification exams' },
]

async function discoverToolsForToolkit(toolkit, existingSlugs) {
  const prompt = `You are a product manager at an AI SaaS company. Discover 3 new AI tool ideas for the "${toolkit.slug}" toolkit.
Focus on: ${toolkit.description}
Avoid slugs already in use: ${[...existingSlugs].slice(0, 15).join(', ')}

Each tool should solve a real, specific pain point. Return ONLY valid JSON:
{
  "tools": [
    {
      "tool_name": "Clear descriptive name",
      "tool_slug": "kebab-case-unique-slug",
      "description": "One clear sentence describing what it does",
      "prompt_template": "You are an AI assistant helping with {input}. The user needs: {goal}\\n\\nPlease provide detailed, actionable assistance.",
      "seo_title": "AI [Tool Name] — [Benefit] (max 60 chars)",
      "seo_description": "Concise description with main keyword (max 155 chars)"
    }
  ]
}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(res.choices[0].message.content)
  return parsed.tools ?? []
}

async function main() {
  // 加载已有 slugs（tools + tool_ideas）
  const [{ data: tools }, { data: ideas }] = await Promise.all([
    supabase.from('tools').select('slug'),
    supabase.from('tool_ideas').select('tool_slug'),
  ])

  const existingSlugs = new Set([
    ...(tools ?? []).map(t => t.slug),
    ...(ideas ?? []).map(i => i.tool_slug),
  ])

  console.log(`Existing slugs: ${existingSlugs.size}\n`)

  let total = 0

  for (const toolkit of TOOLKITS) {
    console.log(`Discovering tools for [${toolkit.slug}]...`)
    try {
      const newTools = await discoverToolsForToolkit(toolkit, existingSlugs)

      for (const tool of newTools) {
        if (!tool.tool_slug || existingSlugs.has(tool.tool_slug)) {
          console.log(`  ↷ Skip duplicate: ${tool.tool_slug}`)
          continue
        }

        const { error } = await supabase.from('tool_ideas').insert({
          tool_name: tool.tool_name,
          tool_slug: tool.tool_slug,
          description: tool.description,
          prompt_template: tool.prompt_template,
          seo_title: tool.seo_title,
          seo_description: tool.seo_description,
          toolkit_slug: toolkit.slug,
          status: 'pending',
        })

        if (error) {
          console.log(`  ✗ ${tool.tool_slug}: ${error.message}`)
        } else {
          console.log(`  ✓ ${tool.tool_slug}`)
          existingSlugs.add(tool.tool_slug)
          total++
        }
      }

      await new Promise(r => setTimeout(r, 800))
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
    }
  }

  console.log(`\nDone! Added ${total} new tool ideas to /operator/tools for review.`)
}

main()
