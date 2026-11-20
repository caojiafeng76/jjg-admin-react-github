import type { JintanPartsData } from '@/services/apiJintanPartsData'
import { describe, expect, it, vi } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import {
  createJintanPartsDataExportWorkbook,
  downloadJintanPartsDataTemplate,
  parseJintanPartsDataExcel,
} from './jintanPartsDataExcel'

const TEMPLATE_HEADERS = ['名称', '规格', '材质', '采购厂家', '备注']
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
  XLSX.utils.book_append_sheet(workbook, worksheet, '配件资料导入模板')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '配件资料.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('createJintanPartsDataExportWorkbook', () => {
  it('splits parts into 6 sheets (140U-A/B, 220U-A/B, 通用-A/B) with headers', () => {
    const workbook = createJintanPartsDataExportWorkbook([
      {
        id: 'part-1',
        part_category: '140U',
        item_type: 'B',
        part_name: '十字沉头自攻螺钉',
        specification: 'ST4.2*20',
        color: '黑色',
        material: 'SUS304',
        supplier: '南浔螺丝店',
        remarks: '',
        created_at: '2026-09-22T08:00:00',
        updated_at: '2026-09-22T09:30:00',
      },
      {
        id: 'part-2',
        part_category: '通用',
        item_type: 'A',
        part_name: '毛巾',
        specification: '',
        color: '',
        material: '',
        supplier: '',
        remarks: '',
        created_at: '2026-09-22T08:00:00',
        updated_at: '2026-09-22T09:30:00',
      },
    ] satisfies JintanPartsData[])

    expect(workbook.SheetNames).toEqual([
      '140U-A',
      '140U-B',
      '220U-A',
      '220U-B',
      '通用-A',
      '通用-B',
    ])

    const sheet140uB = workbook.Sheets['140U-B']
    expect(sheet140uB.A1?.v).toBe('金檀木业配件资料（140U-B）')
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
    expect(sheet140uB.J3?.v).toBe('2026-09-22 09:30')
    expect(sheet140uB['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    ])

    const sheetCommonA = workbook.Sheets['通用-A']
    expect(sheetCommonA.D3?.v).toBe('毛巾')

    const emptySheet = workbook.Sheets['220U-A']
    expect(emptySheet.A1?.v).toBe('金檀木业配件资料（220U-A）')
    expect(emptySheet.B2?.v).toBe('类别')
    expect(emptySheet.A3).toBeUndefined()
  })

  it('exports only matching sheets when filtered by category or type', () => {
    const workbook = createJintanPartsDataExportWorkbook(
      [
        {
          id: 'part-1',
          part_category: '140U',
          item_type: 'A',
          part_name: '螺丝',
          specification: '',
          color: '',
          material: '',
          supplier: '',
          remarks: '',
          created_at: '2026-09-22T08:00:00',
          updated_at: '2026-09-22T09:30:00',
        },
      ],
      { partCategory: '140U' },
    )

    expect(workbook.SheetNames).toEqual(['140U-A', '140U-B'])
  })
})

