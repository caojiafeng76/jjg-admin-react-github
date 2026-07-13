import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

function readWorkspaceFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('application shell optimization guards', () => {
  it('lets Vite split dynamic entries without a global manualChunks policy', () => {
    expect(readWorkspaceFile('vite.config.ts')).not.toMatch(/manualChunks\s*\(/)
  })

  it('memoizes the Ant Design theme from the dark-mode atom', () => {
    const appSource = readWorkspaceFile('src/App.tsx')

    expect(appSource).toMatch(
      /useAppStore\(\s*\(state\) => state\.isDarkMode\s*\)/,
    )
    expect(appSource).toMatch(/const themeConfig = useMemo\(\s*\(\) =>\s*\(\{/)
    expect(appSource).toMatch(/\}\),\s*\[isDarkMode\],?\s*\)/)
  })

  it('uses Chinese document metadata and keeps browser zoom enabled', () => {
    const html = readWorkspaceFile('index.html')

    expect(html).toMatch(/<html lang="zh-CN">/)
    expect(html).toMatch(/content="[^"]*viewport-fit=cover[^"]*"/)
    expect(html).not.toMatch(/maximum-scale|user-scalable=no/)
  })

  it('pins the repository Bun version', () => {
    const packageJson = JSON.parse(readWorkspaceFile('package.json')) as {
      packageManager?: string
    }

    expect(packageJson.packageManager).toBe('bun@1.3.14')
  })

  it('uses component tokens instead of global Ant table and sider overrides', () => {
    const appSource = readWorkspaceFile('src/App.tsx')
    const layoutSource = readWorkspaceFile('src/ui/AppLayout.tsx')
    const globalCss = readWorkspaceFile('src/index.css')

    expect(appSource).toMatch(/rowHoverBg:/)
    expect(appSource).toMatch(/rowSelectedBg:/)
    expect(layoutSource).toMatch(
      /className="flex h-full flex-col overflow-hidden"/,
    )
    expect(globalCss).not.toMatch(/\.ant-layout-sider/)
    expect(globalCss).not.toMatch(/\.production-order-table\s+\.ant-/)
    expect(globalCss).not.toMatch(/\.standard-time-table\s+\.ant-/)
    expect(globalCss).not.toContain('.ant-')
    expect(globalCss).not.toContain('!important')
  })

  it('applies the mobile date-panel layout through Ant Design semantic classes', () => {
    const appSource = readWorkspaceFile('src/App.tsx')

    expect(appSource).toMatch(/datePicker=\{DATE_PICKER_CONFIG\}/)
    expect(appSource).toContain('[&_.ant-picker-panels]:flex-col')
  })
})
