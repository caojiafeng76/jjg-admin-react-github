import { describe, expect, it, vi } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import {
  createSyneyMaterialsReportSheet,
  parseSyneyMaterialsDataExcel,
  parseSyneyMaterialsInventoryExcel,
  SYNEY_MATERIALS_DATA_TEMPLATE_HEADERS,
  SYNEY_MATERIALS_INVENTORY_TEMPLATE_HEADERS,
} from './syneyMaterialsExcel'

const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const xlsx = (actual.default ?? actual) as typeof import('xlsx-js-style')
  return {
    ...actual,
    ...xlsx,
    default: { ...xlsx, writeFile: writeFileMock },
    writeFile: writeFileMock,
  }
})

function createExcelFile(rows: Array<Array<unknown>>): File {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return new File([buffer], '材料.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseSyneyMaterialsDataExcel', () => {
  it('解析有效行，跳过空行，报告缺品名、缺单位、重复行', async () => {
    const file = createExcelFile([
      [...SYNEY_MATERIALS_DATA_TEMPLATE_HEADERS],
      [' 钢板 ', '2mm', '张', '常用'],
      ['', '', '', ''],
      ['', '3mm', '张', ''],
      ['螺栓', 'M8', '', ''],
      ['钢板', '2mm', '张', '重复'],
      ['螺栓', '', '个', ''],
    ])

    const { rows, errors } = await parseSyneyMaterialsDataExcel(file)

    expect(rows).toEqual([
      { material_name: '钢板', specification: '2mm', unit: '张', remarks: '常用' },
      { material_name: '螺栓', specification: '', unit: '个', remarks: '' },
    ])
    expect(errors).toEqual([
      '第 4 行缺少品名',
      '第 5 行缺少单位',
      '第 6 行品名“钢板”规格“2mm”在 Excel 中重复',
    ])
  })

  it('表头不匹配时整体拒绝', async () => {
    const file = createExcelFile([['名称', '规格', '单位', '备注']])
    await expect(parseSyneyMaterialsDataExcel(file)).rejects.toThrow('模板表头不匹配')
  })

  it('没有数据行时报错', async () => {
    const file = createExcelFile([[...SYNEY_MATERIALS_DATA_TEMPLATE_HEADERS]])
    await expect(parseSyneyMaterialsDataExcel(file)).rejects.toThrow('Excel 中没有可导入的数据')
  })
})

describe('parseSyneyMaterialsInventoryExcel', () => {
  it('数量必须为非负整数', async () => {
    const file = createExcelFile([
      [...SYNEY_MATERIALS_INVENTORY_TEMPLATE_HEADERS],
      ['钢板', '2mm', 10, ''],
      ['钢板', '3mm', 0, '清空'],
      ['螺栓', 'M8', 1.5, ''],
      ['螺母', 'M8', -1, ''],
      ['垫片', 'M8', '', ''],
    ])

    const { rows, errors } = await parseSyneyMaterialsInventoryExcel(file)

    expect(rows).toEqual([
      { material_name: '钢板', specification: '2mm', quantity: 10, remarks: '' },
      { material_name: '钢板', specification: '3mm', quantity: 0, remarks: '清空' },
    ])
    expect(errors).toEqual([
      '第 4 行库存数量必须为非负整数',
      '第 5 行库存数量必须为非负整数',
      '第 6 行库存数量必须为非负整数',
    ])
  })
})

describe('createSyneyMaterialsReportSheet', () => {
  it('标题带月份，末行合计各数量列', () => {
    const sheet = createSyneyMaterialsReportSheet(
      [
        {
          inventory_id: 'i-1',
          material_name: '钢板',
          specification: '2mm',
          unit: '张',
          opening_quantity: 10,
          stock_in_quantity: 5,
          stock_out_quantity: 3,
          stock_adjust_quantity: -1,
          closing_quantity: 11,
          current_quantity: 11,
        },
        {
          inventory_id: 'i-2',
          material_name: '螺栓',
          specification: 'M8',
          unit: '个',
          opening_quantity: 100,
          stock_in_quantity: 0,
          stock_out_quantity: 20,
          stock_adjust_quantity: 0,
          closing_quantity: 80,
          current_quantity: 80,
        },
      ],
      '2026-10',
    )

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' })
    expect(rows[0][0]).toBe('西尼材料月度库存报表（2026年10月）')
    expect(rows[1]).toEqual(['#', '品名', '规格', '单位', '上月结余', '本月入库', '本月出库', '本月调整', '月末结存'])
    expect(rows[2]).toEqual([1, '钢板', '2mm', '张', 10, 5, 3, -1, 11])
    expect(rows[4]).toEqual(['合计', '', '', '', 110, 5, 23, -1, 91])
  })
})
