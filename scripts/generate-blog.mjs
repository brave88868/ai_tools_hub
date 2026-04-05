/**
 * generate-blog.mjs
 * 从 seo_keywords 取 pending 条目，AI 生成 800+ 字博客文章，写入 blog_posts
 * 运行：node scripts/generate-blog.mjs [count]
 * 示例：node scripts/generate-blog.mjs 5   （默认生成 5 篇）
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

const COUNT = parseInt(process.argv[2] || '5', 10)

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

async function generateArticle(keyword, toolkitSlug) {
  const prompt = `Write a high-quality, SEO-optimized blog article about: "${keyword}"

The article is for an AI productivity tools website (AI Tools Hub at aitoolsstation.com).
Toolkit context: ${toolkitSlug}

Requirements:
- Length: 800-1000 words
- Format: Markdown with ## subheadings, bullet points where appropriate
- Tone: Helpful, practical, professional
- Include actionable tips and examples
- Naturally mention AI tools where relevant
- Do NOT include a title (H1) in the content — just start with the first section

Return ONLY valid JSON with no markdown code blocks:
{
  "title": "compelling H1 title, max 70 chars",
  "excerpt": "2-sentence summary, max 160 chars",
  "seo_title": "SEO title, max 60 chars",
  "seo_description": "meta description, max 155 chars",
  "content": "full markdown article content, 800-1000 words"
}`

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(res.choices[0].message.content)
}

async function main() {
  // 取 pending 关键词
  const { data: keywords, error } = await supabase
    .from('seo_keywords')
    .select('id, keyword, toolkit_slug')
    .eq('status', 'pending')
    .limit(COUNT)

  if (error) {
    console.error('Failed to fetch keywords:', error)
    process.exit(1)
  }

  if (!keywords || keywords.length === 0) {
    console.log('No pending keywords found. Run seed-keywords.mjs first.')
    process.exit(0)
  }

  console.log(`Generating ${keywords.length} articles...\n`)

  let success = 0
  let failed = 0

  for (const kw of keywords) {
    process.stdout.write(`[${kw.toolkit_slug}] "${kw.keyword}"...`)

    try {
      const article = await generateArticle(kw.keyword, kw.toolkit_slug)
      const slug = slugify(article.title || kw.keyword)

      // 检查 slug 是否重复
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single()

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug

      const { error: insertError } = await supabase.from('blog_posts').insert({
        slug: finalSlug,
        title: article.title,
        excerpt: article.excerpt,
        content: article.content,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        keywords: kw.keyword,
        published: true,
        auto_generated: true,
      })

      if (insertError) {
        console.log(` ✗ Insert failed: ${insertError.message}`)
        failed++
        continue
      }

      // 标记关键词为已使用
      await supabase
        .from('seo_keywords')
        .update({ status: 'used' })
        .eq('id', kw.id)

      console.log(` ✓ /blog/${finalSlug}`)
      success++

      // 限速
      await new Promise(r => setTimeout(r, 1000))
    } catch (err) {
      console.log(` ✗ ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone! Success: ${success} | Failed: ${failed}`)
}

main()
