import type {
  JintanMonthlyReport,
  JintanMonthlyReportRow,
} from '@/services/apiJintanMonthlyReport'
import { describe, expect, it } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import {
  createJintanMonthlyReportWorkbook,
  JINTAN_MONTHLY_REPORT_HEADERS,
} from './jintanMonthlyReportExcel'

function row(overrides: Partial<JintanMonthlyReportRow>): JintanMonthlyReportRow {
  return {
    category: 'parts',
    inventory_id: 'inventory-1',
    item_type: '',
    item_model: '',
    item_name: '螺钉',
    specification: 'ST4.2*20',
    material: 'SUS304',
    supplier: '',
    opening_quantity: 0,
    stock_in_quantity: 0,
    stock_out_quantity: 0,
    stock_adjust_quantity: 0,
    closing_quantity: 0,
    current_quantity: 0,
    ...overrides,
  }
}

const report: JintanMonthlyReport = {
  parts: [
    row({
      inventory_id: 'p-1',
      opening_quantity: 100,
      stock_in_quantity: 20,
      stock_out_quantity: 30,
      closing_quantity: 90,
    }),
    row({
      inventory_id: 'p-2',
      item_name: '合页',
      specification: '4寸',
      opening_quantity: 10,
      stock_in_quantity: 5,
      stock_out_quantity: 0,
      stock_adjust_quantity: -3,
      closing_quantity: 12,
    }),
  ],
  profiles: [
    row({
      category: 'profiles',
      inventory_id: 'pr-1',
      item_type: 'B',
      item_model: '140U',
      item_name: '立柱',
      specification: '3米',
      material: '6063铝合金',
      opening_quantity: 8,
      stock_in_quantity: 2,
      stock_out_quantity: 4,
      closing_quantity: 6,
    }),
  ],
  materials: [],
}

function sheetRows(workbook: XLSX.WorkBook, name: string) {
  return XLSX.utils.sheet_to_json<Array<string | number>>(workbook.Sheets[name], {
    header: 1,
    defval: '',
  })
}

describe('createJintanMonthlyReportWorkbook', () => {
  it('creates parts, profiles and materials sheets in order', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    expect(workbook.SheetNames).toEqual(['配件', '型材', '素材'])
  })

  it('writes title, headers, rows and a total row with the same layout per sheet', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')
    const parts = sheetRows(workbook, '配件')

    expect(parts[0][0]).toBe('金檀木业配件月度库存报表（2026年10月）')
    expect(parts[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(parts[2]).toEqual([1, '', '', '螺钉', 'ST4.2*20', 'SUS304', 100, 20, 30, 0, 90])
    expect(parts[3]).toEqual([2, '', '', '合页', '4寸', 'SUS304', 10, 5, 0, -3, 12])
    expect(parts[4]).toEqual(['合计', '', '', '', '', '', 110, 25, 30, -3, 102])

    const profiles = sheetRows(workbook, '型材')
    expect(profiles[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(profiles[2]).toEqual([1, 'B', '140U', '立柱', '3米', '6063铝合金', 8, 2, 4, 0, 6])
  })

  it('keeps an empty category sheet with headers and a zero total row', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')
    const materials = sheetRows(workbook, '素材')

    expect(materials[0][0]).toBe('金檀木业素材月度库存报表（2026年10月）')
    expect(materials[2]).toEqual(['合计', '', '', '', '', '', 0, 0, 0, 0, 0])
  })
})
