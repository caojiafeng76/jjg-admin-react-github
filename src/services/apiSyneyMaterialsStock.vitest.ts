import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createSyneyMaterialsStock,
  deleteSyneyMaterialsStock,
  updateSyneyMaterialsStockRemarks,
} from './apiSyneyMaterialsStock'

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

describe('西尼材料出入库服务', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it.each([
    ['in', '入库'],
    ['out', '出库'],
  ] as const)('%s 拒绝非正整数数量', async (direction, label) => {
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      await expect(
        createSyneyMaterialsStock(direction, {
          inventory_id: 'inventory-1',
          quantity,
          remarks: '',
        }),
      ).rejects.toThrow(`${label}数量必须为正整数`)
    }
    expect(calls).toHaveLength(0)
  })

  it('未选择材料时不写库', async () => {
    await expect(
      createSyneyMaterialsStock('in', { inventory_id: '', quantity: 1, remarks: '' }),
    ).rejects.toThrow('请选择材料')
    expect(calls).toHaveLength(0)
  })

  it('按方向写入对应流水表，只传库存 ID、数量、备注，快照由数据库填写', async () => {
    await createSyneyMaterialsStock('in', {
      inventory_id: 'inventory-1',
      quantity: 5,
      remarks: '  采购到货 ',
    })
    await createSyneyMaterialsStock('out', {
      inventory_id: 'inventory-1',
      quantity: 2,
      remarks: '',
    })

    expect(calls).toEqual([
      {
        table: 'syney_materials_stock_in',
        operation: 'insert',
        payload: { inventory_id: 'inventory-1', quantity: 5, remarks: '采购到货' },
      },
      {
        table: 'syney_materials_stock_out',
        operation: 'insert',
        payload: { inventory_id: 'inventory-1', quantity: 2, remarks: '' },
      },
    ])
  })

  it('编辑只更新备注，删除走对应表', async () => {
    await updateSyneyMaterialsStockRemarks('out', { id: 'r-1', remarks: ' 改 ' })
    await deleteSyneyMaterialsStock('in', 'r-2')

    expect(calls).toEqual([
      { table: 'syney_materials_stock_out', operation: 'update', payload: { remarks: '改' } },
      { table: 'syney_materials_stock_in', operation: 'delete' },
    ])
  })
})
