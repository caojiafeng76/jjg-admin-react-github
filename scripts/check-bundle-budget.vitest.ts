import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

interface ManifestChunk {
  file: string
  imports?: string[]
  dynamicImports?: string[]
  isDynamicEntry?: boolean
  isEntry?: boolean
  name?: string
  src?: string
}

const temporaryDirectories: string[] = []

function createDistFixture({
  files,
  indexHtml = '<script type="module" src="/assets/main.js"></script>',
  manifest,
}: {
  files: Record<string, string | Uint8Array>
  indexHtml?: string
  manifest: Record<string, ManifestChunk>
}): string {
  const distDirectory = mkdtempSync(join(tmpdir(), 'jjg-bundle-budget-'))
  temporaryDirectories.push(distDirectory)

  mkdirSync(join(distDirectory, '.vite'), { recursive: true })
  writeFileSync(
    join(distDirectory, '.vite', 'manifest.json'),
    JSON.stringify(manifest),
  )
  writeFileSync(join(distDirectory, 'index.html'), indexHtml)

  for (const [relativePath, contents] of Object.entries(files)) {
    const targetPath = join(distDirectory, relativePath)
    mkdirSync(dirname(targetPath), { recursive: true })
    writeFileSync(targetPath, contents)
  }

  return distDirectory
}

function runBundleBudget(distDirectory: string): {
  output: string
  status: number | null
} {
  const result = spawnSync('bun', ['scripts/check-bundle-budget.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      BUNDLE_BUDGET_DIST_DIR: distDirectory,
    },
  })

  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe('bundle budget guard', () => {
  it('rejects a heavy document module nested in the entry static import graph', () => {
    const distDirectory = createDistFixture({
      files: {
        'assets/main.js': 'import "./shared.js"',
        'assets/shared.js': 'import "./chunk-A1.js"',
        'assets/chunk-A1.js': 'export const report = true',
      },
      manifest: {
        'src/main.tsx': {
          file: 'assets/main.js',
          imports: ['_shared.js'],
          isEntry: true,
          src: 'src/main.tsx',
        },
        '_shared.js': {
          file: 'assets/shared.js',
          imports: ['src/utils/reportPdfDocument.ts'],
        },
        'src/utils/reportPdfDocument.ts': {
          file: 'assets/chunk-A1.js',
          name: 'reportPdfDocument',
          src: 'src/utils/reportPdfDocument.ts',
        },
      },
    })

    const result = runBundleBudget(distDirectory)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('入口静态依赖图')
    expect(result.output).toContain('reportPdfDocument')
  })

  it('checks the gzip budget of every manifest entry', () => {
    const distDirectory = createDistFixture({
      files: {
        'assets/admin.js': randomBytes(700 * 1024),
        'assets/main.js': 'console.log("main")',
      },
      manifest: {
        'src/main.tsx': {
          file: 'assets/main.js',
          isEntry: true,
          src: 'src/main.tsx',
        },
        'src/admin.tsx': {
          file: 'assets/admin.js',
          isEntry: true,
          src: 'src/admin.tsx',
        },
      },
    })

    const result = runBundleBudget(distDirectory)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('assets/admin.js')
    expect(result.output).toContain('超过 600 KB 门槛')
  })

  it('resolves hashed index preloads through manifest metadata', () => {
    const distDirectory = createDistFixture({
      files: {
        'assets/chunk-Z9.js': 'export const report = true',
        'assets/main.js': 'console.log("main")',
      },
      indexHtml:
        '<link rel="modulepreload" href="/assets/chunk-Z9.js"><script type="module" src="/assets/main.js"></script>',
      manifest: {
        'src/main.tsx': {
          file: 'assets/main.js',
          isEntry: true,
          src: 'src/main.tsx',
        },
        'src/utils/reportPdf.ts': {
          file: 'assets/chunk-Z9.js',
          isDynamicEntry: true,
          name: 'reportPdf',
          src: 'src/utils/reportPdf.ts',
        },
      },
    })

    const result = runBundleBudget(distDirectory)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('index.html 不应静态预加载 PDF/XLSX 模块')
    expect(result.output).toContain('reportPdf')
  })

  it('allows heavy modules that are reachable only through dynamic imports', () => {
    const distDirectory = createDistFixture({
      files: {
        'assets/chunk-Z9.js': 'export const report = true',
        'assets/main.js': 'console.log("main")',
      },
      manifest: {
        'src/main.tsx': {
          dynamicImports: ['src/utils/reportPdf.ts'],
          file: 'assets/main.js',
          isEntry: true,
          src: 'src/main.tsx',
        },
        'src/utils/reportPdf.ts': {
          file: 'assets/chunk-Z9.js',
          isDynamicEntry: true,
          name: 'reportPdf',
          src: 'src/utils/reportPdf.ts',
        },
      },
    })

    const result = runBundleBudget(distDirectory)

    expect(result.status).toBe(0)
    expect(result.output).toContain('Bundle budget passed')
  })

  it('rejects heavy static dependencies inside a lazy route entry', () => {
    const distDirectory = createDistFixture({
      files: {
        'assets/main.js': 'console.log("main")',
        'assets/report-page.js': 'import "./xlsx.js"',
        'assets/xlsx.js': 'export const workbook = true',
      },
      manifest: {
        'src/main.tsx': {
          dynamicImports: ['src/pages/ReportPage.tsx'],
          file: 'assets/main.js',
          isEntry: true,
          src: 'src/main.tsx',
        },
        'src/pages/ReportPage.tsx': {
          file: 'assets/report-page.js',
          imports: ['xlsx'],
          isDynamicEntry: true,
          name: 'ReportPage',
          src: 'src/pages/ReportPage.tsx',
        },
        xlsx: {
          file: 'assets/xlsx.js',
          name: 'xlsx',
        },
      },
    })

    const result = runBundleBudget(distDirectory)

    expect(result.status).not.toBe(0)
    expect(result.output).toContain('动态页面静态依赖图')
    expect(result.output).toContain('xlsx')
  })
})
