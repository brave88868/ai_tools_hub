/**
 * generate-use-cases.mjs
 * 为 72 个工具 × 10 个使用场景生成 SEO 页面内容（720 条）
 * 运行：node scripts/generate-use-cases.mjs
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

const USE_CASES = {
  jobseeker: ['data-analyst','software-engineer','product-manager','marketing-manager','nurse','teacher','graphic-designer','sales-manager','accountant','student'],
  creator: ['gaming','tech','vlog','education','cooking','fitness','travel','podcast','music','business'],
  marketing: ['ecommerce','saas','real-estate','healthcare','restaurant','agency','startup','nonprofit','b2b','local-business'],
  business: ['startup','enterprise','consultant','freelancer','small-business','remote-team','agency','retail','finance','hr'],
  legal: ['contract','nda','employment','privacy-policy','terms-of-service','lease','partnership','ip','compliance','dispute'],
  exam: ['ielts','toefl','sat','gmat','gre','bar-exam','medical','coding-interview','certification','college-entrance'],
}

async function generateUseCasePage(tool, useCase) {
  const prompt = `Write SEO content for an AI tool use-case page. Return ONLY valid JSON with no markdown.
Tool: ${tool.name}, Use case: ${useCase.replace(/-/g, ' ')}
Return: {"title":"H1 title (max 70 chars)","seo_title":"max 60 chars","seo_description":"max 155 chars","content":"3 SEO-optimized paragraphs totalling 200+ words"}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  })
  return JSON.parse(res.choices[0].message.content)
}

async function main() {
  const { data: tools, error } = await supabase
    .from('tools')
    .select('slug, name, toolkit_slug')
    .eq('status', 'active')

  if (error) {
    console.error('Failed to fetch tools:', error)
    process.exit(1)
  }

  console.log(`Tools loaded: ${tools.length}`)

  let generated = 0
  let skipped = 0
  let failed = 0

  for (const tool of tools) {
    const useCases = USE_CASES[tool.toolkit_slug] || []
    for (const useCase of useCases) {
      const slug = `${tool.slug}-for-${useCase}`

      const { data: existing } = await supabase
        .from('tool_use_cases')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        skipped++
        continue
      }

      try {
        process.stdout.write(`Generating: ${slug}...`)
        const content = await generateUseCasePage(tool, useCase)
        await supabase.from('tool_use_cases').insert({
          tool_slug: tool.slug,
          use_case: useCase,
          slug,
          ...content,
        })
        console.log(' ✓')
        generated++
        await new Promise(r => setTimeout(r, 600))
      } catch (err) {
        console.log(` ✗ ${err.message}`)
        failed++
      }
    }
  }

  console.log(`\nDone! Generated: ${generated} | Skipped: ${skipped} | Failed: ${failed}`)
}

main()
