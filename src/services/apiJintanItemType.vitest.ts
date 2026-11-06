import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createJintanMaterialsDataBatch,
} from './apiJintanMaterialsData'
import { createJintanMaterialsInventoryBatch } from './apiJintanMaterialsInventory'
import { createJintanPartsDataBatch } from './apiJintanPartsData'
import { createJintanPartsInventoryBatch } from './apiJintanPartsInventory'
import { createJintanProfilesDataBatch } from './apiJintanProfilesData'
import { createJintanProfilesInventoryBatch } from './apiJintanProfilesInventory'
import { parseJintanItemType } from './jintanItemType'

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

describe('parseJintanItemType', () => {
  it.each([
    ['A', 'A'],
    ['B', 'B'],
    [' b ', 'B'],
    ['a', 'A'],
    ['C', null],
    ['', null],
    [null, null],
  ])('解析 %s', (value, expected) => {
    expect(parseJintanItemType(value)).toBe(expected)
  })
})

describe('素材库存导入按类型匹配', () => {
  const inventoryRow = (id: string, itemType: string) => ({
    id,
    material_data_id: `data-${id}`,
    item_type: itemType,
    material_model: 'M1',
    material_name: '立柱',
    specification: '2000',
    material: '6063',
  })
  const importRow = (itemType: 'A' | 'B', quantity: number) => ({
    item_type: itemType,
    material_model: 'M1',
    material_name: '立柱',
    specification: '2000',
    quantity,
    remarks: '',
  })

  it('同型号名称规格的 A、B 各自写入对应库存行', async () => {
    db.rows = [inventoryRow('inv-a', 'A'), inventoryRow('inv-b', 'B')]

    await createJintanMaterialsInventoryBatch([
      importRow('B', 7),
      importRow('A', 3),
    ])

    expect(db.upserted[0]).toEqual([
      expect.objectContaining({ id: 'inv-b', item_type: 'B', quantity: 7 }),
      expect.objectContaining({ id: 'inv-a', item_type: 'A', quantity: 3 }),
    ])
  })

  it('只有 A 库存时，导入 B 行报资料不存在，不写入 A', async () => {
    db.rows = [inventoryRow('inv-a', 'A')]

    await expect(
      createJintanMaterialsInventoryBatch([importRow('B', 7)]),
    ).rejects.toThrow('“B”/“M1”/“立柱”/“2000”')
    expect(db.upserted).toEqual([])
  })
})

describe('型材库存导入按类型匹配', () => {
  const inventoryRow = (id: string, itemType: string) => ({
    id,
    profile_data_id: `data-${id}`,
    item_type: itemType,
    profile_model: 'M1',
    profile_name: '立柱',
    specification: '2000',
    material: '6063',
  })
  const importRow = (itemType: 'A' | 'B', quantity: number) => ({
    item_type: itemType,
    profile_model: 'M1',
    profile_name: '立柱',
    specification: '2000',
    quantity,
    remarks: '',
  })

  it('同型号名称规格的 A、B 各自写入对应库存行', async () => {
    db.rows = [inventoryRow('inv-a', 'A'), inventoryRow('inv-b', 'B')]

    await createJintanProfilesInventoryBatch([
      importRow('B', 7),
      importRow('A', 3),
    ])

    expect(db.upserted[0]).toEqual([
      expect.objectContaining({ id: 'inv-b', item_type: 'B', quantity: 7 }),
      expect.objectContaining({ id: 'inv-a', item_type: 'A', quantity: 3 }),
    ])
  })

  it('只有 A 库存时，导入 B 行报资料不存在，不写入 A', async () => {
    db.rows = [inventoryRow('inv-a', 'A')]

    await expect(
      createJintanProfilesInventoryBatch([importRow('B', 7)]),
    ).rejects.toThrow('“B”/“M1”/“立柱”/“2000”')
    expect(db.upserted).toEqual([])
  })
})

describe('配件库存导入按类型匹配', () => {
  const inventoryRow = (id: string, itemType: string) => ({
    id,
    part_data_id: `data-${id}`,
    item_type: itemType,
    part_name: '螺钉',
    specification: 'M6',
    material: 'SUS304',
    supplier: '',
  })
  const importRow = (itemType: 'A' | 'B', quantity: number) => ({
    item_type: itemType,
    part_name: '螺钉',
    specification: 'M6',
    quantity,
    remarks: '',
  })

  it('同名称规格的 A、B 各自写入对应库存行', async () => {
    db.rows = [inventoryRow('inv-a', 'A'), inventoryRow('inv-b', 'B')]

    await createJintanPartsInventoryBatch([
      importRow('B', 7),
      importRow('A', 3),
    ])

    expect(db.upserted[0]).toEqual([
      expect.objectContaining({ id: 'inv-b', item_type: 'B', quantity: 7 }),
      expect.objectContaining({ id: 'inv-a', item_type: 'A', quantity: 3 }),
    ])
  })

  it('只有 A 库存时，导入 B 行报资料不存在，不写入 A', async () => {
    db.rows = [inventoryRow('inv-a', 'A')]

    await expect(
      createJintanPartsInventoryBatch([importRow('B', 7)]),
    ).rejects.toThrow('“B”/“螺钉”/“M6”')
    expect(db.upserted).toEqual([])
  })
})

describe('资料批量导入按类型判重', () => {
  it('配件：已有 A 时可导入同名称规格的 B，重复的 A 被拒绝', async () => {
    db.rows = [{ item_type: 'A', part_name: '螺钉', specification: 'M6' }]
    const row = {
      part_name: '螺钉',
      specification: 'M6',
      material: '',
      supplier: '',
      remarks: '',
    }

    await createJintanPartsDataBatch([{ ...row, item_type: 'B' }])
    expect(db.inserted).toHaveLength(1)

    await expect(
      createJintanPartsDataBatch([{ ...row, item_type: 'A' }]),
    ).rejects.toThrow('以下配件已存在')
    expect(db.inserted).toHaveLength(1)
  })

  it('素材：已有 A 时可导入同型号名称规格的 B，重复的 A 被拒绝', async () => {
    db.rows = [{
      item_type: 'A',
      material_model: 'M1',
      material_name: '立柱',
      specification: '2000',
    }]
    const row = {
      material_model: 'M1',
      material_name: '立柱',
      specification: '2000',
      material: '',
      remarks: '',
    }

    await createJintanMaterialsDataBatch([{ ...row, item_type: 'B' }])
    expect(db.inserted).toHaveLength(1)

    await expect(
      createJintanMaterialsDataBatch([{ ...row, item_type: 'A' }]),
    ).rejects.toThrow('以下素材已存在')
    expect(db.inserted).toHaveLength(1)
  })

  it('型材：已有 A 时可导入同型号名称规格的 B，重复的 A 被拒绝', async () => {
    db.rows = [{
      item_type: 'A',
      profile_model: 'M1',
      profile_name: '立柱',
      specification: '2000',
    }]
    const row = {
      profile_model: 'M1',
      profile_name: '立柱',
      specification: '2000',
      material: '',
      remarks: '',
    }

    await createJintanProfilesDataBatch([{ ...row, item_type: 'B' }])
    expect(db.inserted).toHaveLength(1)

    await expect(
      createJintanProfilesDataBatch([{ ...row, item_type: 'A' }]),
    ).rejects.toThrow('以下型材已存在')
    expect(db.inserted).toHaveLength(1)
  })
})
