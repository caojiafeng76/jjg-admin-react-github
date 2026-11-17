import type { WorkBook, WorkSheet } from 'xlsx-js-style'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'
import { createDashboardOrder, createScreenshotDashboardOrders, DASHBOARD_JOB_COLUMNS } from '@/test/fixtures/orderStatusDashboard'
import { exportOrderStatusDashboardToExcel } from './orderStatusDashboardExcel'

const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const xlsx = (actual.default ?? actual) as typeof import('xlsx-js-style')
  return { ...actual, ...xlsx, default: { ...xlsx, writeFile: writeFileMock }, writeFile: writeFileMock }
})

function getSheet(): WorkSheet {
  const workbook = writeFileMock.mock.calls.at(-1)![0] as WorkBook
  return workbook.Sheets[workbook.SheetNames[0]]
}

function getCell(sheet: WorkSheet, header: string, row: number): XLSX.CellObject {
  const headers = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0]
  return sheet[XLSX.utils.encode_cell({ r: row, c: headers.indexOf(header) })]
}

describe('exportOrderStatusDashboardToExcel', () => {
  beforeEach(() => writeFileMock.mockClear())

  it('exports the screenshot totals and one ordered precision cutting column', () => {
    exportOrderStatusDashboardToExcel(createScreenshotDashboardOrders(), DASHBOARD_JOB_COLUMNS)
    const sheet = getSheet()
    const data = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet)
    expect(data).toHaveLength(6)
    expect(data[5]).toMatchObject({ 序号: '汇总', 订单数量: 27700, 库存: 8820, 切割: 20307, CNC: 11586, 冲床: 16405, 钻床: 14102, 生产状态: '正常 1\n预警 1\n延期 3', 长度: '', 项目号: '', 订单状态: '' })
    const headers = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[0]
    expect(headers.slice(10, 16)).toEqual(['挤压', '精切', '切割', 'CNC', '冲床', '钻床'])
    expect(headers.filter(header => header === '精切')).toHaveLength(1)
    expect(writeFileMock.mock.calls[0][1]).toMatch(/^订单现状_当前页_5条_\d{4}-\d{2}-\d{2}\.xlsx$/)
  })

  it('sums rework and transfer counts and averages finite rates using the frontend rules', () => {
    const first = createDashboardOrder({ extrusionQuantity: 7, precisionCuttingQuantity: 5, transferQuantity: 3, completionRate: 81, yieldRate: 98.2 })
    first.reworkRepairInfo = { totalQuantity: 10, pendingWorkshopCount: 0, pendingProductionCount: 1, pendingTechnicalCount: 2, pendingQualityCount: 3, completedCount: 4 }
    exportOrderStatusDashboardToExcel([first, createDashboardOrder({ completionRate: 50, yieldRate: 96.4 }), createDashboardOrder({ completionRate: 0 })], [])
    const sheet = getSheet()
    expect(XLSX.utils.sheet_to_json(sheet).at(-1)).toMatchObject({ 挤压: 7, 精切: 5, 物料转移数量: 3, 返工待生产: 1, 返工待技术: 2, 返工待品质: 3, 返工已完成: 4 })
    expect(getCell(sheet, '完工率(%)', 4).v).toBeCloseTo(0.437)
    expect(getCell(sheet, '成品率', 4).v).toBeCloseTo(0.973)
    expect(getCell(sheet, '成品率', 4).t).toBe('n')
    expect(XLSX.utils.format_cell(getCell(sheet, '成品率', 4))).toBe('97.3%')
    expect(XLSX.utils.format_cell(getCell(sheet, '完工率(%)', 1))).toBe('81.0%')
    expect(XLSX.utils.format_cell(getCell(sheet, '完工率(%)', 3))).toBe('0.0%')
  })

  it('keeps second-page numbering, identifiers as text, numeric zero and negative stock', () => {
    exportOrderStatusDashboardToExcel([createDashboardOrder({ project_no: '000001234567890123', material_code: '0000123', inventoryQuantity: -496 })], [], 20)
    const sheet = getSheet()
    expect(sheet.A2.v).toBe(21)
    expect(sheet.B2).toMatchObject({ t: 's', v: '000001234567890123' })
    expect(getCell(sheet, '料号', 1)).toMatchObject({ t: 's', v: '0000123' })
    expect(getCell(sheet, '库存', 1).s.font.color.rgb).toBe('DC2626')
    expect(getCell(sheet, '库存', 2).s.font.color.rgb).toBe('DC2626')
    expect(getCell(sheet, '挤压', 1)).toMatchObject({ t: 'n', v: 0 })
    expect(XLSX.utils.format_cell(getCell(sheet, '挤压', 1))).toBe('-')
    expect(getCell(sheet, '成品率', 2).v).toBe('-')
    expect(getCell(sheet, '完工率(%)', 2).v).toBe('-')
  })

  it('writes blue headers, alternating rows, highlighted totals and wrapped long text to the xlsx file', () => {
    exportOrderStatusDashboardToExcel(createScreenshotDashboardOrders(), DASHBOARD_JOB_COLUMNS)
    const sheet = getSheet()
    expect(sheet.A1.s).toMatchObject({ font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2563EB' } } })
    expect(sheet.A2.s.fill.fgColor.rgb).toBe('FFFFFF')
    expect(sheet.A3.s.fill.fgColor.rgb).toBe('EFF6FF')
    expect(sheet.A7.s).toMatchObject({ font: { bold: true }, fill: { fgColor: { rgb: 'DBEAFE' } }, border: { top: { style: 'medium' } } })
    expect(getCell(sheet, '客户型号', 1).s.alignment).toMatchObject({ horizontal: 'left', wrapText: true })
    expect(sheet['!cols']![6].wch).toBe(34)
    expect(sheet['!rows']![1].hpt).toBeGreaterThan(26)
    expect(sheet['!rows']![6].hpt).toBeGreaterThanOrEqual(61)
    const workbook = writeFileMock.mock.calls[0][0] as WorkBook
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', cellStyles: true })
    const restored = XLSX.read(bytes, { type: 'array', cellStyles: true, cellNF: true }).Sheets['订单现状']
    expect(restored.A1.s).toMatchObject({ fgColor: { rgb: '2563EB' } })
    expect(getCell(restored, '库存', 6)).toMatchObject({ t: 'n', v: 8820 })
  })

  it('does not download a workbook for empty rows', () => {
    exportOrderStatusDashboardToExcel([], DASHBOARD_JOB_COLUMNS)
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
