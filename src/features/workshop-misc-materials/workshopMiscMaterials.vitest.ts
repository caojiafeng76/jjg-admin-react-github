import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { formatWorkshopMiscMaterialLabel } from './display'
import {
  normalizeWorkshopMiscReportStage,
  sumWorkshopMiscReportRows,
} from './MonthlyReport/reportUtils'
import { WORKSHOP_MISC_MATERIALS_PERMISSIONS } from './permissions'
import { workshopMiscMaterialsKeys } from './queryKeys'

function staticImports(path: string): string[] {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  return Array.from(
    // eslint-disable-next-line regexp/no-super-linear-backtracking -- 仅测试用的源码扫描
    source.matchAll(/^import\s+(?!type\b)[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gm),
    match => match[1],
  )
}

describe('车间杂项材料 query key', () => {
  it('筛选值去空格并按固定键序输出，保证缓存键稳定', () => {
    expect(
      workshopMiscMaterialsKeys.data.list({
        page: 1,
        pageSize: 10,
        filters: {
          category: ' 板材 ',
          specification: ' 2mm ',
          model: ' 196-01 ',
          customerModel: ' C-1 ',
        },
      }),
    ).toEqual([
      'workshop-misc-materials-data',
      'list',
      {
        page: 1,
        pageSize: 10,
        filters: {
          model: '196-01',
          customerModel: 'C-1',
          specification: '2mm',
          category: '板材',
        },
      },
    ])
  })

  it('详情库存、下拉选项、调整记录都挂在库存根下，库存失效时一起刷新', () => {
    const root = workshopMiscMaterialsKeys.inventory.all
    expect(workshopMiscMaterialsKeys.inventory.detail('d-1').slice(0, 1)).toEqual(
      root,
    )
    expect(workshopMiscMaterialsKeys.inventory.options(' 196 ')).toEqual([
      ...root,
      'options',
      '196',
    ])
    expect(
      workshopMiscMaterialsKeys.inventory
        .adjustments({ inventoryId: 'i-1', page: 1, pageSize: 10 })
        .slice(0, 1),
    ).toEqual(root)
  })

  it('stock(direction) 返回对应方向的 key 工厂，月报包含月份和维度', () => {
    expect(workshopMiscMaterialsKeys.stock('in')).toBe(
      workshopMiscMaterialsKeys.stockIn,
    )
    expect(workshopMiscMaterialsKeys.stock('out')).toBe(
      workshopMiscMaterialsKeys.stockOut,
    )
    expect(workshopMiscMaterialsKeys.stockIn.all).not.toEqual(
      workshopMiscMaterialsKeys.stockOut.all,
    )
    expect(
      workshopMiscMaterialsKeys.monthlyReport.detail('2026-10', 'semi'),
    ).toEqual(['workshop-misc-materials-monthly-report', 'detail', '2026-10', 'semi'])
  })
})

describe('车间杂项材料权限与工具函数', () => {
  it('包含 1 个导航分组权限和 5 个 PC 页面权限', () => {
    expect(WORKSHOP_MISC_MATERIALS_PERMISSIONS.map(item => item.key)).toEqual([
      'nav:workshop-misc-materials',
      'page:workshop-misc-materials-data',
      'page:workshop-misc-materials-stock-in',
      'page:workshop-misc-materials-stock-out',
      'page:workshop-misc-materials-inventory',
      'page:workshop-misc-materials-monthly-report',
    ])
  })

  it('展示标签、月报维度归一化与汇总计算', () => {
    expect(
      formatWorkshopMiscMaterialLabel({
        model: '196-01',
        customer_model: 'C-196',
        specification: '2mm',
        category: '铝材',
      }),
    ).toBe('196-01 / C-196 / 2mm（铝材）')
    expect(formatWorkshopMiscMaterialLabel({ model: '267-01' })).toBe(
      '267-01 / 无客户型号 / 无规格',
    )

    expect(normalizeWorkshopMiscReportStage('raw')).toBe('raw')
    expect(normalizeWorkshopMiscReportStage('unknown')).toBe('total')

    expect(
      sumWorkshopMiscReportRows([
        {
          inventory_id: 'i-1',
          model: '196-01',
          customer_model: '',
          specification: '',
          category: '',
          opening_quantity: 10,
          stock_in_quantity: 5,
          stock_out_quantity: 3,
          stock_adjust_quantity: -1,
          closing_quantity: 11,
          current_quantity: 11,
        },
        {
          inventory_id: 'i-2',
          model: '267-01',
          customer_model: '',
          specification: '',
          category: '',
          opening_quantity: 20,
          stock_in_quantity: 4,
          stock_out_quantity: 6,
          stock_adjust_quantity: 2,
          closing_quantity: 20,
          current_quantity: 20,
        },
      ]),
    ).toEqual([30, 9, 9, 1, 31])
  })
})

describe('车间杂项材料页面不静态加载 Excel 工具', () => {
  it.each([
    'src/features/workshop-misc-materials/Data/index.tsx',
    'src/features/workshop-misc-materials/Inventory/index.tsx',
    'src/features/workshop-misc-materials/MonthlyReport/index.tsx',
  ])('%s', (file) => {
    const imports = staticImports(file)
    expect(imports).not.toContain('@/utils/workshopMiscMaterialsExcel')
    expect(imports).not.toContain('xlsx-js-style')
  })
})
