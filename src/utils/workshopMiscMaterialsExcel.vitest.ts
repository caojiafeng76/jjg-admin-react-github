import { describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import {
  createWorkshopMiscMaterialsDataWorkbook,
  createWorkshopMiscMaterialsInventoryWorkbook,
  createWorkshopMiscMaterialsReportWorkbook,
  extractWorkshopMiscModelPrefix,
  groupWorkshopMiscItemsByModelPrefix,
  parseWorkshopMiscMaterialsDataExcel,
  parseWorkshopMiscMaterialsInventoryExcel,
  WORKSHOP_MISC_MATERIALS_DATA_TEMPLATE_HEADERS,
  WORKSHOP_MISC_MATERIALS_INVENTORY_TEMPLATE_HEADERS,
} from './workshopMiscMaterialsExcel'

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
  return new File([buffer], '车间杂项材料.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('extractWorkshopMiscModelPrefix & groupWorkshopMiscItemsByModelPrefix', () => {
  it('按第一个横杠提取前缀（支持全角横杠），不含横杠归入「其他」', () => {
    expect(extractWorkshopMiscModelPrefix('196-A01')).toBe('196-')
    expect(extractWorkshopMiscModelPrefix('267-001-L')).toBe('267-')
    expect(extractWorkshopMiscModelPrefix(' 196－B02 ')).toBe('196-')
    expect(extractWorkshopMiscModelPrefix('ABC100')).toBe('其他')
    expect(extractWorkshopMiscModelPrefix('-ABC')).toBe('其他')
    expect(extractWorkshopMiscModelPrefix('')).toBe('其他')
  })

  it('自然排序前缀且「其他」排在最后，并处理重名/非法字符/31字符截断', () => {
    const groups = groupWorkshopMiscItemsByModelPrefix([
      { model: '无横杠型号' },
      { model: '1000-01' },
      { model: '267-02' },
      { model: '196-01' },
      { model: '196-02' },
      { model: 'abc-1' },
      { model: 'ABC-2' },
      { model: 'A/B:C-1' },
      { model: `${'X'.repeat(35)}-1` },
    ])

    expect(groups.map(item => item.sheetName)).toEqual([
      '196-',
      '267-',
      '1000-',
      'A_B_C-',
      'ABC-',
      'abc-(2)',
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      '其他',
    ])
    expect(groups[0]?.items).toHaveLength(2)
    expect(groups.at(-1)?.group).toBe('其他')
    for (const item of groups) {
      expect(item.sheetName.length).toBeLessThanOrEqual(31)
    }
  })
})

describe('parseWorkshopMiscMaterialsDataExcel', () => {
  it('解析有效行，跳过空行，报告缺型号与四元组重复', async () => {
    const file = createExcelFile([
      [...WORKSHOP_MISC_MATERIALS_DATA_TEMPLATE_HEADERS],
      [' 196-001 ', ' C-196 ', ' 2mm ', ' 铝材 ', ' 常用 '],
      ['', '', '', '', ''],
      ['', 'C-2', '3mm', '五金', ''],
      ['196-001', 'C-196', '2mm', '铝材', '重复'],
      ['267-001', '', '', '', ''],
    ])

    const { rows, errors } = await parseWorkshopMiscMaterialsDataExcel(file)

    expect(rows).toEqual([
      {
        model: '196-001',
        customer_model: 'C-196',
        specification: '2mm',
        category: '铝材',
        remarks: '常用',
      },
      {
        model: '267-001',
        customer_model: '',
        specification: '',
        category: '',
        remarks: '',
      },
    ])
    expect(errors).toEqual([
      '第 4 行缺少型号',
      '第 5 行型号“196-001”客户型号“C-196”规格“2mm”类别“铝材”在 Excel 中重复',
    ])
  })

  it('表头不匹配或无数据行时拒绝', async () => {
    await expect(
      parseWorkshopMiscMaterialsDataExcel(
        createExcelFile([['品名', '规格', '单位', '备注']]),
      ),
    ).rejects.toThrow('模板表头不匹配')

    await expect(
      parseWorkshopMiscMaterialsDataExcel(
        createExcelFile([[...WORKSHOP_MISC_MATERIALS_DATA_TEMPLATE_HEADERS]]),
      ),
    ).rejects.toThrow('Excel 中没有可导入的数据')
  })
})

