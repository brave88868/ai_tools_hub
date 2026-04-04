# SPEC-FIX-04: PDF上传修复 + Resume质量提升 + 文档工具双区显示

**项目**: AI Tools Station (aitoolsstation.com)
**类型**: Bug修复 + 质量提升
**优先级**: 🔴 立即执行
**依赖**: SPEC-FIX-03 ✅

---

## 问题清单

| # | 问题 |
|---|------|
| 1 | PDF 上传仍然失败（DOCX 正常）|
| 2 | PPT 文件格式未支持 |
| 3 | Resume Optimizer 输出质量下降（prompt 被简化过度）|
| 4 | 其他文档修改类工具需要同样的双区显示（改了什么 + 下载优化文档）|

---

## Task 1：彻底修复 PDF 上传

### 1.1 诊断当前 PDF 失败原因

```bash
# 先在本地测试 pdf-parse/lib/pdf-parse 是否可用
node -e "
const { readFileSync } = require('fs');
const pdfParse = require('./node_modules/pdf-parse/lib/pdf-parse.js');
console.log('pdf-parse loaded OK');
"
```

如果报错，说明路径不对。继续：

```bash
# 找到 pdf-parse 的实际内部文件
find node_modules/pdf-parse -name "*.js" | head -20
ls node_modules/pdf-parse/lib/
```

### 1.2 修复方案：改用 pdf2json 或直接用正确路径

**方案A（优先尝试）**：确认正确的内部路径

```bash
# 检查 pdf-parse 包结构
cat node_modules/pdf-parse/package.json | grep main
```

如果 `main` 是 `index.js`，则改为：
```typescript
const pdfParse = require('pdf-parse');
// 但需要在 next.config 里配置 serverComponentsExternalPackages
```

**方案B（如果A失败）**：安装 `pdf2json` 替代：

```bash
npm install pdf2json
```

```typescript
if (fileName.endsWith('.pdf')) {
  const PDFParser = require('pdf2json');
  const pdfParser = new PDFParser();
  
  text = await new Promise((resolve, reject) => {
    pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
      const extractedText = pdfData.Pages
        .flatMap((page: any) => page.Texts)
        .map((t: any) => decodeURIComponent(t.R.map((r: any) => r.T).join('')))
        .join(' ');
      resolve(extractedText);
    });
    pdfParser.on('pdfParser_dataError', reject);
    pdfParser.parseBuffer(buffer);
  });
}
```

**方案C（最简单稳定）**：在 `next.config.ts` / `next.config.js` 添加：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  // ... 其他配置
};
```

然后 `extract-text/route.ts` 改回：
```typescript
const pdfParse = require('pdf-parse');
const data = await pdfParse(buffer);
text = data.text;
```

**推荐顺序**：先试方案C（最干净），失败再试A，最后试B。

### 1.3 添加 PPT/PPTX 支持

```bash
npm install pptx2json
# 或
npm install officeparser
```

推荐用 `officeparser`，支持 docx/xlsx/pptx/odt 等格式：

```bash
npm install officeparser
```

```typescript
import officeParser from 'officeparser';

