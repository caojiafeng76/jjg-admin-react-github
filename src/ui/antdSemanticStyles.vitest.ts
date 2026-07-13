import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const TABLE_FILES = [
  'src/features/attendance/AttendanceStats/index.tsx',
  'src/features/attendance/AttendanceDetail/AttendanceDetailTable.tsx',
  'src/features/material-transfer/MaterialTransferTable.tsx',
  'src/features/production-report/ProductionDailyReportTable.tsx',
  'src/features/workshop/ProductionScheduling/index.tsx',
]

function readProjectFile(filePath: string): string {
  return readFileSync(path.resolve(process.cwd(), filePath), 'utf8')
}

describe('Ant Design semantic styling', () => {
  it.each(TABLE_FILES)('%s does not target private .ant-* DOM', (filePath) => {
    expect(readProjectFile(filePath)).not.toMatch(/\.ant-/)
  })

  it.each([
    'src/features/material-transfer/MaterialTransferTable.tsx',
    'src/features/production-report/ProductionDailyReportTable.tsx',
  ])('%s keeps summary rows readable in dark mode', (filePath) => {
    const source = readProjectFile(filePath)

    expect(source).not.toContain('!bg-slate-50')
    expect(source).toContain('bg-slate-50 dark:bg-slate-800/80')
  })
})