describe('parseWorkshopMiscMaterialsInventoryExcel', () => {
  it('校验三项数量（非负整数，局部留空视为0，全空报错）', async () => {
    const file = createExcelFile([
      [...WORKSHOP_MISC_MATERIALS_INVENTORY_TEMPLATE_HEADERS],
      ['196-001', 'C-1', '2mm', '五金', 10, 5, 2, '完整'],
      ['267-001', '', '', '', 8, '', '', '仅填原材料'],
      ['267-002', '', '', '', 0, 0, 0, '全清零'],
      ['267-003', '', '', '', '', '', '', '全空'],
      ['267-004', '', '', '', 1.5, 0, 0, '小数'],
      ['267-005', '', '', '', 0, -1, 0, '负数'],
    ])

    const { rows, errors } = await parseWorkshopMiscMaterialsInventoryExcel(file)

    expect(rows).toEqual([
      {
        model: '196-001',
        customer_model: 'C-1',
        specification: '2mm',
        category: '五金',
        raw_material_quantity: 10,
        semi_finished_quantity: 5,
        finished_quantity: 2,
        remarks: '完整',
      },
      {
        model: '267-001',
        customer_model: '',
        specification: '',
        category: '',
        raw_material_quantity: 8,
        semi_finished_quantity: 0,
        finished_quantity: 0,
        remarks: '仅填原材料',
      },
      {
        model: '267-002',
        customer_model: '',
        specification: '',
        category: '',
        raw_material_quantity: 0,
        semi_finished_quantity: 0,
        finished_quantity: 0,
        remarks: '全清零',
      },
    ])
    expect(errors).toEqual([
      '第 5 行请至少填写一项库存数量（清零请填 0）',
      '第 6 行原材料数量必须为非负整数',
      '第 7 行半成品数量必须为非负整数',
    ])
  })
})

