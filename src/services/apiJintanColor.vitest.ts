import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createJintanPartsDataBatch } from './apiJintanPartsData'
import { createJintanPartsInventoryBatch } from './apiJintanPartsInventory'
import { createJintanProfilesDataBatch } from './apiJintanProfilesData'
import { createJintanProfilesInventoryBatch } from './apiJintanProfilesInventory'
import {
  describeJintanColor,
  formatJintanColor,
  jintanColorSegment,
} from './jintanColor'

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

describe('颜色显示工具', () => {
  it('未填颜色显示「-」，提示文案和下拉标签省略颜色', () => {
    expect(formatJintanColor('')).toBe('-')
    expect(formatJintanColor(' 黑色 ')).toBe('黑色')
    expect(describeJintanColor('')).toBe('')
    expect(describeJintanColor('黑色')).toBe('颜色“黑色”')
    expect(jintanColorSegment(undefined)).toBe('')
    expect(jintanColorSegment('黑色')).toBe(' / 黑色')
  })
})

describe('资料批量导入按颜色判重', () => {
  it('配件：已有无颜色的一条时可导入同名同规格的黑色，重复的黑色被拒绝', async () => {
    db.rows = [{ item_type: 'A', part_name: '螺钉', specification: 'M6', color: '' }]
    const row = {
      item_type: 'A' as const,
      part_name: '螺钉',
      specification: 'M6',
      material: '',
      supplier: '',
      remarks: '',
    }

    await createJintanPartsDataBatch([{ ...row, color: ' 黑色 ' }])
    expect(db.inserted).toEqual([[expect.objectContaining({ color: '黑色' })]])

    db.rows.push({ item_type: 'A', part_name: '螺钉', specification: 'M6', color: '黑色' })
    await expect(
      createJintanPartsDataBatch([{ ...row, color: '黑色' }]),
    ).rejects.toThrow('“A”/“螺钉”/“M6”/“黑色”')
    expect(db.inserted).toHaveLength(1)
  })

  it('型材：同一批里同型号名称规格颜色重复时报错', async () => {
    const row = {
      item_type: 'A' as const,
      profile_model: 'M1',
      profile_name: '立柱',
      specification: '2000',
      color: '银色',
      material: '',
      remarks: '',
    }

    await expect(
      createJintanProfilesDataBatch([row, { ...row }]),
    ).rejects.toThrow('颜色“银色”在 Excel 中重复')
    expect(db.inserted).toEqual([])

    await createJintanProfilesDataBatch([row, { ...row, color: '黑色' }])
    expect(db.inserted).toHaveLength(1)
  })
})

describe('库存导入按颜色匹配', () => {
  it('配件：同名同规格不同颜色各自写入对应库存行', async () => {
    const inventoryRow = (id: string, color: string) => ({
      id,
      part_data_id: `data-${id}`,
      item_type: 'A',
      part_name: '螺钉',
      specification: 'M6',
      color,
      material: '',
      supplier: '',
    })
    const importRow = (color: string, quantity: number) => ({
      item_type: 'A' as const,
      part_name: '螺钉',
      specification: 'M6',
      color,
      quantity,
      remarks: '',
    })
    db.rows = [inventoryRow('inv-none', ''), inventoryRow('inv-black', '黑色')]

    await createJintanPartsInventoryBatch([importRow('黑色', 5), importRow('', 2)])

    expect(db.upserted[0]).toEqual([
      expect.objectContaining({ id: 'inv-black', color: '黑色', quantity: 5 }),
      expect.objectContaining({ id: 'inv-none', color: '', quantity: 2 }),
    ])
  })

  it('型材：库存里没有该颜色时报资料不存在，不写入其他颜色', async () => {
    db.rows = [{
      id: 'inv-silver',
      profile_data_id: 'data-silver',
      item_type: 'A',
      profile_model: 'M1',
      profile_name: '立柱',
      specification: '2000',
      color: '银色',
      material: '6063',
    }]

    await expect(
      createJintanProfilesInventoryBatch([{
        item_type: 'A',
        profile_model: 'M1',
        profile_name: '立柱',
        specification: '2000',
        color: '黑色',
        quantity: 3,
        remarks: '',
      }]),
    ).rejects.toThrow('“A”/“M1”/“立柱”/“2000”/“黑色”')
    expect(db.upserted).toEqual([])
  })
})
