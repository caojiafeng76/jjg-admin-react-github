import { describe, expect, it } from 'vitest'

import type {
  ToolingData,
  ToolingDataMonthlySummary,
} from '@/services/apiToolingData'
import {
  createToolingDataExportWorkbook,
  createToolingDataMonthlySummaryWorkbook,
} from './toolingDataExcel'

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

describe('createToolingDataMonthlySummaryWorkbook', () => {
  it('exports monthly summary with grouped headers and formulas', () => {
    const workbook = createToolingDataMonthlySummaryWorkbook(
      [
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
          opening_quantity: 10,
          stock_in_quantity: 5,
          stock_out_quantity: 2,
          closing_quantity: 13,
        },
        {
          id: 'tooling-data-2',
          tool_code: 'T-002',
          tool_name: '钻头',
          tool_spec: 'D5',
          material: '高速钢',
          unit_price: 20,
          usage: '钻孔',
          remarks: '备用',
          created_at: '2026-05-28T08:00:00',
          updated_at: '2026-05-28T09:30:00',
          opening_quantity: 0,
          stock_in_quantity: 1,
          stock_out_quantity: 0,
          closing_quantity: 1,
        },
      ] satisfies ToolingDataMonthlySummary[],
      '2026-05',
    )

    expect(workbook.SheetNames[0]).toBe('刀具资料')

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('5月份刀具汇总明细表')
    expect(worksheet.H2?.v).toBe('上次盘点')
    expect(worksheet.J2?.v).toBe('入库')
    expect(worksheet.L2?.v).toBe('出库')
    expect(worksheet.N2?.v).toBe('结余')
    expect(worksheet.A3?.v).toBe('#')
    expect(worksheet.H3?.v).toBe('数量')
    expect(worksheet.I3?.v).toBe('金额')
    expect(worksheet.Q3?.v).toBe('更新时间')

    expect(worksheet.B4?.v).toBe('T-001')
    expect(worksheet.F4?.z).toBe('0.00')
    expect(worksheet.H4?.v).toBe(10)
    expect(worksheet.I4?.f).toBe('H4*$F4')
    expect(worksheet.I4?.v).toBe(125)
    expect(worksheet.N4?.f).toBe('H4+J4-L4')
    expect(worksheet.N4?.v).toBe(13)
    expect(worksheet.O4?.f).toBe('N4*$F4')
    expect(worksheet.H5?.v).toBe(0)
    expect(worksheet.H5?.z).toBe('0.###;-0.###;;@')

    expect(worksheet.G6?.v).toBe('合计')
    expect(worksheet.H6?.f).toBe('SUM(H4:H5)')
    expect(worksheet.H6?.v).toBe(10)
    expect(worksheet.J6?.f).toBe('SUM(J4:J5)')
    expect(worksheet.J6?.v).toBe(6)
    expect(worksheet.O6?.f).toBe('SUM(O4:O5)')
    expect(worksheet.O6?.v).toBe(182.5)

    expect(worksheet['!merges']).toEqual(
      expect.arrayContaining([
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 16 },
        },
        {
          s: { r: 1, c: 7 },
          e: { r: 1, c: 8 },
        },
        {
          s: { r: 1, c: 13 },
          e: { r: 1, c: 14 },
        },
      ]),
    )
    expect(worksheet['!freeze']).toEqual({ xSplit: 0, ySplit: 3 })
  })
})