// 在 extract-text route 里添加：
} else if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
  text = await new Promise((resolve, reject) => {
    officeParser.parseOfficeAsync(buffer, (data: string, err: Error) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
```

同时更新前端上传提示文字：
- 找到显示 "PDF, DOCX, TXT · or drag & drop" 的地方
- 改为 "PDF, DOCX, PPTX, TXT · or drag & drop"

---

## Task 2：恢复并提升 Resume Optimizer 质量

当前 prompt 被过度简化，失去了专业指导。
编辑 `prompts/jobseeker/resume_optimizer.txt`，替换为以下高质量版本：

```
You are an expert resume writer and ATS optimization specialist with 15+ years of experience helping candidates land interviews at top companies.

Your task is to deeply analyze the provided resume against the job description, then produce a fully optimized version.

Resume:
{resume}

Job Description:
{job_description}

---

Follow these optimization principles:
1. Integrate ATS keywords from the JD naturally throughout (especially in skills, summary, and bullet points)
2. Rewrite bullet points using strong action verbs + quantifiable achievements where possible
3. Tailor the professional summary to directly target this specific role
4. Add relevant skills/competencies mentioned in the JD that are implied by the candidate's experience
5. Remove or de-emphasize content irrelevant to this role
6. Keep all factual information accurate — never invent experience or credentials
7. Maintain original structure (sections: Summary, Experience, Education, Skills, Certifications, etc.)
8. Use clean Word-compatible formatting: ALL CAPS section headers, "Company | Title | Dates" format for jobs

---

Produce your response in EXACTLY this format (do not deviate):

## OPTIMIZATION SUMMARY

For each meaningful change, write one bullet:
- **[Section Name]** Changed: "[original]" → "[new]" | Reason: [specific reason tied to JD]
- **[Section Name]** Added: "[new content]" | Reason: [why this helps match the JD]
- **[Section Name]** Removed: "[removed]" | Reason: [why this was removed]

Aim for 8-15 specific, meaningful changes. Be precise about what changed and why.

## OPTIMIZED RESUME

[Write the complete optimized resume from top to bottom.
- Start with candidate's full name on the first line
- Contact info on second line
- Then all sections in ALL CAPS headers
- Each job: Company | Title | Start – End on one line, then bullet points
- End with Education, Certifications, Skills sections
- Do NOT include any commentary, notes, or suggestions in this section
- Output ONLY the complete resume content, ready to paste into Word]
```

---

## Task 3：识别并升级其他文档修改类工具为双区显示

### 3.1 找出所有文档修改类工具

文档修改类工具的特征：输入是一份文档/文本，输出是改进后的同类文档。

以下工具需要双区显示（改了什么 + 下载优化文档）：

```
需要双区显示的工具 slugs：
- resume-optimizer          ✅ 已完成
- cover-letter-optimizer    （如有）优化后的求职信
- linkedin-profile-optimizer 优化后的 LinkedIn 文案
- nda-analyzer              分析说明 + 下载注释版
- contract-analyzer         分析说明 + 下载注释版
- essay-improver            （如有）改了什么 + 下载改进版
- email-rewriter            （如有）改了什么 + 下载改写版
```

首先查数据库确认这些工具的 slug：

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');
const env = readFileSync('.env.local', 'utf-8');
const vars = {};
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)\$/);
  if (m) vars[m[1].trim()] = m[2].trim();
}
const sb = createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);
sb.from('tools').select('slug, name').then(({data}) => {
  const docTools = data.filter(t =>
    ['optimizer', 'analyzer', 'improver', 'rewriter', 'editor'].some(k => t.slug.includes(k))
  );
  console.table(docTools);
});
"
```

### 3.2 为每个文档工具更新 prompt

每个文档工具的 prompt 末尾都需要改为输出两个区块格式：

```
## ANALYSIS & CHANGES

[specific analysis / what was changed and why]

## OPTIMIZED DOCUMENT

[complete optimized document content, ready to download]
```

**各工具的区块名称**：

| 工具 | 区块1标题 | 区块2标题 | 下载文件名 |
|------|-----------|-----------|------------|
| resume-optimizer | OPTIMIZATION SUMMARY | OPTIMIZED RESUME | optimized-resume |
| cover-letter-optimizer | OPTIMIZATION SUMMARY | OPTIMIZED COVER LETTER | optimized-cover-letter |
| linkedin-profile-optimizer | OPTIMIZATION SUMMARY | OPTIMIZED PROFILE | optimized-linkedin-profile |
| nda-analyzer | NDA ANALYSIS | ANNOTATED NDA | nda-analysis |
| contract-analyzer | CONTRACT ANALYSIS | ANNOTATED CONTRACT | contract-analysis |

### 3.3 扩展前端双区显示逻辑

在 `app/tools/[slug]/page.tsx` 里，把 resume-optimizer 的特殊处理泛化：

```typescript
// 定义所有文档工具的配置
const DOC_TOOL_CONFIG: Record<string, {
  splitMarker: string;       // 用于分割两个区块的标记
  label1: string;            // 上方区块标签
  label2: string;            // 下方区块标签（折叠）
  downloadName: string;      // 下载文件名（不含.docx）
}> = {
  'resume-optimizer': {
    splitMarker: '## OPTIMIZED RESUME',
    label1: '✏️ What Changed & Why',
    label2: '📄 Optimized Resume Preview',
    downloadName: 'optimized-resume',
  },
  'cover-letter-optimizer': {
    splitMarker: '## OPTIMIZED COVER LETTER',
    label1: '✏️ What Changed & Why',
    label2: '📄 Optimized Cover Letter Preview',
    downloadName: 'optimized-cover-letter',
  },
  'linkedin-profile-optimizer': {
    splitMarker: '## OPTIMIZED PROFILE',
    label1: '✏️ What Changed & Why',
    label2: '📄 Optimized LinkedIn Profile',
    downloadName: 'optimized-linkedin-profile',
  },
  'nda-analyzer': {
    splitMarker: '## ANNOTATED NDA',
    label1: '📋 NDA Analysis',
    label2: '📄 Annotated Document',
    downloadName: 'nda-analysis',
  },
  'contract-analyzer': {
    splitMarker: '## ANNOTATED CONTRACT',
    label1: '📋 Contract Analysis',
    label2: '📄 Annotated Document',
    downloadName: 'contract-analysis',
  },
};

// 使用方式：
const docToolConfig = DOC_TOOL_CONFIG[slug];
const isDocTool = !!docToolConfig;

function parseDocToolOutput(output: string, splitMarker: string) {
  const idx = output.indexOf(splitMarker);
  if (idx === -1) return { summary: output, document: '' };
  return {
    summary: output.slice(0, idx).replace(/^## .+\n/, '').trim(),
    document: output.slice(idx + splitMarker.length).trim(),
  };
}
```

把现有的 `isResumeOptimizer` 判断改为 `isDocTool`，使用 `docToolConfig` 中的配置动态渲染标签和文件名。

---

## Task 4：本地完整测试

```bash
npm run dev
```

1. 上传 PDF 简历 → Resume Optimizer → 确认不报错
2. 上传 PPTX 文件 → 任意工具 → 确认文字提取成功
3. Resume Optimizer 生成 → 确认有 8-15 条具体改动说明
4. 下载 .docx → 确认是完整优化后的简历
5. 测试另一个文档工具（如 NDA Analyzer）→ 确认双区显示

---

## Task 5：type-check + 提交

```bash
npm run type-check
git add -A
git commit -m "fix: PDF upload + resume quality + doc tools dual view pattern"
git push origin main
```

---

## 断点恢复块

```
RECOVERY_CHECK:
1. 测试 PDF 上传是否成功 → 失败则执行 Task 1，按 C→A→B 顺序尝试
2. cat prompts/jobseeker/resume_optimizer.txt | grep "ATS optimization"
   → 没有则执行 Task 2
3. 检查 app/tools/[slug]/page.tsx 是否有 DOC_TOOL_CONFIG
   → 没有则执行 Task 3.3
4. 从第一个未完成的 Task 继续
```

---

## 验收标准

- [ ] 上传 PDF 文件成功解析
- [ ] 上传 PPTX 文件成功解析
- [ ] Resume Optimizer 输出 8-15 条具体改动说明
- [ ] Resume Optimizer 下载的 .docx 是高质量完整简历
- [ ] NDA Analyzer / Contract Analyzer 采用双区显示
- [ ] LinkedIn Profile Optimizer（如有）采用双区显示
- [ ] `npm run type-check` 0 错误
