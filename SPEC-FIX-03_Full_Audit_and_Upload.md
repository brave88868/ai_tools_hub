# SPEC-FIX-03: 全量工具检查 + 文件上传修复 + Resume Optimizer 重设计

**项目**: AI Tools Station (aitoolsstation.com)
**类型**: Bug 修复 + UX 改进
**优先级**: 🔴 立即执行
**依赖**: SPEC-FIX-01 ✅, SPEC-FIX-02 ✅

---

## 问题清单

| # | 问题 | 优先级 |
|---|------|--------|
| 1 | 文件上传失败（PDF/DOCX 无法识别）| 🔴 |
| 2 | Resume Optimizer 显示优化后 CV，但用户想看改了什么、为什么改 | 🔴 |
| 3 | 下载的 .docx 应该是优化后的 CV 正文（当前已对，保持）| ✅ |
| 4 | 全部 72 个工具未经完整测试 | 🟡 |

---

## Task 1：修复文件上传（PDF / DOCX / TXT）

### 1.1 读取当前代码

```bash
cat app/api/tools/extract-text/route.ts
```

### 1.2 添加 Node.js runtime 声明

在文件**最顶部**（第1行）添加：

```typescript
export const runtime = 'nodejs';
export const maxDuration = 30;
```

### 1.3 修复文件读取逻辑

将文件处理改为以下结构（完整替换现有实现）：

```typescript
export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let text = '';

    if (fileName.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse/lib/pdf-parse');
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (fileName.endsWith('.docx')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from file. Please try pasting the text instead.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (err) {
    console.error('[extract-text]', err);
    return NextResponse.json(
      { error: 'Failed to read file. Please try pasting the text instead.' },
      { status: 500 }
    );
  }
}
```

**注意**：`pdf-parse` 在 Vercel 上需要用 `require('pdf-parse/lib/pdf-parse')` 而不是 `require('pdf-parse')`，这能避免 Vercel 构建时的测试文件加载问题。

### 1.4 本地验证

```bash
npm run dev
# 上传一个 PDF 文件到任意工具，确认不报错
```

---

## Task 2：Resume Optimizer 双区显示重设计

### 2.1 需求说明

**当前**：页面显示优化后的 CV 全文，下载同样的内容

**目标**：
```
┌──────────────────────────────────────────────┐
│ 页面显示区域（用户阅读）                      │
│                                              │
│ ✏️ 优化说明                                  │
│   • 原文：... → 改为：...（原因：更符合 JD） │
│   • 新增：... （原因：JD 要求此技能）        │
│   • 删除：... （原因：与岗位无关）           │
│                                              │
│ ────────────────────────────────────────     │
│                                              │
│ 📄 优化后完整简历预览（折叠，可展开）        │
│                                              │
└──────────────────────────────────────────────┘
│  Copy Text  │  ↓ Download Optimized CV.docx  │
└─────────────┴──────────────────────────────-─┘
```

### 2.2 修改 Resume Optimizer 的 prompt

编辑 `prompts/jobseeker/resume_optimizer.txt`，替换为以下内容：

```
You are an expert resume writer and career coach. Analyze the provided resume against the job description and produce a structured output.

Resume:
{resume}

Job Description:
{job_description}

Produce your response in the following exact format:

## OPTIMIZATION SUMMARY

List each change you made, in this format:
- **[Section]** Changed: "[original text]" → "[new text]" | Reason: [why this change helps match the JD]
- **[Section]** Added: "[new content]" | Reason: [why this was added]
- **[Section]** Removed: "[removed content]" | Reason: [why this was removed]

## OPTIMIZED RESUME

[Insert the complete optimized resume here, ready to be saved as a document. Use clean formatting with clear section headers.]
```

### 2.3 修改前端显示逻辑

找到 Resume Optimizer 的结果显示组件（可能是 `components/ToolResult.tsx` 或工具页面本身）。

修改结果解析逻辑，将 AI 输出按 `## OPTIMIZATION SUMMARY` 和 `## OPTIMIZED RESUME` 两个区块拆分：

