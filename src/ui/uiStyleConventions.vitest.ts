import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * 全仓库前端页面风格与交互硬约束守卫（Phase 0 建立，Phase 5 升级为全库强制门槛）。
 *
 * 规范来源：
 * - docs/前端页面风格规范与设计指南.md
 * - docs/前端交互与反馈规范.md
 *
 * 覆盖范围：自动递归扫描 `src/features/`、`src/pages/`、`src/ui/` 全量 `.tsx`（以及日期格式扫描 `src/utils/` `.ts`），
 * 后续新增业务模块或页面无需手工登记即可自动受守卫保护。
 */

const ALLOWED_MODAL_WIDTHS = new Set(['520', '720', '960'])

/** 极少数特殊宽排产/图纸预览弹窗白名单，必须在此注明业务原因 */
const MODAL_WIDTH_EXCEPTIONS: Record<string, string> = {
  'src/features/syney/SafePartSetting/SafePartDrawingPreviewModal.tsx':
    '安全件图纸预览弹窗使用 80vw 自适应展示 PDF 与图纸大图，避免图纸细节被截断',
}

/** 全库强制覆盖根路径 */
const GUARDED_TSX_ROOTS = ['src/features', 'src/pages', 'src/ui'] as const
const DATE_FORMAT_GUARDED_ROOTS = [
  'src/features',
  'src/pages',
  'src/ui',
  'src/utils',
] as const

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

function walkSourceFiles(
  dirRelativePath: string,
  extensions: readonly string[],
): string[] {
  const fullDir = path.resolve(process.cwd(), dirRelativePath)
  if (!existsSync(fullDir)) {
    return []
  }

  const results: string[] = []
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const childRel = path.join(dirRelativePath, entry.name).replaceAll('\\', '/')
    if (entry.isDirectory()) {
      results.push(...walkSourceFiles(childRel, extensions))
    }
    else if (
      extensions.some(ext => entry.name.endsWith(ext))
      && !entry.name.includes('.test.')
      && !entry.name.includes('.vitest.')
    ) {
      results.push(childRel)
    }
  }
  return results
}

function collectTsxFiles(): string[] {
  const unique = new Set<string>()
  for (const root of GUARDED_TSX_ROOTS) {
    for (const file of walkSourceFiles(root, ['.tsx'])) {
      unique.add(file)
    }
  }
  return Array.from(unique).sort()
}

function collectDateFormatFiles(): string[] {
  const unique = new Set<string>()
  for (const root of DATE_FORMAT_GUARDED_ROOTS) {
    for (const file of walkSourceFiles(root, ['.ts', '.tsx'])) {
      if (file !== 'src/utils/format.ts') {
        unique.add(file)
      }
    }
  }
  return Array.from(unique).sort()
}

function findNonStandardModalWidths(
  source: string,
  filePath: string,
): string[] {
  if (filePath in MODAL_WIDTH_EXCEPTIONS) {
    return []
  }

  const badWidths: string[] = []
  const modalOpenings = source.matchAll(/<Modal(?=\s|>)([\s\S]{0,700}?)>/g)
  for (const match of modalOpenings) {
    const widthMatch = match[1].match(
      /\bwidth=(?:\{([^}]+)\}|"([^"]+)"|'([^']+)')/,
    )
    if (!widthMatch) {
      continue
    }

    const expr = (widthMatch[1] ?? widthMatch[2] ?? widthMatch[3]).trim()
    // 支持三元响应宽度（如 mobile ? 520 : 960），每一分支均须落在三档内
    const qIndex = expr.indexOf('?')
    const cIndex = qIndex >= 0 ? expr.indexOf(':', qIndex + 1) : -1
    const candidates = qIndex >= 0 && cIndex > qIndex
      ? [expr.slice(qIndex + 1, cIndex).trim(), expr.slice(cIndex + 1).trim()]
      : [expr]

    for (const candidate of candidates) {
      if (!ALLOWED_MODAL_WIDTHS.has(candidate)) {
        badWidths.push(expr)
        break
      }
    }
  }
  return badWidths
}

function findNonVerticalForms(source: string, filePath: string): string[] {
  if (/Search[^/]*\.tsx$/.test(filePath)) {
    return []
  }

  const badLayouts: string[] = []
  const formOpenings = source.matchAll(/<Form(?=\s|>)([\s\S]{0,600}?)>/g)
  for (const match of formOpenings) {
    const layoutMatch = match[1].match(
      /\blayout=(?:\{([^}]+)\}|"([^"]+)"|'([^']+)')/,
    )
    const layout = layoutMatch
      ? (layoutMatch[1] ?? layoutMatch[2] ?? layoutMatch[3]).trim()
      : '(default)'
    if (layout !== 'vertical') {
      badLayouts.push(layout)
    }
  }
  return badLayouts
}

