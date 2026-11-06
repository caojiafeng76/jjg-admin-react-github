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
    item_type: 'A',
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
    row({
      inventory_id: 'p-3',
      item_type: 'B',
      opening_quantity: 7,
      stock_in_quantity: 1,
      stock_out_quantity: 2,
      closing_quantity: 6,
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
  it('creates one A sheet and one B sheet per category, in order', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    expect(workbook.SheetNames).toEqual([
      '配件A',
      '配件B',
      '型材A',
      '型材B',
      '素材A',
      '素材B',
    ])
  })

  it('splits rows by type and totals each sheet separately', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    const partsA = sheetRows(workbook, '配件A')
    expect(partsA[0][0]).toBe('金檀木业配件A月度库存报表（2026年10月）')
    expect(partsA[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(partsA[2]).toEqual([1, 'A', '', '螺钉', 'ST4.2*20', 'SUS304', 100, 20, 30, 0, 90])
    expect(partsA[3]).toEqual([2, 'A', '', '合页', '4寸', 'SUS304', 10, 5, 0, -3, 12])
    expect(partsA[4]).toEqual(['合计', '', '', '', '', '', 110, 25, 30, -3, 102])
    expect(partsA).toHaveLength(5)

    const partsB = sheetRows(workbook, '配件B')
    expect(partsB[0][0]).toBe('金檀木业配件B月度库存报表（2026年10月）')
    expect(partsB[2]).toEqual([1, 'B', '', '螺钉', 'ST4.2*20', 'SUS304', 7, 1, 2, 0, 6])
    expect(partsB[3]).toEqual(['合计', '', '', '', '', '', 7, 1, 2, 0, 6])

    const profilesB = sheetRows(workbook, '型材B')
    expect(profilesB[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(profilesB[2]).toEqual([1, 'B', '140U', '立柱', '3米', '6063铝合金', 8, 2, 4, 0, 6])
  })

  it('keeps an empty sheet with headers and a zero total row', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    const profilesA = sheetRows(workbook, '型材A')
    expect(profilesA[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(profilesA[2]).toEqual(['合计', '', '', '', '', '', 0, 0, 0, 0, 0])

    const materialsB = sheetRows(workbook, '素材B')
    expect(materialsB[0][0]).toBe('金檀木业素材B月度库存报表（2026年10月）')
    expect(materialsB[2]).toEqual(['合计', '', '', '', '', '', 0, 0, 0, 0, 0])
  })

  it('creates only the selected type when one is given', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10', 'B')

    expect(workbook.SheetNames).toEqual(['配件B', '型材B', '素材B'])
    expect(sheetRows(workbook, '配件B')[2][3]).toBe('螺钉')
  })
})
