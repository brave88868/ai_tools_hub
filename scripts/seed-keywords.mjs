/**
 * seed-keywords.mjs
 * 为每个 toolkit AI 生成 20 个博客关键词，写入 seo_keywords 表
 * 运行：node scripts/seed-keywords.mjs
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
  {
    slug: 'jobseeker',
    description: 'resume writing, cover letters, job interview preparation, LinkedIn optimization, career advice',
  },
  {
    slug: 'creator',
    description: 'YouTube titles, video scripts, channel descriptions, thumbnails, content ideas for creators',
  },
  {
    slug: 'marketing',
    description: 'ad copy, social media posts, email campaigns, landing pages, marketing strategy',
  },
  {
    slug: 'business',
    description: 'business plans, executive summaries, meeting agendas, project proposals, business writing',
  },
  {
    slug: 'legal',
    description: 'contract analysis, NDA review, privacy policies, terms of service, legal document drafting',
  },
  {
    slug: 'exam',
    description: 'IELTS, TOEFL, SAT, GMAT, GRE exam preparation, study plans, practice questions',
  },
]

async function generateKeywordsForToolkit(toolkit) {
  const prompt = `You are an SEO expert. Generate 20 blog keyword ideas for an AI tools website focused on ${toolkit.description}.

Requirements:
- Mix of informational ("how to", "guide", "tips"), comparison ("best", "vs", "alternatives"), and use-case keywords
- Each keyword should be 3-8 words long
- Focus on keywords people search when looking for AI tools
- Include the word "AI" in at least 8 keywords

Return ONLY a JSON array of 20 strings, no other text:
["keyword 1", "keyword 2", ...]`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    response_format: { type: 'json_object' },
  })

  // 解析返回，兼容直接数组和包装对象两种格式
  const parsed = JSON.parse(res.choices[0].message.content)
  return Array.isArray(parsed) ? parsed : (parsed.keywords || parsed.data || Object.values(parsed)[0])
}

async function main() {
  let total = 0
  let skipped = 0

  for (const toolkit of TOOLKITS) {
    console.log(`\nGenerating keywords for [${toolkit.slug}]...`)
    try {
      const keywords = await generateKeywordsForToolkit(toolkit)
      console.log(`  Got ${keywords.length} keywords`)

      for (const keyword of keywords) {
        if (!keyword || typeof keyword !== 'string') continue

        const { error } = await supabase.from('seo_keywords').insert({
          keyword: keyword.toLowerCase().trim(),
          category: 'blog',
          toolkit_slug: toolkit.slug,
          status: 'pending',
        })

        if (error?.code === '23505') {
          // unique violation — already exists
          skipped++
        } else if (error) {
          console.error(`  ✗ "${keyword}": ${error.message}`)
        } else {
          total++
        }
      }

      await new Promise(r => setTimeout(r, 800))
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    }
  }

  console.log(`\nDone! Inserted: ${total} | Skipped (duplicate): ${skipped}`)
}

main()
