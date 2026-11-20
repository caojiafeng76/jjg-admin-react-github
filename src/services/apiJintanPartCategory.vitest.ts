import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createJintanPartsDataBatch } from './apiJintanPartsData'
import { createJintanPartsInventoryBatch } from './apiJintanPartsInventory'
import {
  getJintanPartSheetGroups,
  parseJintanPartCategory,
} from './jintanPartCategory'

const db = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
  inserted: [] as unknown[],
  upserted: [] as unknown[],
}))

vi.mock('./publicSupabase', () => ({ default: {} }))
vi.mock('./supabase', () => ({
  default: {
    from() {
      return {
        select() {
          return {
            in: () => Promise.resolve({ data: db.rows, error: null }),
          }
        },
        insert(payload: unknown) {
          db.inserted.push(payload)
          return Promise.resolve({ error: null })
        },
        upsert(payload: unknown) {
          db.upserted.push(payload)
          return Promise.resolve({ error: null })
        },
      }
    },
  },
}))

beforeEach(() => {
  db.rows = []
  db.inserted = []
  db.upserted = []
})

describe('parseJintanPartCategory', () => {
  it.each([
    ['140U', '140U'],
    [' 140u ', '140U'],
    ['220U', '220U'],
    [' 220u ', '220U'],
    ['通用', '通用'],
    [' 通用 ', '通用'],
    ['300U', null],
    ['', null],
    [null, null],
  ])('解析 %s', (value, expected) => {
    expect(parseJintanPartCategory(value)).toBe(expected)
  })
})

describe('getJintanPartSheetGroups', () => {
  it('默认生成 140U-A/B、220U-A/B、通用-A/B 共 6 个分组', () => {
    expect(getJintanPartSheetGroups().map(group => group.label)).toEqual([
      '140U-A',
      '140U-B',
      '220U-A',
      '220U-B',
      '通用-A',
      '通用-B',
    ])
  })

  it('按类别和类型筛选生成子集分组', () => {
    expect(
      getJintanPartSheetGroups({ partCategory: '140U' }).map(group => group.label),
    ).toEqual(['140U-A', '140U-B'])
    expect(
      getJintanPartSheetGroups({ itemType: 'B' }).map(group => group.label),
    ).toEqual(['140U-B', '220U-B', '通用-B'])
    expect(
      getJintanPartSheetGroups({ partCategory: '220U', itemType: 'A' }).map(group => group.label),
    ).toEqual(['220U-A'])
  })
})

describe('配件资料批量导入按类别判重', () => {
  it('已有「通用」时可导入同类型同名称同规格的 140U，重复的「通用」被拒绝', async () => {
    db.rows = [
      {
        part_category: '通用',
        item_type: 'A',
        part_name: '螺钉',
        specification: 'M6',
        color: '',
      },
    ]
    const row = {
      item_type: 'A' as const,
      part_name: '螺钉',
      specification: 'M6',
      color: '',
      material: '',
      supplier: '',
      remarks: '',
    }

    await createJintanPartsDataBatch([{ ...row, part_category: '140U' }])
    expect(db.inserted).toEqual([[expect.objectContaining({ part_category: '140U' })]])

    await expect(
      createJintanPartsDataBatch([{ ...row, part_category: '通用' }]),
    ).rejects.toThrow('“通用”/“A”/“螺钉”/“M6”')
    expect(db.inserted).toHaveLength(1)
  })
})

describe('配件库存导入按类别匹配', () => {
  const inventoryRow = (id: string, partCategory: string) => ({
    id,
    part_data_id: `data-${id}`,
    part_category: partCategory,
    item_type: 'A',
    part_name: '螺钉',
    specification: 'M6',
    color: '',
    material: 'SUS304',
    supplier: '',
  })
  const importRow = (partCategory: '140U' | '220U' | '通用', quantity: number) => ({
    part_category: partCategory,
    item_type: 'A' as const,
    part_name: '螺钉',
    specification: 'M6',
    color: '',
    quantity,
    remarks: '',
  })

  it('同名称规格的不同类别各自写入对应库存行', async () => {
    db.rows = [inventoryRow('inv-140u', '140U'), inventoryRow('inv-common', '通用')]

    await createJintanPartsInventoryBatch([
      importRow('140U', 9),
      importRow('通用', 4),
    ])

    expect(db.upserted[0]).toEqual([
      expect.objectContaining({ id: 'inv-140u', part_category: '140U', quantity: 9 }),
      expect.objectContaining({ id: 'inv-common', part_category: '通用', quantity: 4 }),
    ])
  })

  it('只有「通用」库存时，导入 220U 行报资料不存在，不写入「通用」', async () => {
    db.rows = [inventoryRow('inv-common', '通用')]

    await expect(
      createJintanPartsInventoryBatch([importRow('220U', 5)]),
    ).rejects.toThrow('“220U”/“A”/“螺钉”/“M6”')
    expect(db.upserted).toEqual([])
  })
})