describe('parseJintanPartsDataExcel', () => {
  it('parses template rows and trims text', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [' 十字沉头自攻螺钉 ', ' ST4.2*20 ', ' SUS304 ', ' 南浔螺丝店 ', ' 备注 '],
      ['毛巾', '', '', '', ''],
    ])

    const { rows, errors } = await parseJintanPartsDataExcel(file)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      part_category: '通用',
      item_type: 'A',
      part_name: '十字沉头自攻螺钉',
      specification: 'ST4.2*20',
      color: '',
      material: 'SUS304',
      supplier: '南浔螺丝店',
      remarks: '备注',
    })
    expect(rows[1]).toEqual({
      part_category: '通用',
      item_type: 'A',
      part_name: '毛巾',
      specification: '',
      color: '',
      material: '',
      supplier: '',
      remarks: '',
    })
  })

  it('skips empty rows and reports missing names and excel duplicates', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['毛巾', '', '', '', ''],
      [null, null, null, null, null],
      [null, 'ST4.2*20', '', '', ''],
      ['毛巾', '', '', '', ''],
    ])

    const { rows, errors } = await parseJintanPartsDataExcel(file)

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
      ['螺钉', 'M6', '', '', '', 'B'],
      ['螺钉', 'M6', '', '', '', 'a'],
      ['螺钉', 'M6', '', '', '', ''],
      ['垫片', 'M6', '', '', '', 'C'],
      ['', '', '', '', '', 'B'],
    ])

    const { rows, errors } = await parseJintanPartsDataExcel(file)

    expect(rows.map(row => row.item_type)).toEqual(['B', 'A'])
    expect(errors).toEqual([
      '第 4 行类别“通用”类型“A”名称“螺钉”规格“M6”在 Excel 中重复',
      '第 5 行类型只能填 A 或 B',
    ])
  })

  it('reads the optional color column and treats colors as different rows', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS_WITH_COLOR,
      ['螺钉', 'M6', '', '', '', '', ' 黑色 '],
      ['螺钉', 'M6', '', '', '', 'A', ''],
      ['螺钉', 'M6', '', '', '', '', '黑色'],
    ])

    const { rows, errors } = await parseJintanPartsDataExcel(file)

    expect(rows.map(row => [row.item_type, row.color])).toEqual([
      ['A', '黑色'],
      ['A', ''],
    ])
    expect(errors).toEqual([
      '第 4 行类别“通用”类型“A”名称“螺钉”规格“M6”颜色“黑色”在 Excel 中重复',
    ])
  })

  it('reads the optional category column and treats categories as different rows', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS_WITH_CATEGORY,
      ['螺钉', 'M6', '', '', '', 'A', '', ' 140u '],
      ['螺钉', 'M6', '', '', '', 'A', '', '220U'],
      ['螺钉', 'M6', '', '', '', 'A', '', ''],
      ['螺钉', 'M6', '', '', '', 'A', '', '300U'],
      ['螺钉', 'M6', '', '', '', 'A', '', '通用'],
    ])

    const { rows, errors } = await parseJintanPartsDataExcel(file)

    expect(rows.map(row => row.part_category)).toEqual(['140U', '220U', '通用'])
    expect(errors).toEqual([
      '第 5 行类别只能填 140U、220U 或 通用',
      '第 6 行类别“通用”类型“A”名称“螺钉”规格“M6”在 Excel 中重复',
    ])
  })

  it('throws when the color header is misspelled', async () => {
    const file = createExcelFile([
      [...TEMPLATE_HEADERS_WITH_TYPE, '颜色1'],
      ['螺钉', 'M6', '', '', '', '', '黑色'],
    ])

    await expect(parseJintanPartsDataExcel(file)).rejects.toThrow('模板表头不匹配')
  })

  it('imports old templates without a type column as A', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['螺钉', 'M6', '', '', '', 'B'],
    ])

    const { rows, errors } = await parseJintanPartsDataExcel(file)

    expect(errors).toEqual([])
    expect(rows[0].item_type).toBe('A')
  })

  it('throws when the header does not match the template', async () => {
    const file = createExcelFile([
      ['名称', '规格', '材质', '数量', '采购厂家', '备注'],
      ['毛巾', '', '', '', '', ''],
    ])

    await expect(parseJintanPartsDataExcel(file)).rejects.toThrow(
      '模板表头不匹配',
    )
  })

  it('throws when the sheet has no importable data', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [null, null, null, null, null],
    ])

    await expect(parseJintanPartsDataExcel(file)).rejects.toThrow(
      'Excel 中没有可导入的数据',
    )
  })
})

describe('downloadJintanPartsDataTemplate', () => {
  it('writes the template workbook with all expected headers', () => {
    writeFileMock.mockClear()

    downloadJintanPartsDataTemplate()

    expect(writeFileMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock.mock.calls[0][1]).toBe('金檀木业配件资料模板.xlsx')

    const workbook = writeFileMock.mock.calls[0][0]
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('名称')
    expect(worksheet.E1?.v).toBe('备注')
    expect(worksheet.F1?.v).toBe('类型')
    expect(worksheet.G1?.v).toBe('颜色')
    expect(worksheet.H1?.v).toBe('类别')
  })
})
