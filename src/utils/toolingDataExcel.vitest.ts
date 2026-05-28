import { describe, expect, it } from 'vitest'

import type { ToolingData } from '@/services/apiToolingData'
import { createToolingDataExportWorkbook } from './toolingDataExcel'

describe('createToolingDataExportWorkbook', () => {
  it('exports all tooling data fields into a worksheet', () => {
    const workbook = createToolingDataExportWorkbook([
      {
        id: 'tooling-data-1',
        tool_code: 'T-001',
        tool_name: '立铣刀',
        tool_spec: 'D10',
        material: '硬质合金',
        unit_price: 12.5,
        usage: '精加工',
        remarks: '常用',
        created_at: '2026-05-28T08:00:00',
        updated_at: '2026-05-28T09:30:00',
      },
    ] satisfies ToolingData[])

    expect(workbook.SheetNames[0]).toBe('刀具资料')

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('刀具资料')
    expect(worksheet.A2?.v).toBe('#')
    expect(worksheet.B2?.v).toBe('刀具编号')
    expect(worksheet.B3?.v).toBe('T-001')
    expect(worksheet.F3?.v).toBe(12.5)
    expect(worksheet.F3?.z).toBe('0.00')
    expect(worksheet.I3?.v).toBe('2026-05-28 09:30')
    expect(worksheet['!merges']).toEqual(
      expect.arrayContaining([
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 8 },
        },
      ]),
    )
  })
})
