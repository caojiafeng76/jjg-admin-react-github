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

const HEADER_ROW_INDEX = 2
const DATA_START_ROW_INDEX = 3

function getSheet(): WorkSheet {
  const workbook = writeFileMock.mock.calls.at(-1)![0] as WorkBook
  return workbook.Sheets[workbook.SheetNames[0]]
}

function getHeaders(sheet: WorkSheet): string[] {
  return XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })[HEADER_ROW_INDEX]
}

function getTableData(sheet: WorkSheet): Array<Record<string, string | number>> {
  return XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, {
    range: HEADER_ROW_INDEX,
  })
}

function getCell(sheet: WorkSheet, header: string, tableRowOffset: number): XLSX.CellObject {
  const headers = getHeaders(sheet)
  return sheet[XLSX.utils.encode_cell({ r: HEADER_ROW_INDEX + tableRowOffset, c: headers.indexOf(header) })]
}

describe('exportOrderStatusDashboardToExcel', () => {
  beforeEach(() => writeFileMock.mockClear())

  it('exports the screenshot totals and one ordered precision cutting column', () => {
    exportOrderStatusDashboardToExcel(createScreenshotDashboardOrders(), DASHBOARD_JOB_COLUMNS)
    const sheet = getSheet()
    const data = getTableData(sheet)
    expect(data).toHaveLength(6)
    expect(data[5]).toMatchObject({ 序号: '汇总', 订单数量: 27700, 库存: 8820, 切割: 20307, CNC: 11586, 冲床: 16405, 钻床: 14102, 生产状态: '正常 1\n预警 1\n延期 3', 长度: '', 项目号: '', 订单状态: '' })
    const headers = getHeaders(sheet)
    expect(headers.slice(10, 16)).toEqual(['挤压', '精切', '切割', 'CNC', '冲床', '钻床'])
    expect(headers.filter(header => header === '精切')).toHaveLength(1)
    expect(writeFileMock.mock.calls[0][1]).toMatch(/^订单现状_当前页_5条_\d{4}-\d{2}-\d{2}\.xlsx$/)
  })

  it('sums rework and transfer counts and averages finite rates using the frontend rules', () => {
    const first = createDashboardOrder({ extrusionQuantity: 7, precisionCuttingQuantity: 5, transferQuantity: 3, completionRate: 81, yieldRate: 98.2 })
    first.reworkRepairInfo = { totalQuantity: 10, pendingWorkshopCount: 0, pendingProductionCount: 1, pendingTechnicalCount: 2, pendingQualityCount: 3, completedCount: 4 }
    exportOrderStatusDashboardToExcel([first, createDashboardOrder({ completionRate: 50, yieldRate: 96.4 }), createDashboardOrder({ completionRate: 0 })], [])
    const sheet = getSheet()
    expect(getTableData(sheet).at(-1)).toMatchObject({ 挤压: 7, 精切: 5, 物料转移数量: 3, 返工待生产: 1, 返工待技术: 2, 返工待品质: 3, 返工已完成: 4 })
    expect(getCell(sheet, '完工率(%)', 4).v).toBeCloseTo(0.437)
    expect(getCell(sheet, '成品率', 4).v).toBeCloseTo(0.973)
    expect(getCell(sheet, '成品率', 4).t).toBe('n')
    expect(XLSX.utils.format_cell(getCell(sheet, '成品率', 4))).toBe('97.3%')
    expect(XLSX.utils.format_cell(getCell(sheet, '完工率(%)', 1))).toBe('81.0%')
    expect(XLSX.utils.format_cell(getCell(sheet, '完工率(%)', 3))).toBe('0.0%')
  })

  it('keeps second-page numbering, identifiers as text, muted numeric zero and negative stock highlight', () => {
    exportOrderStatusDashboardToExcel(
      [createDashboardOrder({ project_no: '000001234567890123', material_code: '0000123', inventoryQuantity: -496 })],
      [],
      20,
      { tabLabel: '生产中', exportedAt: new Date('2026-11-17T14:05:00') },
    )
    const sheet = getSheet()
    expect(sheet.A1.v).toBe('订单现状生产进度报表（生产中）')
    expect(sheet.A2.v).toBe('当前页第 21 - 21 条（共 1 条）')
    expect(sheet[`A${DATA_START_ROW_INDEX + 1}`].v).toBe(21)
    expect(sheet[`B${DATA_START_ROW_INDEX + 1}`]).toMatchObject({ t: 's', v: '000001234567890123' })
    expect(getCell(sheet, '料号', 1)).toMatchObject({ t: 's', v: '0000123' })
    expect(getCell(sheet, '库存', 1).s).toMatchObject({
      font: { bold: true, color: { rgb: 'DC2626' } },
      fill: { fgColor: { rgb: 'FEF2F2' } },
    })
    expect(getCell(sheet, '库存', 2).s).toMatchObject({
      font: { bold: true, color: { rgb: 'DC2626' } },
      fill: { fgColor: { rgb: 'F1F5F9' } },
    })
    expect(getCell(sheet, '挤压', 1)).toMatchObject({ t: 'n', v: 0 })
    expect(getCell(sheet, '挤压', 1).s.font.color.rgb).toBe('94A3B8')
    expect(XLSX.utils.format_cell(getCell(sheet, '挤压', 1))).toBe('-')
    expect(getCell(sheet, '成品率', 2).v).toBe('-')
    expect(getCell(sheet, '完工率(%)', 2).v).toBe('-')
  })

  it('writes executive banner, slate headers, subtle zebra rows, status badges, indent padding and summary row', () => {
    exportOrderStatusDashboardToExcel(createScreenshotDashboardOrders(), DASHBOARD_JOB_COLUMNS)
    const sheet = getSheet()
    expect(sheet.A1.s).toMatchObject({
      font: { bold: true, sz: 15, color: { rgb: '0F172A' } },
      fill: { fgColor: { rgb: 'F8FAFC' } },
    })
    expect(sheet.A2.s).toMatchObject({
      font: { sz: 9.5, color: { rgb: '64748B' } },
      border: { bottom: { style: 'medium', color: { rgb: '334155' } } },
    })
    expect(sheet.A3.s).toMatchObject({
      font: { bold: true, color: { rgb: '0F172A' } },
      fill: { fgColor: { rgb: 'EEF2F6' } },
      border: { bottom: { style: 'medium', color: { rgb: '334155' } } },
    })
    expect(sheet.A4.s.fill.fgColor.rgb).toBe('FFFFFF')
    expect(sheet.A5.s.fill.fgColor.rgb).toBe('F8FAFC')
    expect(sheet.A9.s).toMatchObject({
      font: { bold: true, color: { rgb: '0F172A' } },
      fill: { fgColor: { rgb: 'F1F5F9' } },
      border: { top: { style: 'medium', color: { rgb: '475569' } }, bottom: { style: 'medium', color: { rgb: '334155' } } },
    })
    expect(getCell(sheet, '生产状态', 1).s).toMatchObject({
      font: { bold: true, color: { rgb: 'B91C1C' } },
      fill: { fgColor: { rgb: 'FEF2F2' } },
    })
    expect(getCell(sheet, '生产状态', 2).s).toMatchObject({
      font: { bold: true, color: { rgb: 'B45309' } },
      fill: { fgColor: { rgb: 'FFFBEB' } },
    })
    expect(getCell(sheet, '生产状态', 5).s).toMatchObject({
      font: { bold: true, color: { rgb: '15803D' } },
      fill: { fgColor: { rgb: 'F0FDF4' } },
    })
    expect(getCell(sheet, '客户型号', 1).s.alignment).toMatchObject({ horizontal: 'left', indent: 1, wrapText: true })
    expect(getCell(sheet, '图材质', 1).s.alignment).toMatchObject({ horizontal: 'left', indent: 1 })
    expect(sheet['!cols']![6].wch).toBeLessThanOrEqual(30)
    expect(sheet['!rows']![0].hpt).toBe(34)
    expect(sheet['!rows']![1].hpt).toBe(22)
    expect(sheet['!rows']![3].hpt).toBeGreaterThan(24)
    expect(sheet['!rows']![8].hpt).toBeGreaterThanOrEqual(58)

    const workbook = writeFileMock.mock.calls[0][0] as WorkBook
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx', cellStyles: true })
    const restored = XLSX.read(bytes, { type: 'array', cellStyles: true, cellNF: true }).Sheets['订单现状']
    expect(restored.A3.s).toMatchObject({ fgColor: { rgb: 'EEF2F6' } })
    expect(getCell(restored, '库存', 6)).toMatchObject({ t: 'n', v: 8820 })
  })

  it('does not download a workbook for empty rows', () => {
    exportOrderStatusDashboardToExcel([], DASHBOARD_JOB_COLUMNS)
    expect(writeFileMock).not.toHaveBeenCalled()
  })
})
