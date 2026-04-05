/**
 * generate-seo-content.mjs
 * 为现有 72 个工具生成 SEO 字段并写入 tools 表
 * 运行：node scripts/generate-seo-content.mjs
 */
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function generateSeoForTool(tool) {
  const prompt = `You are an SEO expert. Generate SEO metadata for an AI tool. Return ONLY valid JSON with no markdown.

Tool name: ${tool.name}
Tool description: ${tool.description || tool.name}
Toolkit: ${tool.toolkit_slug}

Return this exact JSON structure:
{
  "seo_title": "under 60 chars, action-oriented, include 'AI'",
  "seo_description": "under 155 chars, include benefit and keyword",
  "seo_keywords": "comma-separated 8-10 keywords",
  "seo_how_it_works": "2 sentences explaining how the AI tool works",
  "seo_benefits": "3 key benefits, pipe-separated",
  "seo_example": "one concrete example of what this tool outputs",
  "seo_faq": [
    {"q": "question 1", "a": "answer 1"},
    {"q": "question 2", "a": "answer 2"},
    {"q": "question 3", "a": "answer 3"}
  ]
}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.6,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(res.choices[0].message.content)
}

async function main() {
  const { data: tools, error } = await supabase
    .from('tools')
    .select('id, slug, name, description, toolkit_slug, seo_title')
    .order('toolkit_slug')

  if (error) {
    console.error('Failed to fetch tools:', error)
    process.exit(1)
  }

  const needsSeo = tools.filter(t => !t.seo_title)
  console.log(`Total tools: ${tools.length} | Need SEO: ${needsSeo.length}`)

  let success = 0
  let failed = 0

  for (const tool of needsSeo) {
    try {
      process.stdout.write(`Generating SEO for [${tool.toolkit_slug}] ${tool.slug}...`)
      const seo = await generateSeoForTool(tool)

      const { error: updateError } = await supabase
        .from('tools')
        .update({
          seo_title: seo.seo_title,
          seo_description: seo.seo_description,
          seo_keywords: seo.seo_keywords,
          seo_how_it_works: seo.seo_how_it_works,
          seo_benefits: seo.seo_benefits,
          seo_example: seo.seo_example,
          seo_faq: seo.seo_faq,
          status: 'active',
        })
        .eq('id', tool.id)

      if (updateError) {
        console.log(` ✗ DB error: ${updateError.message}`)
        failed++
      } else {
        console.log(` ✓`)
        success++
      }

      // 限速：避免触发 OpenAI rate limit
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.log(` ✗ ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone! Success: ${success} | Failed: ${failed}`)
}

main()