describe('多工作表按型号开头分表导出', () => {
  it('材料资料按型号开头拆分工作表，不建总表，每表独立编号和本组小计', () => {
    const wb = createWorkshopMiscMaterialsDataWorkbook([
      {
        id: 'd-3',
        model: '通用垫片',
        customer_model: '',
        specification: 'M8',
        category: '辅料',
        remarks: '',
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'd-2',
        model: '267-B01',
        customer_model: 'C-267',
        specification: '3mm',
        category: '型材',
        remarks: '',
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'd-1',
        model: '196-A01',
        customer_model: 'C-196',
        specification: '2mm',
        category: '板材',
        remarks: '常用',
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
    ])

    expect(wb.SheetNames).toEqual(['196-', '267-', '其他'])
    const sheet196 = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['196-'], {
      header: 1,
      defval: '',
    })
    expect(sheet196[0][0]).toBe('车间杂项材料资料（196-）')
    expect(sheet196[1]).toEqual([
      '#',
      '型号',
      '客户型号',
      '规格',
      '类别',
      '备注',
      '更新时间',
    ])
    expect(sheet196[2].slice(0, 6)).toEqual([
      1,
      '196-A01',
      'C-196',
      '2mm',
      '板材',
      '常用',
    ])
    expect(sheet196[3][0]).toBe('小计')
    expect(sheet196[3][1]).toBe('共 1 条')
  })

  it('材料库存按型号开头拆分工作表，每表按业务字段顺序导出并附本组数量小计', () => {
    const wb = createWorkshopMiscMaterialsInventoryWorkbook([
      {
        id: 'i-1',
        material_data_id: 'd-1',
        model: '196-A01',
        customer_model: 'C-196',
        specification: '2mm',
        category: '板材',
        raw_material_quantity: 10,
        semi_finished_quantity: 5,
        finished_quantity: 2,
        total_quantity: 17,
        remarks: '',
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'i-2',
        material_data_id: 'd-2',
        model: '196-A02',
        customer_model: '',
        specification: '3mm',
        category: '板材',
        raw_material_quantity: 4,
        semi_finished_quantity: 6,
        finished_quantity: 10,
        total_quantity: 20,
        remarks: '',
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
      {
        id: 'i-3',
        material_data_id: 'd-3',
        model: '无横杠',
        customer_model: '',
        specification: '',
        category: '辅料',
        raw_material_quantity: 1,
        semi_finished_quantity: 0,
        finished_quantity: 2,
        total_quantity: 3,
        remarks: '',
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T00:00:00.000Z',
      },
    ])

    expect(wb.SheetNames).toEqual(['196-', '其他'])
    const sheet196 = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['196-'], {
      header: 1,
      defval: '',
    })
    expect(sheet196[0][0]).toBe('车间杂项材料库存（196-）')
    expect(sheet196[1]).toEqual([
      '#',
      '型号',
      '客户型号',
      '规格',
      '原材料数量',
      '半成品数量',
      '成品数量',
      '合计',
      '类别',
      '备注',
      '更新时间',
    ])
    expect(sheet196[2].slice(0, 10)).toEqual([
      1,
      '196-A01',
      'C-196',
      '2mm',
      10,
      5,
      2,
      17,
      '板材',
      '',
    ])
    expect(sheet196[3][0]).toBe(2)
    expect(sheet196[4]).toEqual(['小计', '', '', '', 14, 11, 12, 37, '', '', ''])

    const sheetOther = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['其他'], {
      header: 1,
      defval: '',
    })
    expect(sheetOther[2][0]).toBe(1)
    expect(sheetOther[3]).toEqual(['小计', '', '', '', 1, 0, 2, 3, '', '', ''])
  })

  it('月度报表按型号开头拆分工作表，标题带月份/维度/类别并附本组小计', () => {
    const wb = createWorkshopMiscMaterialsReportWorkbook(
      [
        {
          inventory_id: 'i-1',
          model: '196-A01',
          customer_model: 'C-196',
          specification: '2mm',
          category: '板材',
          opening_quantity: 10,
          stock_in_quantity: 5,
          stock_out_quantity: 3,
          stock_adjust_quantity: -1,
          closing_quantity: 11,
          current_quantity: 11,
        },
        {
          inventory_id: 'i-2',
          model: '267-B01',
          customer_model: '',
          specification: 'M8',
          category: '板材',
          opening_quantity: 100,
          stock_in_quantity: 0,
          stock_out_quantity: 20,
          stock_adjust_quantity: 0,
          closing_quantity: 80,
          current_quantity: 80,
        },
      ],
      { month: '2026-10', stage: 'raw', category: '板材' },
    )

    expect(wb.SheetNames).toEqual(['196-', '267-'])
    const sheet196 = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['196-'], {
      header: 1,
      defval: '',
    })
    expect(sheet196[0][0]).toBe(
      '车间杂项材料月度库存报表（2026年10月 · 原材料 · 板材 · 196-）',
    )
    expect(sheet196[1]).toEqual([
      '#',
      '型号',
      '客户型号',
      '规格',
      '类别',
      '上月结余',
      '本月入库',
      '本月出库',
      '本月调整',
      '月末结存',
    ])
    expect(sheet196[2]).toEqual([1, '196-A01', 'C-196', '2mm', '板材', 10, 5, 3, -1, 11])
    expect(sheet196[3]).toEqual(['小计', '', '', '', '', 10, 5, 3, -1, 11])
  })
})
