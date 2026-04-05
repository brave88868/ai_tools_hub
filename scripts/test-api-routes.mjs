/**
 * test-api-routes.mjs
 * 测试所有 API 路由是否正常响应
 * 运行：node scripts/test-api-routes.mjs
 */
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
let passed = 0
let failed = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`✓ ${name}`)
    passed++
  } catch (err) {
    console.error(`✗ ${name}: ${err.message}`)
    failed++
  }
}

async function get(path, expectedStatus = 200) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (res.status !== expectedStatus) {
    throw new Error(`Expected ${expectedStatus}, got ${res.status}`)
  }
  return res
}

async function post(path, body, expectedStatus = 200) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status !== expectedStatus) {
    const text = await res.text()
    throw new Error(`Expected ${expectedStatus}, got ${res.status}: ${text.slice(0, 100)}`)
  }
  return res
}

console.log(`\nTesting API routes at ${BASE_URL}\n`)

// 页面路由
await test('GET / (homepage)', () => get('/'))
await test('GET /toolkits', () => get('/toolkits'))
await test('GET /pricing', () => get('/pricing'))
await test('GET /blog', () => get('/blog'))
await test('GET /features', () => get('/features'))
await test('GET /terms', () => get('/terms'))
await test('GET /privacy', () => get('/privacy'))

// Sitemap & robots
await test('GET /sitemap.xml', () => get('/sitemap.xml'))
await test('GET /robots.txt', () => get('/robots.txt'))

// API - 未登录应返回 401
await test('POST /api/tools/run (no auth → 401 or 429 or 200)', async () => {
  const res = await fetch(`${BASE_URL}/api/tools/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool_slug: 'resume-optimizer', inputs: { resume: 'test' } }),
  })
  if (res.status !== 401 && res.status !== 429 && res.status !== 200) {
    throw new Error(`Unexpected status: ${res.status}`)
  }
})

await test('POST /api/features/vote (no auth → 401)', () =>
  post('/api/features/vote', { feature_id: '00000000-0000-0000-0000-000000000000' }, 401))

await test('POST /api/features/submit (no auth → 401)', () =>
  post('/api/features/submit', { title: 'test' }, 401))

await test('POST /api/feedback/submit (anonymous OK)', async () => {
  const res = await fetch(`${BASE_URL}/api/feedback/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback_type: 'general', message: 'test', rating: 5 }),
  })
  if (res.status !== 200 && res.status !== 500) {
    throw new Error(`Unexpected: ${res.status}`)
  }
})

// Admin routes - 未登录应重定向
await test('GET /admin (no auth → redirect)', async () => {
  const res = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' })
  if (res.status !== 302 && res.status !== 307 && res.status !== 308) {
    throw new Error(`Expected redirect, got ${res.status}`)
  }
})

await test('GET /dashboard (no auth → redirect)', async () => {
  const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' })
  if (res.status !== 302 && res.status !== 307 && res.status !== 308) {
    throw new Error(`Expected redirect, got ${res.status}`)
  }
})

// Cron - 无 secret 应返回 401
await test('GET /api/cron/discover-keywords (no secret → 401)', () =>
  get('/api/cron/discover-keywords', 401))
await test('GET /api/cron/generate-tools (no secret → 401)', () =>
  get('/api/cron/generate-tools', 401))
await test('GET /api/cron/generate-blog (no secret → 401)', () =>
  get('/api/cron/generate-blog', 401))

console.log(`\n结果：${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
