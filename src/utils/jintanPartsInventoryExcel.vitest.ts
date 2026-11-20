import type { JintanPartsInventory } from '@/services/apiJintanPartsInventory'
import { describe, expect, it, vi } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import {
  createJintanPartsInventoryExportWorkbook,
  downloadJintanPartsInventoryTemplate,
  parseJintanPartsInventoryExcel,
} from './jintanPartsInventoryExcel'

const TEMPLATE_HEADERS = ['名称', '规格', '库存数量', '备注']
const TEMPLATE_HEADERS_WITH_TYPE = [...TEMPLATE_HEADERS, '类型']
const TEMPLATE_HEADERS_WITH_COLOR = [...TEMPLATE_HEADERS_WITH_TYPE, '颜色']
const TEMPLATE_HEADERS_WITH_CATEGORY = [...TEMPLATE_HEADERS_WITH_COLOR, '类别']

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
  it('splits inventory into 6 sheets and fills stock status per sheet', () => {
    const workbook = createJintanPartsInventoryExportWorkbook([
      {
        id: 'inventory-1',
        part_data_id: 'part-1',
        part_category: '140U',
        item_type: 'B',
        part_name: '十字沉头自攻螺钉',
        specification: 'ST4.2*20',
        color: '黑色',
        material: 'SUS304',
        supplier: '南浔螺丝店',
        quantity: 120,
        remarks: '常用',
        unit_quantity: 14,
        safety_multiple: 10,
        safety_stock: 140,
        threshold_stock: 70,
        stock_status: 'warning',
        stock_status_rank: 1,
        created_at: '2026-09-27T08:00:00',
        updated_at: '2026-09-27T09:30:00',
      },
      {
        id: 'inventory-2',
        part_data_id: 'part-2',
        part_category: '通用',
        item_type: 'A',
        part_name: '纸箱',
        specification: '',
        color: '黑色',
        material: '',
        supplier: '',
        quantity: 0,
        remarks: '',
        unit_quantity: null,
        safety_multiple: 10,
        safety_stock: null,
        threshold_stock: null,
        stock_status: 'unset',
        stock_status_rank: 3,
        created_at: '2026-09-27T08:00:00',
        updated_at: '2026-09-27T09:30:00',
      },
    ] satisfies JintanPartsInventory[])

    expect(workbook.SheetNames).toEqual([
      '140U-A',
      '140U-B',
      '220U-A',
      '220U-B',
      '通用-A',
      '通用-B',
    ])

    const sheet140uB = workbook.Sheets['140U-B']
    expect(sheet140uB.A1?.v).toBe('金檀木业配件库存（140U-B）')
    expect(sheet140uB.A2?.v).toBe('#')
    expect(sheet140uB.B2?.v).toBe('类别')
    expect(sheet140uB.C2?.v).toBe('类型')
    expect(sheet140uB.D2?.v).toBe('名称')
    expect(sheet140uB.B3?.v).toBe('140U')
    expect(sheet140uB.C3?.v).toBe('B')
    expect(sheet140uB.D3?.v).toBe('十字沉头自攻螺钉')
    expect(sheet140uB.E3?.v).toBe('ST4.2*20')
    expect(sheet140uB.F2?.v).toBe('颜色')
    expect(sheet140uB.F3?.v).toBe('黑色')
    expect(sheet140uB.G3?.v).toBe('SUS304')
    expect(sheet140uB.H3?.v).toBe('南浔螺丝店')
    expect(sheet140uB.I3?.v).toBe(120)
    expect(sheet140uB.J2?.v).toBe('单台数量')
    expect(sheet140uB.J3?.v).toBe(14)
    expect(sheet140uB.K3?.v).toBe(140)
    expect(sheet140uB.L3?.v).toBe(70)
    expect(sheet140uB.M3?.v).toBe('偏低')
    expect(sheet140uB.N3?.v).toBe('常用')
    expect(sheet140uB.O3?.v).toBe('2026-09-27 09:30')
    expect(sheet140uB['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 14 } },
    ])

    // 库存数量 / 状态按状态填底色，未设置保持白底
    expect(sheet140uB.I3?.s?.fill?.fgColor?.rgb).toBe('FFEB9C')
    expect(sheet140uB.M3?.s?.fill?.fgColor?.rgb).toBe('FFEB9C')
    expect(sheet140uB.H3?.s?.fill?.fgColor?.rgb).not.toBe('FFEB9C')
    expect(sheet140uB.I3?.s?.border?.top?.style).toBe('thin')

    const sheetCommonA = workbook.Sheets['通用-A']
    expect(sheetCommonA.D3?.v).toBe('纸箱')
    expect(sheetCommonA.J3?.v).toBe('')
    expect(sheetCommonA.M3?.v).toBe('未设置')
    expect(sheetCommonA.I3?.s?.fill?.fgColor?.rgb).toBe('FFFFFF')
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
      part_category: '通用',
      item_type: 'A',
      part_name: '十字沉头自攻螺钉',
      specification: 'ST4.2*20',
      color: '',
      quantity: 120,
      remarks: '常用',
    })
    expect(rows[1]).toEqual({
      part_category: '通用',
      item_type: 'A',
      part_name: '毛巾',
      specification: '',
      color: '',
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
      {
        part_category: '通用',
        item_type: 'A',
        part_name: '螺钉',
        specification: '',
        color: '',
        quantity: 12,
        remarks: '',
      },
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
      '第 5 行类别“通用”类型“A”名称“毛巾”规格“”在 Excel 中重复',
    ])
  })

  it('reads the optional type column and treats A and B as different rows', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS_WITH_TYPE,
      ['螺钉', 'M6', 1, '', 'B'],
      ['螺钉', 'M6', 2, '', 'a'],
      ['螺钉', 'M6', 3, '', ''],
      ['垫片', 'M6', 4, '', 'C'],
      ['', '', '', '', 'B'],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(rows.map(row => [row.item_type, row.quantity])).toEqual([
      ['B', 1],
      ['A', 2],
    ])
    expect(errors).toEqual([
      '第 4 行类别“通用”类型“A”名称“螺钉”规格“M6”在 Excel 中重复',
      '第 5 行类型只能填 A 或 B',
    ])
  })

  it('reads the optional color column and treats colors as different rows', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS_WITH_COLOR,
      ['螺钉', 'M6', 1, '', '', ' 黑色 '],
      ['螺钉', 'M6', 2, '', 'A', ''],
      ['螺钉', 'M6', 3, '', '', '黑色'],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(rows.map(row => [row.color, row.quantity])).toEqual([
      ['黑色', 1],
      ['', 2],
    ])
    expect(errors).toEqual([
      '第 4 行类别“通用”类型“A”名称“螺钉”规格“M6”颜色“黑色”在 Excel 中重复',
    ])
  })

  it('reads the optional category column and treats categories as different rows', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS_WITH_CATEGORY,
      ['螺钉', 'M6', 1, '', 'A', '', ' 140u '],
      ['螺钉', 'M6', 2, '', 'A', '', '220U'],
      ['螺钉', 'M6', 3, '', 'A', '', ''],
      ['螺钉', 'M6', 4, '', 'A', '', '300U'],
      ['螺钉', 'M6', 5, '', 'A', '', '通用'],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(rows.map(row => [row.part_category, row.quantity])).toEqual([
      ['140U', 1],
      ['220U', 2],
      ['通用', 3],
    ])
    expect(errors).toEqual([
      '第 5 行类别只能填 140U、220U 或 通用',
      '第 6 行类别“通用”类型“A”名称“螺钉”规格“M6”在 Excel 中重复',
    ])
  })

  it('imports old templates without a type column as A', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['螺钉', 'M6', 1, '', 'B'],
    ])

    const { rows, errors } = await parseJintanPartsInventoryExcel(file)

    expect(errors).toEqual([])
    expect(rows[0].item_type).toBe('A')
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
    const file = createExcelFile([TEMPLATE_HEADERS, [null, null, null, null]])

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
    expect(worksheet.E1?.v).toBe('类型')
    expect(worksheet.F1?.v).toBe('颜色')
    expect(worksheet.G1?.v).toBe('类别')
  })
})
