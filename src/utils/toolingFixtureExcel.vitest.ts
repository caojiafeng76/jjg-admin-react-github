import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import {
  downloadToolingFixtureTemplate,
  parseToolingFixtureExcel,
} from './toolingFixtureExcel'

const TEMPLATE_HEADERS = [
  '工装模具编号',
  '类别',
  '适用产品图号',
  '产品名称',
  '适用设备',
  '存放位置',
  '制作日期',
  '制作厂商',
  '上次保养日期',
  '保养周期（天）',
  '责任人',
  '备注',
]

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
  XLSX.utils.book_append_sheet(workbook, worksheet, '工装模具总台账')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '工装模具.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseToolingFixtureExcel', () => {
  it('parses rows from a template-style file and normalizes dates and cycles', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['GW001', '滚弯模', '213-354.355', '213-354.355', 'GW-J03', '机器边上', 2024.1, '自制', null, '30天/5000件', '张宏', null],
      ['GW002', '滚弯模', '180-266', '180-266', 'GW-J02', '机器边上', '2026..7', '自制', '2025.8', null, '张宏', '备注'],
      [null, null, null, null, null, null, null, null, null, null, null, null],
    ])

    const { rows, errors } = await parseToolingFixtureExcel(file)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({
      fixture_no: 'GW001',
      category: '滚弯模',
      applicable_product_drawing_no: '213-354.355',
      product_name: '213-354.355',
      applicable_equipment: 'GW-J03',
      storage_location: '机器边上',
      manufactured_date: '2024-01-01',
      manufacturer: '自制',
      lifecycle: '正常',
      last_maintenance_date: null,
      maintenance_cycle_days: 30,
      responsible_person: '张宏',
      remarks: '',
    })
    expect(rows[1].manufactured_date).toBe('2026-07-01')
    expect(rows[1].last_maintenance_date).toBe('2025-08-01')
    expect(rows[1].maintenance_cycle_days).toBeNull()
    expect(rows[1].remarks).toBe('备注')
  })

  it('locates the header row in the original ledger file with instruction rows', async () => {
    const file = createExcelFile([
      [null, '工装模具编号', '类别', '适用产品图号', '产品名称', '适用设备', '存放位置', '数量', '制作日期', '制作厂商', '状态', '上次保养日期', '保养周期', '责任人', '备注'],
      [null, '编码按前面规则：GG001 / CM001', '加工中心工装夹具 / 冲压模具', null, null, null, null, null, null, null, null, null, null, null, null],
      [null, '--- 以下为数据录入区域 ---', null, null, null, null, null, null, null, null, null, null, null, null, null],
      ['序号', '工装模具编号', '类别', '适用产品图号', '产品名称', '适用设备', '存放位置', '数量', '制作日期', '制作厂商', '状态', '上次保养日期', '保养周期', '责任人', '备注'],
      [1, 'GW001', '滚弯模', '213-354.355', '213-354.355', 'GW-J03', '机器边上', 1, 2024.1, '自制', '正常使用', null, null, '张宏', null],
      [2, 'GW002', '滚弯模', '180-266', '180-266', 'GW-J02', '机器边上', 1, '2026..7', '自制', '正常使用', null, '5000件', '张宏', null],
    ])

    const { rows, errors } = await parseToolingFixtureExcel(file)

    expect(errors).toEqual([])
    expect(rows).toHaveLength(2)
    expect(rows[0].fixture_no).toBe('GW001')
    expect(rows[0].manufactured_date).toBe('2024-01-01')
    expect(rows[0].maintenance_cycle_days).toBeNull()
    expect(rows[1].manufactured_date).toBe('2026-07-01')
    expect(rows[1].maintenance_cycle_days).toBe(5000)
  })

  it('treats excel serial numbers as full dates', async () => {
    const serial = 25569 + Date.UTC(2025, 0, 1) / 86400000
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['GW001', null, null, null, null, null, serial, null, null, null, null, null],
    ])

    const { rows } = await parseToolingFixtureExcel(file)

    expect(rows[0].manufactured_date).toBe('2025-01-01')
  })

  it('collects per-row errors for missing numbers, duplicates, and bad dates', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['GW001', null, null, null, null, null, 'not-a-date', null, null, null, null, null],
      [null, '滚弯模', null, null, null, null, null, null, null, null, null, null],
      ['GW001', null, null, null, null, null, null, null, null, 'abc', null, null],
    ])

    const { rows, errors } = await parseToolingFixtureExcel(file)

    expect(rows).toHaveLength(1)
    expect(rows[0].fixture_no).toBe('GW001')
    expect(rows[0].manufactured_date).toBeNull()
    expect(errors).toEqual([
      '第 2 行制作日期格式无效，已置空',
      '第 3 行缺少工装模具编号',
      '第 4 行工装模具编号“GW001”在 Excel 中重复',
    ])
  })

  it('warns on invalid maintenance cycles and keeps valid ones', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      ['GW001', null, null, null, null, null, null, null, null, '每三个月', null, null],
      ['GW002', null, null, null, null, null, null, null, null, '60', null, null],
    ])

    const { rows, errors } = await parseToolingFixtureExcel(file)

    expect(rows[0].maintenance_cycle_days).toBeNull()
    expect(rows[1].maintenance_cycle_days).toBe(60)
    expect(errors).toEqual(['第 2 行保养周期格式无效，已置空'])
  })

  it('throws when the sheet has no importable data', async () => {
    const file = createExcelFile([
      TEMPLATE_HEADERS,
      [null, null, null, null, null, null, null, null, null, null, null, null],
    ])

    await expect(parseToolingFixtureExcel(file)).rejects.toThrow(
      'Excel 中没有可导入的数据',
    )
  })

  it('throws when no header row is found', async () => {
    const file = createExcelFile([
      ['A', 'B', 'C'],
      ['x', 'y', 'z'],
    ])

    await expect(parseToolingFixtureExcel(file)).rejects.toThrow(
      '未找到表头行',
    )
  })
})

describe('downloadToolingFixtureTemplate', () => {
  it('writes the template workbook with all expected headers', () => {
    writeFileMock.mockClear()

    downloadToolingFixtureTemplate()

    expect(writeFileMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock.mock.calls[0][1]).toBe('工装模具导入模板.xlsx')
  })
})
