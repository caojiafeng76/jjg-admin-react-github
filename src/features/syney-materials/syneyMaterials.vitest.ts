import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { syneyMaterialsKeys } from './queryKeys'

function staticImports(path: string): string[] {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  return Array.from(
    // eslint-disable-next-line regexp/no-super-linear-backtracking -- 仅测试用的源码扫描
    source.matchAll(/^import\s+(?!type\b)[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gm),
    match => match[1],
  )
}

describe('西尼材料 query key', () => {
  it('筛选值去空格并按固定键序输出，保证缓存键稳定', () => {
    expect(
      syneyMaterialsKeys.data.list({
        page: 1,
        pageSize: 10,
        filters: { specification: ' 10mm ', name: '  钢板 ' },
      }),
    ).toEqual([
      'syney-materials-data',
      'list',
      { page: 1, pageSize: 10, filters: { name: '钢板', specification: '10mm' } },
    ])
  })

  it('详情库存、下拉选项、调整记录都挂在库存根下，库存失效时一起刷新', () => {
    const root = syneyMaterialsKeys.inventory.all
    expect(syneyMaterialsKeys.inventory.detail('d-1').slice(0, 1)).toEqual(root)
    expect(syneyMaterialsKeys.inventory.options(' 钢 ')).toEqual([...root, 'options', '钢'])
    expect(
      syneyMaterialsKeys.inventory
        .adjustments({ inventoryId: 'i-1', page: 1, pageSize: 10 })
        .slice(0, 1),
    ).toEqual(root)
  })

  it('stock(direction) 返回对应方向的 key 工厂', () => {
    expect(syneyMaterialsKeys.stock('in')).toBe(syneyMaterialsKeys.stockIn)
    expect(syneyMaterialsKeys.stock('out')).toBe(syneyMaterialsKeys.stockOut)
    expect(syneyMaterialsKeys.stockIn.all).not.toEqual(syneyMaterialsKeys.stockOut.all)
  })
})

describe('西尼材料页面不静态加载 Excel 工具', () => {
  it.each([
    'src/features/syney-materials/Data/index.tsx',
    'src/features/syney-materials/Inventory/index.tsx',
    'src/features/syney-materials/MonthlyReport/index.tsx',
    'src/features/syney-materials/SyneyMaterialsExcelImport.tsx',
  ])('%s', (file) => {
    const imports = staticImports(file)
    expect(imports).not.toContain('@/utils/syneyMaterialsExcel')
    expect(imports).not.toContain('xlsx-js-style')
  })
})
