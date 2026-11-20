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
    part_category: '通用',
    item_type: 'A',
    item_model: '',
    item_name: '螺钉',
    specification: 'ST4.2*20',
    item_color: '',
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
      part_category: '140U',
      opening_quantity: 100,
      stock_in_quantity: 20,
      stock_out_quantity: 30,
      closing_quantity: 90,
    }),
    row({
      inventory_id: 'p-2',
      part_category: '通用',
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
      part_category: '220U',
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
      part_category: '',
      item_type: 'B',
      item_model: '140U',
      item_name: '立柱',
      specification: '3米',
      item_color: '银色',
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
  it('splits parts into 6 category-type sheets and keeps 2 type sheets for profiles/materials', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    expect(workbook.SheetNames).toEqual([
      '配件140U-A',
      '配件140U-B',
      '配件220U-A',
      '配件220U-B',
      '配件通用-A',
      '配件通用-B',
      '型材A',
      '型材B',
      '素材A',
      '素材B',
    ])
  })

  it('splits rows by part category and type and totals each sheet separately', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    const parts140uA = sheetRows(workbook, '配件140U-A')
    expect(parts140uA[0][0]).toBe('金檀木业配件140U-A月度库存报表（2026年10月）')
    expect(parts140uA[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(parts140uA[2]).toEqual([1, '140U', 'A', '', '螺钉', 'ST4.2*20', '', 'SUS304', 100, 20, 30, 0, 90])
    expect(parts140uA[3]).toEqual(['合计', '', '', '', '', '', '', '', 100, 20, 30, 0, 90])
    expect(parts140uA).toHaveLength(4)

    const partsCommonA = sheetRows(workbook, '配件通用-A')
    expect(partsCommonA[2]).toEqual([1, '通用', 'A', '', '合页', '4寸', '', 'SUS304', 10, 5, 0, -3, 12])
    expect(partsCommonA[3]).toEqual(['合计', '', '', '', '', '', '', '', 10, 5, 0, -3, 12])

    const parts220uB = sheetRows(workbook, '配件220U-B')
    expect(parts220uB[0][0]).toBe('金檀木业配件220U-B月度库存报表（2026年10月）')
    expect(parts220uB[2]).toEqual([1, '220U', 'B', '', '螺钉', 'ST4.2*20', '', 'SUS304', 7, 1, 2, 0, 6])
    expect(parts220uB[3]).toEqual(['合计', '', '', '', '', '', '', '', 7, 1, 2, 0, 6])

    const profilesB = sheetRows(workbook, '型材B')
    expect(profilesB[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(profilesB[2]).toEqual([1, '', 'B', '140U', '立柱', '3米', '银色', '6063铝合金', 8, 2, 4, 0, 6])
  })

  it('keeps an empty sheet with headers and a zero total row', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10')

    const profilesA = sheetRows(workbook, '型材A')
    expect(profilesA[1]).toEqual(Array.from(JINTAN_MONTHLY_REPORT_HEADERS))
    expect(profilesA[2]).toEqual(['合计', '', '', '', '', '', '', '', 0, 0, 0, 0, 0])

    const materialsB = sheetRows(workbook, '素材B')
    expect(materialsB[0][0]).toBe('金檀木业素材B月度库存报表（2026年10月）')
    expect(materialsB[2]).toEqual(['合计', '', '', '', '', '', '', '', 0, 0, 0, 0, 0])
  })

  it('creates only the selected type and part category when filtered', () => {
    const workbook = createJintanMonthlyReportWorkbook(report, '2026-10', 'B')

    expect(workbook.SheetNames).toEqual([
      '配件140U-B',
      '配件220U-B',
      '配件通用-B',
      '型材B',
      '素材B',
    ])
    expect(sheetRows(workbook, '配件220U-B')[2][4]).toBe('螺钉')

    const categoryFiltered = createJintanMonthlyReportWorkbook(report, '2026-10', undefined, '140U')
    expect(categoryFiltered.SheetNames).toEqual([
      '配件140U-A',
      '配件140U-B',
      '型材A',
      '型材B',
      '素材A',
      '素材B',
    ])
  })
})
