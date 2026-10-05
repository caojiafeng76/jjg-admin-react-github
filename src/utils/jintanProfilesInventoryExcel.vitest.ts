import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { JintanProfilesInventory } from '@/services/apiJintanProfilesInventory'
import {
  createJintanProfilesInventoryExportWorkbook,
  downloadJintanProfilesInventoryTemplate,
  parseJintanProfilesInventoryExcel,
} from './jintanProfilesInventoryExcel'

const TEMPLATE_HEADERS = ['型号', '名称', '规格', '库存数量', '备注']

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
  XLSX.utils.book_append_sheet(workbook, worksheet, '型材库存导入模板')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '型材库存.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('createJintanProfilesInventoryExportWorkbook', () => {
  it('exports all inventory fields into a merged-title worksheet', () => {
    const workbook = createJintanProfilesInventoryExportWorkbook([
      {
        id: 'inventory-1',
        profile_data_id: 'profile-1',
        profile_model: 'YDJ222-166-1',
        profile_name: '120*120立柱',
        specification: '2000',
        material: '6063铝合金',
        quantity: 120,
        remarks: '常用',
        created_at: '2026-10-05T08:00:00',
        updated_at: '2026-10-05T09:30:00',
      },
    ] satisfies JintanProfilesInventory[])

    expect(workbook.SheetNames[0]).toBe('型材库存')

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('金檀木业型材库存')
    expect(worksheet.A2?.v).toBe('#')
    expect(worksheet.B2?.v).toBe('型号')
    expect(worksheet.B3?.v).toBe('YDJ222-166-1')
    expect(worksheet.C3?.v).toBe('120*120立柱')
    expect(worksheet.D3?.v).toBe('2000')
    expect(worksheet.E3?.v).toBe('6063铝合金')
    expect(worksheet.F3?.v).toBe(120)
    expect(worksheet.G3?.v).toBe('常用')
    expect(worksheet.H3?.v).toBe('2026-10-05 09:30')
    expect(worksheet['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    ])
  })
})

describe('parseJintanProfilesInventoryExcel', () => {
  it('parses template rows, trims text and converts quantities', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [' YDJ222-166-1 ', ' 120*120立柱 ', ' 2000 ', 120, ' 常用 '],
      ['', '叶片封盖左1', '', '0', ''],
    ])

    const { rows, errors } = await parseJintanProfilesInventoryExcel(file)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      profile_model: 'YDJ222-166-1',
      profile_name: '120*120立柱',
      specification: '2000',
      quantity: 120,
      remarks: '常用',
    })
    expect(rows[1]).toEqual({
      profile_model: '',
      profile_name: '叶片封盖左1',
      specification: '',
      quantity: 0,
      remarks: '',
    })
  })

  it('accepts numeric quantity text and rejects invalid quantities', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['YDJ222-166-1', '立柱', '2000', ' 12 ', ''],
      ['', '封盖', '', '4.5', ''],
      ['', '盖板', '', '', ''],
      ['', '角码', '', '-3', ''],
    ])

    const { rows, errors } = await parseJintanProfilesInventoryExcel(file)

    expect(rows).toEqual([
      {
        profile_model: 'YDJ222-166-1',
        profile_name: '立柱',
        specification: '2000',
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
      ['', '立柱', '2000', '1', ''],
      [null, null, null, null, null],
      ['', null, '2000', '1', ''],
      ['', '立柱', '2000', '2', ''],
    ])

    const { rows, errors } = await parseJintanProfilesInventoryExcel(file)

    expect(rows).toHaveLength(1)
    expect(rows[0].profile_name).toBe('立柱')
    expect(errors).toEqual([
      '第 4 行缺少名称',
      '第 5 行型号“”名称“立柱”规格“2000”在 Excel 中重复',
    ])
  })

  it('throws when the header does not match the template', async () => {
    const file = createExcelFile([
      ['名称', '型号', '规格', '库存数量', '备注'],
      ['立柱', 'YDJ222-166-1', '2000', '1', ''],
    ])

    await expect(parseJintanProfilesInventoryExcel(file)).rejects.toThrow(
      '模板表头不匹配',
    )
  })

  it('throws when the sheet has no importable data', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [null, null, null, null, null],
    ])

    await expect(parseJintanProfilesInventoryExcel(file)).rejects.toThrow(
      'Excel 中没有可导入的数据',
    )
  })
})

describe('downloadJintanProfilesInventoryTemplate', () => {
  it('writes the template workbook with all expected headers', () => {
    writeFileMock.mockClear()

    downloadJintanProfilesInventoryTemplate()

    expect(writeFileMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock.mock.calls[0][1]).toBe('金檀木业型材库存模板.xlsx')

    const workbook = writeFileMock.mock.calls[0][0]
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('型号')
    expect(worksheet.B1?.v).toBe('名称')
    expect(worksheet.C1?.v).toBe('规格')
    expect(worksheet.D1?.v).toBe('库存数量')
    expect(worksheet.E1?.v).toBe('备注')
  })
})
