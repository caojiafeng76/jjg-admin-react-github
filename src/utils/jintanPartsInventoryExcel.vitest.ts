import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { JintanPartsInventory } from '@/services/apiJintanPartsInventory'
import {
  createJintanPartsInventoryExportWorkbook,
  downloadJintanPartsInventoryTemplate,
  parseJintanPartsInventoryExcel,
} from './jintanPartsInventoryExcel'

const TEMPLATE_HEADERS = ['名称', '规格', '库存数量', '备注']

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

function createExcelFile(rows: Array<Array<unknown>>): File {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '配件库存导入模板')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '配件库存.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('createJintanPartsInventoryExportWorkbook', () => {
  it('exports all inventory fields into a merged-title worksheet', () => {
    const workbook = createJintanPartsInventoryExportWorkbook([
      {
        id: 'inventory-1',
        part_data_id: 'part-1',
        part_name: '十字沉头自攻螺钉',
        specification: 'ST4.2*20',
        material: 'SUS304',
        supplier: '南浔螺丝店',
        quantity: 120,
        remarks: '常用',
        created_at: '2026-09-27T08:00:00',
        updated_at: '2026-09-27T09:30:00',
      },
    ] satisfies JintanPartsInventory[])

    expect(workbook.SheetNames[0]).toBe('配件库存')

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('金檀木业配件库存')
    expect(worksheet.A2?.v).toBe('#')
    expect(worksheet.B2?.v).toBe('名称')
    expect(worksheet.B3?.v).toBe('十字沉头自攻螺钉')
    expect(worksheet.C3?.v).toBe('ST4.2*20')
    expect(worksheet.D3?.v).toBe('SUS304')
    expect(worksheet.E3?.v).toBe('南浔螺丝店')
    expect(worksheet.F3?.v).toBe(120)
    expect(worksheet.G3?.v).toBe('常用')
    expect(worksheet.H3?.v).toBe('2026-09-27 09:30')
    expect(worksheet['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    ])
  })
})

describe('parseJintanPartsInventoryExcel', () => {
  it('parses template rows, trims text and converts quantities', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [' 十字沉头自攻螺钉 ', ' ST4.2*20 ', 120, ' 常用 '],
      ['毛巾', '', '0', ''],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      part_name: '十字沉头自攻螺钉',
      specification: 'ST4.2*20',
      quantity: 120,
      remarks: '常用',
    })
    expect(rows[1]).toEqual({
      part_name: '毛巾',
      specification: '',
      quantity: 0,
      remarks: '',
    })
  })

  it('accepts numeric quantity text and rejects invalid quantities', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['螺钉', '', ' 12 ', ''],
      ['毛巾', '', '4.5', ''],
      ['垫片', '', '', ''],
      ['螺母', '', '-3', ''],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(rows).toEqual([
      { part_name: '螺钉', specification: '', quantity: 12, remarks: '' },
    ])
    expect(errors).toEqual([
      '第 3 行库存数量必须为非负整数',
      '第 4 行库存数量必须为非负整数',
      '第 5 行库存数量必须为非负整数',
    ])
  })

  it('skips empty rows and reports missing names and excel duplicates', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['毛巾', '', '1', ''],
      [null, null, null, null],
      [null, 'ST4.2*20', '1', ''],
      ['毛巾', '', '2', ''],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(rows).toHaveLength(1)
    expect(rows[0].part_name).toBe('毛巾')
    expect(errors).toEqual([
      '第 4 行缺少名称',
      '第 5 行名称“毛巾”规格“”在 Excel 中重复',
    ])
  })

  it('throws when the header does not match the template', async () => {
    const file = createExcelFile([
      ['名称', '规格', '数量', '备注'],
      ['毛巾', '', '1', ''],
    ])

    await expect(parseJintanPartsInventoryExcel(file)).rejects.toThrow(
      '模板表头不匹配',
    )
  })

  it('throws when the sheet has no importable data', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [null, null, null, null],
    ])

    await expect(parseJintanPartsInventoryExcel(file)).rejects.toThrow(
      'Excel 中没有可导入的数据',
    )
  })
})

describe('downloadJintanPartsInventoryTemplate', () => {
  it('writes the template workbook with all expected headers', () => {
    writeFileMock.mockClear()

    downloadJintanPartsInventoryTemplate()

    expect(writeFileMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock.mock.calls[0][1]).toBe('金檀木业配件库存模板.xlsx')

    const workbook = writeFileMock.mock.calls[0][0]
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('名称')
    expect(worksheet.B1?.v).toBe('规格')
    expect(worksheet.C1?.v).toBe('库存数量')
    expect(worksheet.D1?.v).toBe('备注')
  })
})
