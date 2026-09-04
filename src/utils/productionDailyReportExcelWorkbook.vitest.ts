import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'
import { buildProductionDailyReportExcelBuffer } from './productionDailyReportExcelWorkbook'

function createReportRow(
  key: string,
  incomingQualifiedCount: number,
  qualifiedCount: number,
  overrides: Partial<ProductionDailyReportRow> = {},
): ProductionDailyReportRow {
  const rawMaterialDefectCount = overrides.rawMaterialDefectCount ?? 0
  const processingDefectCount = overrides.processingDefectCount ?? 0
  const outsourceDefectCount = overrides.outsourceDefectCount ?? 0
  const setupDefectCount = overrides.setupDefectCount ?? 0

  return {
    key,
    orderDate: '2026-09-04',
    dataCategory: 'A',
    projectNo: `P-${key}`,
    productModel: '113-53',
    customerModel: '116 015',
    incomingQualifiedCount,
    lengthMm: 1701,
    operation: 'CNC',
    qualifiedCount,
    defectCount:
      rawMaterialDefectCount +
      processingDefectCount +
      outsourceDefectCount +
      setupDefectCount,
    workHours: 8,
    employeeName: '张三',
    rawMaterialDefectCount,
    processingDefectCount,
    outsourceDefectCount,
    outsourceDefectReason: '-',
    outsourceUnit: '-',
    setupDefectCount,
    setupResponsible: '-',
    qualifiedRate:
      incomingQualifiedCount > 0 ? qualifiedCount / incomingQualifiedCount : 0,
    rawMaterialDefectWeightKg: 0,
    processingDefectWeightKg: 0,
    outsourceDefectWeightKg: 0,
    setupDefectWeightKg: 0,
    remark: '-',
    ...overrides,
  }
}

describe('buildProductionDailyReportExcelBuffer', () => {
  it('adds a summary worksheet with daily aggregate rows', () => {
    const buffer = buildProductionDailyReportExcelBuffer([
      createReportRow('001', 100, 90, {
        rawMaterialDefectCount: 4,
        processingDefectCount: 3,
        outsourceDefectCount: 2,
        outsourceDefectReason: '划伤',
        outsourceUnit: '外协一',
        setupDefectCount: 1,
        setupResponsible: '王五',
        rawMaterialDefectWeightKg: 1.25,
        processingDefectWeightKg: 0.75,
        outsourceDefectWeightKg: 0.5,
        setupDefectWeightKg: 0.25,
        remark: '首件复核',
      }),
      createReportRow('002', 50, 35, {
        rawMaterialDefectCount: 5,
        processingDefectCount: 6,
        outsourceDefectCount: 3,
        outsourceDefectReason: '磕碰',
        outsourceUnit: '外协二',
        setupDefectCount: 1,
        setupResponsible: '赵六',
        rawMaterialDefectWeightKg: 2,
        processingDefectWeightKg: 3,
        outsourceDefectWeightKg: 4,
        setupDefectWeightKg: 5,
        remark: '尾件抽检',
      }),
    ])
    const workbook = XLSX.read(buffer, { type: 'array' })
    const summary = workbook.Sheets['汇总表']

    expect(workbook.SheetNames).toEqual(['生产日报表', '汇总表'])
    expect(summary.A1?.v).toBe('精加工车间9月4日日报表汇总明细')
    expect([summary.A2?.v, summary.B2?.v, summary.C2?.v]).toEqual([
      '序号',
      '汇总项目',
      '汇总结果',
    ])
    expect(summary.B3?.v).toBe('来料合格数')
    expect(summary.C3?.v).toBe(150)
    expect(summary.B4?.v).toBe('成品合格数')
    expect(summary.C4?.v).toBe(125)
    expect(summary.B5?.v).toBe('不良数量')
    expect(summary.C5?.v).toBe(25)
    expect(summary.B8?.v).toBe('外协不良数')
    expect(summary.C8?.v).toBe(5)
    expect(summary.C9?.v).toBe('划伤、磕碰')
    expect(summary.C10?.v).toBe('外协一、外协二')
    expect(summary.C11?.v).toBe(2)
    expect(summary.C12?.v).toBe('王五、赵六')
    expect(summary.C13?.v).toBeCloseTo(125 / 150, 4)
    expect(summary.C14?.v).toBe(3.25)
    expect(summary.C15?.v).toBe(3.75)
    expect(summary.C16?.v).toBe(4.5)
    expect(summary.C17?.v).toBe(5.25)
    expect(summary.C18?.v).toBe('首件复核、尾件抽检')
  })
})
