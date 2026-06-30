import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { AttendanceMonthlyRow } from '@/services/apiAttendanceDetails'
import { exportAttendanceMonthlyExcel } from './attendanceMonthlyExcel'

const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const xlsx = (actual.default ?? actual) as typeof import('xlsx-js-style')

  return {
    ...actual,
    ...xlsx,
    default: {
      ...xlsx,
      writeFile: writeFileMock,
    },
    writeFile: writeFileMock,
  }
})

function createRow(
  employeeName: string,
  isExternal: boolean,
): AttendanceMonthlyRow {
  return {
    employee_name: employeeName,
    job_name: '操作工',
    order_date: '2026-06-01',
    work_hours: 8,
    shift: '白班',
    remark: null,
    is_external: isExternal,
  }
}

describe('exportAttendanceMonthlyExcel', () => {
  beforeEach(() => {
    writeFileMock.mockClear()
  })

  it('splits monthly attendance worksheets by external employee flag', () => {
    exportAttendanceMonthlyExcel(
      [createRow('张三', false), createRow('李四', true)],
      2026,
      6,
    )

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook

    expect(workbook.SheetNames).toEqual(['2026-06-非外来', '2026-06-外来'])
    expect(workbook.Sheets['2026-06-非外来'].C3?.v).toBe('张三')
    expect(workbook.Sheets['2026-06-外来'].C3?.v).toBe('李四')
  })
})