```typescript
function parseResumeOptimizerOutput(output: string) {
  const summaryMatch = output.match(/## OPTIMIZATION SUMMARY\n([\s\S]*?)## OPTIMIZED RESUME/);
  const resumeMatch = output.match(/## OPTIMIZED RESUME\n([\s\S]*?)$/);
  
  return {
    summary: summaryMatch?.[1]?.trim() ?? '',
    optimizedResume: resumeMatch?.[1]?.trim() ?? output,
  };
}
```

**显示逻辑**：
- `summary` → 页面主要显示区（用户看改了什么）
- `optimizedResume` → 折叠区 + Download .docx 的内容

### 2.4 只对 resume-optimizer 工具生效

这个双区显示只针对 `resume-optimizer` 这个工具，其他工具的结果显示不变。
在工具结果组件里用 `tool.slug === 'resume-optimizer'` 做条件判断。

---

## Task 3：全量工具自动化测试

### 3.1 创建批量测试脚本

创建 `scripts/test-all-tools.mjs`，对每个工具做以下检查：

```javascript
// 对每个工具验证：
// 1. inputs_schema 不为 null 且 length > 0
// 2. prompt_file 存在（文件系统检查）
// 3. tool_type 是 'template'（不是 'config'）
// 4. is_active = true

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";

const env = readFileSync(".env.local", "utf-8");
const vars = {};
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}

const supabase = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const { data: tools } = await supabase
  .from('tools')
  .select('slug, name, tool_type, prompt_file, inputs_schema, is_active')
  .eq('is_active', true)
  .order('name');

let pass = 0, fail = 0;
const issues = [];

for (const tool of tools) {
  const problems = [];
  
  if (tool.tool_type !== 'template') {
    problems.push(`tool_type=${tool.tool_type} (should be template)`);
  }
  if (!tool.prompt_file) {
    problems.push('missing prompt_file');
  } else if (!existsSync(`prompts/${tool.prompt_file}`)) {
    problems.push(`prompt file not found: prompts/${tool.prompt_file}`);
  }
  if (!tool.inputs_schema || tool.inputs_schema.length === 0) {
    problems.push('empty inputs_schema');
  }
  
  if (problems.length > 0) {
    fail++;
    issues.push({ slug: tool.slug, problems });
    console.log(`❌ ${tool.slug}: ${problems.join(', ')}`);
  } else {
    pass++;
  }
}

console.log(`\n✅ Pass: ${pass} | ❌ Fail: ${fail}`);
if (issues.length > 0) {
  console.log('\nFailed tools:', JSON.stringify(issues, null, 2));
}
```

```bash
node scripts/test-all-tools.mjs
```

### 3.2 修复发现的问题

根据测试结果，修复所有失败的工具：
- `tool_type` 不是 template → 更新为 template
- `prompt_file` 缺失 → 补充路径或创建 prompt 文件
- `inputs_schema` 为空 → 根据 prompt 变量填充

---

## Task 4：type-check + 提交

```bash
npm run type-check
git add -A
git commit -m "fix: file upload nodejs runtime + resume optimizer dual view + full tool audit"
git push origin main
```

---

## 断点恢复块

```
RECOVERY_CHECK:
1. cat app/api/tools/extract-text/route.ts | head -2
   → 第1行是否有 export const runtime = 'nodejs'？没有则执行 Task 1
2. cat prompts/jobseeker/resume_optimizer.txt | grep "OPTIMIZATION SUMMARY"
   → 没有则执行 Task 2.2
3. node scripts/test-all-tools.mjs
   → 有失败项则执行 Task 3.2
4. 从第一个未完成的 Task 继续
```

---

## 验收标准

- [ ] 上传 PDF 文件不报错，文字正确提取
- [ ] 上传 DOCX 文件不报错，文字正确提取
- [ ] Resume Optimizer 页面显示：改了什么 + 为什么
- [ ] Resume Optimizer 下载：优化后完整 CV 的 .docx
- [ ] `node scripts/test-all-tools.mjs` 输出 0 个失败
- [ ] `npm run type-check` 0 错误
- [ ] 所有修复已推送到 main
