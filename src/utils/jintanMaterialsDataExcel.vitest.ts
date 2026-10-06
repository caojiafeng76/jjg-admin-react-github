import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { JintanMaterialsData } from '@/services/apiJintanMaterialsData'
import {
  createJintanMaterialsDataExportWorkbook,
  downloadJintanMaterialsDataTemplate,
  parseJintanMaterialsDataExcel,
} from './jintanMaterialsDataExcel'

const TEMPLATE_HEADERS = ['型号', '名称', '规格', '材质', '备注']

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
  XLSX.utils.book_append_sheet(workbook, worksheet, '素材资料导入模板')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '素材资料.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('createJintanMaterialsDataExportWorkbook', () => {
  it('exports all profile fields into a merged-title worksheet', () => {
    const workbook = createJintanMaterialsDataExportWorkbook([
      {
        id: 'material-1',
        material_model: 'YDJ222-166-1',
        material_name: '120*120立柱',
        specification: '2000',
        material: '6063铝合金',
        remarks: '',
        created_at: '2026-10-05T08:00:00',
        updated_at: '2026-10-05T09:30:00',
      },
    ] satisfies JintanMaterialsData[])

    expect(workbook.SheetNames[0]).toBe('素材资料')

    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('金檀木业素材资料')
    expect(worksheet.A2?.v).toBe('#')
    expect(worksheet.B2?.v).toBe('型号')
    expect(worksheet.B3?.v).toBe('YDJ222-166-1')
    expect(worksheet.C3?.v).toBe('120*120立柱')
    expect(worksheet.D3?.v).toBe('2000')
    expect(worksheet.E3?.v).toBe('6063铝合金')
    expect(worksheet.G3?.v).toBe('2026-10-05 09:30')
    expect(worksheet['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    ])
  })
})

describe('parseJintanMaterialsDataExcel', () => {
  it('parses template rows and trims text', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [' YDJ222-166-1 ', ' 120*120立柱 ', ' 2000 ', ' 6063铝合金 ', ' 备注 '],
      ['', '叶片封盖左1', '', '6063铝合金', ''],
    ])

    const { rows, errors } = await parseJintanMaterialsDataExcel(file)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      material_model: 'YDJ222-166-1',
      material_name: '120*120立柱',
      specification: '2000',
      material: '6063铝合金',
      remarks: '备注',
    })
    expect(rows[1]).toEqual({
      material_model: '',
      material_name: '叶片封盖左1',
      specification: '',
      material: '6063铝合金',
      remarks: '',
    })
  })

  it('skips empty rows and reports missing names and excel duplicates', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['', '120*120立柱', '', '', ''],
      [null, null, null, null, null],
      ['YDJ222-166-1', '', '2000', '', ''],
      ['', '120*120立柱', '', '', ''],
    ])

    const { rows, errors } = await parseJintanMaterialsDataExcel(file)

    expect(rows).toHaveLength(1)
    expect(rows[0].material_name).toBe('120*120立柱')
    expect(errors).toEqual([
      '第 4 行缺少名称',
      '第 5 行型号“”名称“120*120立柱”规格“”在 Excel 中重复',
    ])
  })

  it('throws when the header does not match the template', async () => {
    const file = createExcelFile([
      ['名称', '型号', '规格', '材质', '备注'],
      ['120*120立柱', 'YDJ222-166-1', '', '', ''],
    ])

    await expect(parseJintanMaterialsDataExcel(file)).rejects.toThrow(
      '模板表头不匹配',
    )
  })

  it('throws when the sheet has no importable data', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [null, null, null, null, null],
    ])

    await expect(parseJintanMaterialsDataExcel(file)).rejects.toThrow(
      'Excel 中没有可导入的数据',
    )
  })
})

describe('downloadJintanMaterialsDataTemplate', () => {
  it('writes the template workbook with all expected headers', () => {
    writeFileMock.mockClear()

    downloadJintanMaterialsDataTemplate()

    expect(writeFileMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock.mock.calls[0][1]).toBe('金檀木业素材资料模板.xlsx')

    const workbook = writeFileMock.mock.calls[0][0]
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    expect(worksheet.A1?.v).toBe('型号')
    expect(worksheet.E1?.v).toBe('备注')
  })
})