function findNonStandardSearchResetButtons(
  source: string,
  filePath: string,
): string[] {
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const solid16Icons = new Set<string>()
  for (const stmt of sf.statements) {
    if (
      ts.isImportDeclaration(stmt)
      && ts.isStringLiteral(stmt.moduleSpecifier)
      && stmt.moduleSpecifier.text === '@heroicons/react/16/solid'
      && stmt.importClause?.namedBindings
      && ts.isNamedImports(stmt.importClause.namedBindings)
    ) {
      for (const el of stmt.importClause.namedBindings.elements) {
        solid16Icons.add(el.name.text)
      }
    }
  }

  const violations: string[] = []
  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) {
      const tag = node.openingElement.tagName.getText(sf)
      if (tag === 'Button' || tag === 'PermissionButton') {
        const childrenText = node.children
          .map(child => child.getText(sf).trim())
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')

        const isSearchBtn = childrenText === '搜索' || (filePath === 'src/ui/FilterBar.tsx' && childrenText === '{searchText}')
        const isResetBtn = childrenText === '重置' || (filePath === 'src/ui/FilterBar.tsx' && childrenText === '{resetText}')

        if (isSearchBtn || isResetBtn) {
          const expectedIcon = isSearchBtn ? 'MagnifyingGlassIcon' : 'ArrowPathIcon'
          let iconExpr = ''
          for (const attr of node.openingElement.attributes.properties) {
            if (ts.isJsxAttribute(attr) && attr.name.getText(sf) === 'icon') {
              iconExpr = attr.initializer?.getText(sf).replace(/\s+/g, ' ') ?? ''
            }
          }

          if (!solid16Icons.has(expectedIcon) || !iconExpr.includes(`<${expectedIcon}`) || !iconExpr.includes('size-4')) {
            const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
            violations.push(`L${line}: "${childrenText}" 必须配置 @heroicons/react/16/solid 的 <${expectedIcon} className="size-4" />`)
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  return violations
}

describe('UI style conventions guard', () => {
  it('keeps the unified design guide authoritative and marks legacy UI docs as archived', () => {
    const designGuide = readWorkspaceFile('docs/前端页面风格规范与设计指南.md')
    const interactionSpec = readWorkspaceFile('docs/前端交互与反馈规范.md')
    const legacyResearch = readWorkspaceFile('docs/UI设计调研与改版指南.md')
    const legacyPageAudit = readWorkspaceFile('docs/UI改版-逐页问题分析与改进方案.md')
    const todo = readWorkspaceFile('todolist.md')

    expect(designGuide).toContain('唯一权威规范')
    expect(interactionSpec).toContain('前端页面风格规范与设计指南.md')
    expect(legacyResearch).toContain('已归档')
    expect(legacyPageAudit).toContain('已归档')
    expect(todo).toContain('docs/前端页面风格规范与设计指南.md')
  })

  it.each(collectTsxFiles())(
    '%s follows UI style redlines (icons, slate grays, no arbitrary radius/shadow, no raw svg, standard modal widths, vertical forms)',
    (filePath) => {
      const source = readWorkspaceFile(filePath)

      expect(source, `${filePath} 不应覆盖私有 .ant-* 类名`).not.toMatch(/\.ant-/)
      expect(source, `${filePath} 不应引入 @ant-design/icons`).not.toMatch(/@ant-design\/icons/)
      expect(
        source,
        `${filePath} 灰阶应统一使用 slate-*，不应使用 gray/neutral/zinc/stone`,
      ).not.toMatch(/\b(?:bg|text|border|ring|divide|from|to|via)-(?:gray|neutral|zinc|stone)-/)
      expect(source, `${filePath} 不应使用宋体/衬线装饰字体`).not.toMatch(/STSong|SimSun|Noto Serif/)
      expect(
        source,
        `${filePath} 不应新增任意圆角 rounded-[...] 或任意阴影 shadow-[...]`,
      ).not.toMatch(/\b(?:rounded-\[|shadow-\[)/)
      expect(source, `${filePath} 不应手写业务 <svg>`).not.toMatch(/<svg\b/)
      expect(
        source,
        `${filePath} 不应在页面内再套蓝点「筛选条件」白卡或带阴影表格白卡`,
      ).not.toMatch(/rounded-lg border border-slate-200\/60 bg-white p-4 shadow-sm|rounded-full bg-blue-500[\s\S]{0,120}筛选条件|min-h-0 flex-1 overflow-hidden rounded-xl border/)
      expect(
        findNonStandardModalWidths(source, filePath),
        `${filePath} Modal 宽度应仅使用 520 / 720 / 960 三档`,
      ).toEqual([])
      expect(
        findNonVerticalForms(source, filePath),
        `${filePath} 非搜索表单应统一使用 layout="vertical"`,
      ).toEqual([])
      expect(
        findNonStandardSearchResetButtons(source, filePath),
        `${filePath} 搜索/重置按钮应统一前置 @heroicons/react/16/solid 图标（size-4）`,
      ).toEqual([])
    },
  )

  it.each(collectDateFormatFiles())(
    '%s uses formatDate/formatDateTime instead of Date.prototype.toLocale*String',
    (filePath) => {
      const source = readWorkspaceFile(filePath)

      expect(
        source,
        `${filePath} 日期时间展示应使用 @/utils/format 的 formatDate / formatDateTime，禁止 new Date(...).toLocaleString()`,
      ).not.toMatch(/new Date\([^)]*\)\.toLocale(?:Date|Time)?String\(|\.toLocale(?:Date|Time)String\(/)
    },
  )
})
