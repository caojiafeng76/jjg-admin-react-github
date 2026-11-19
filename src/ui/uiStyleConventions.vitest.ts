import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * 渐进式前端页面风格守卫测试（Phase 0 建立，随 Phase 1–5 逐步扩大覆盖范围）。
 *
 * 规范来源：docs/前端页面风格规范与设计指南.md
 * 推进策略：
 * - Phase 0：锁定规范文档收口状态 + 保护已达标的共享 UI / 系统页基线文件；
 * - Phase 1：将整个 `src/ui` 纳入 GUARDED_DIRS；
 * - Phase 2–4：每完成一个业务域迁移，立即把该目录追加到 GUARDED_DIRS；
 * - Phase 5：切换为覆盖全部 `src/features`、`src/pages`、`src/ui` 的全库强制门槛。
 */

const ALLOWED_MODAL_WIDTHS = new Set(['520', '720', '960'])

/** 已达标并锁定防回退的单文件清单 */
const GUARDED_FILES = [
  'src/ui/AddButton.tsx',
  'src/ui/AppErrorView.tsx',
  'src/ui/AppHeader.tsx',
  'src/ui/AppLayout.tsx',
  'src/ui/AppLogo.tsx',
  'src/ui/AppPagination.tsx',
  'src/ui/AppQRCode.tsx',
  'src/ui/DarkModeButton.tsx',
  'src/ui/DeleteButton.tsx',
  'src/ui/DownloadTemplateButton.tsx',
  'src/ui/EditButton.tsx',
  'src/ui/EmployeeChangePasswordForm.tsx',
  'src/ui/ErrorBoundary.tsx',
  'src/ui/ErrorTechnicalDetail.tsx',
  'src/ui/ExcelImportModal.tsx',
  'src/ui/ExcelParseErrorList.tsx',
  'src/ui/ExportButton.tsx',
  'src/ui/FilterBar.tsx',
  'src/ui/FormErrorAlert.tsx',
  'src/ui/ImportButton.tsx',
  'src/ui/Loading.tsx',
  'src/ui/MainMenu.tsx',
  'src/ui/mainMenuItems.tsx',
  'src/ui/PageErrorBoundary.tsx',
  'src/ui/PageForbidden.tsx',
  'src/ui/PageTabs.tsx',
  'src/ui/PermissionButton.tsx',
  'src/ui/PermissionField.tsx',
  'src/ui/PermissionGate.tsx',
  'src/ui/PrintButton.tsx',
  'src/ui/PublicQrPageShell.tsx',
  'src/ui/SelectedSummaryBar.tsx',
  'src/ui/StatusPill.tsx',
  'src/ui/TableState.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/PageNotFound.tsx',
] as const

/** 已完成风格迁移并锁定防回退的目录清单（随 Phase 1–5 逐步追加） */
const GUARDED_DIRS: readonly string[] = []

function readWorkspaceFile(relativePath: string): string {
  return readFileSync(path.resolve(process.cwd(), relativePath), 'utf8')
}

function walkTsxFiles(dirRelativePath: string): string[] {
  const fullDir = path.resolve(process.cwd(), dirRelativePath)
  if (!existsSync(fullDir)) {
    return []
  }

  const results: string[] = []
  for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
    const childRel = path.join(dirRelativePath, entry.name).replaceAll('\\', '/')
    if (entry.isDirectory()) {
      results.push(...walkTsxFiles(childRel))
    }
    else if (
      entry.name.endsWith('.tsx')
      && !entry.name.includes('.test.')
      && !entry.name.includes('.vitest.')
    ) {
      results.push(childRel)
    }
  }
  return results
}

function collectGuardedFiles(): string[] {
  const unique = new Set<string>(GUARDED_FILES)
  for (const dir of GUARDED_DIRS) {
    for (const file of walkTsxFiles(dir)) {
      unique.add(file)
    }
  }
  return Array.from(unique).sort()
}

function findNonStandardModalWidths(source: string): string[] {
  const badWidths: string[] = []
  const modalOpenings = source.matchAll(/<Modal\b[\s\S]{0,600}?>/g)
  for (const match of modalOpenings) {
    const widthMatch = match[0].match(/\bwidth=\{\s*(\d+)\s*\}/)
    if (widthMatch && !ALLOWED_MODAL_WIDTHS.has(widthMatch[1])) {
      badWidths.push(widthMatch[1])
    }
  }
  return badWidths
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

  it.each(collectGuardedFiles())(
    '%s follows UI style redlines (icons, slate grays, no arbitrary radius/shadow, no raw svg, standard modal widths)',
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
        findNonStandardModalWidths(source),
        `${filePath} Modal 宽度应仅使用 520 / 720 / 960 三档`,
      ).toEqual([])
    },
  )
})
