import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createWorkshopMiscMaterialsStock,
  deleteWorkshopMiscMaterialsStock,
  updateWorkshopMiscMaterialsStockRemarks,
} from './apiWorkshopMiscMaterialsStock'

const calls: Array<{ table: string, operation: string, payload?: unknown }> = []

vi.mock('./supabase', () => ({
  default: {
    from(table: string) {
      const query = {
        insert(payload: unknown) {
          calls.push({ table, operation: 'insert', payload })
          return Promise.resolve({ error: null })
        },
        update(payload: unknown) {
          calls.push({ table, operation: 'update', payload })
          return query
        },
        delete() {
          calls.push({ table, operation: 'delete' })
          return query
        },
        eq() {
          return query
        },
        select() {
          return query
        },
        single() {
          return Promise.resolve({ error: null, data: { id: 'record-1' } })
        },
      }
      return query
    },
  },
}))

describe('车间杂项材料出入库服务', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it.each([
    ['in', '入库'],
    ['out', '出库'],
  ] as const)('%s 拒绝三项全为 0 或非法数量', async (direction, label) => {
    await expect(
      createWorkshopMiscMaterialsStock(direction, {
        inventory_id: 'inventory-1',
        raw_material_quantity: 0,
        semi_finished_quantity: 0,
        finished_quantity: 0,
        remarks: '',
      }),
    ).rejects.toThrow(`请至少填写一项大于 0 的${label}数量`)

    for (const invalid of [-1, 1.5, Number.NaN]) {
      await expect(
        createWorkshopMiscMaterialsStock(direction, {
          inventory_id: 'inventory-1',
          raw_material_quantity: invalid,
          semi_finished_quantity: 1,
          finished_quantity: 0,
          remarks: '',
        }),
      ).rejects.toThrow(`原材料${label}数量必须为非负整数`)
    }
    expect(calls).toHaveLength(0)
  })

  it('未选择材料时不写库', async () => {
    await expect(
      createWorkshopMiscMaterialsStock('in', {
        inventory_id: '',
        raw_material_quantity: 1,
        semi_finished_quantity: 0,
        finished_quantity: 0,
        remarks: '',
      }),
    ).rejects.toThrow('请选择材料')
    expect(calls).toHaveLength(0)
  })

  it('按方向写入对应流水表，支持同时填写三项数量且快照由数据库填写', async () => {
    await createWorkshopMiscMaterialsStock('in', {
      inventory_id: 'inventory-1',
      raw_material_quantity: 5,
      semi_finished_quantity: 2,
      finished_quantity: 0,
      remarks: '  采购到货 ',
    })
    await createWorkshopMiscMaterialsStock('out', {
      inventory_id: 'inventory-1',
      raw_material_quantity: 0,
      semi_finished_quantity: 1,
      finished_quantity: 3,
      remarks: '',
    })

    expect(calls).toEqual([
      {
        table: 'workshop_misc_materials_stock_in',
        operation: 'insert',
        payload: {
          inventory_id: 'inventory-1',
          raw_material_quantity: 5,
          semi_finished_quantity: 2,
          finished_quantity: 0,
          remarks: '采购到货',
        },
      },
      {
        table: 'workshop_misc_materials_stock_out',
        operation: 'insert',
        payload: {
          inventory_id: 'inventory-1',
          raw_material_quantity: 0,
          semi_finished_quantity: 1,
          finished_quantity: 3,
          remarks: '',
        },
      },
    ])
  })

  it('编辑只更新备注，删除走对应表', async () => {
    await updateWorkshopMiscMaterialsStockRemarks('out', {
      id: 'r-1',
      remarks: ' 改 ',
    })
    await deleteWorkshopMiscMaterialsStock('in', 'r-2')

    expect(calls).toEqual([
      {
        table: 'workshop_misc_materials_stock_out',
        operation: 'update',
        payload: { remarks: '改' },
      },
      { table: 'workshop_misc_materials_stock_in', operation: 'delete' },
    ])
  })
})
