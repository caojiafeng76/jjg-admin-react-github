import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: Array<{ table: string; operation: string; payload?: unknown }> = []

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

import {
  createJintanMaterialsStockOut,
  deleteJintanMaterialsStockOut,
  updateJintanMaterialsStockOutRemarks,
} from './apiJintanMaterialsStockOut'

describe('金檀木业素材出库服务', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it.each([0, -1, 1.5, Number.NaN])('拒绝无效出库数量 %s', async (quantity) => {
    await expect(
      createJintanMaterialsStockOut({
        inventory_id: 'inventory-1',
        quantity,
        remarks: '',
      }),
    ).rejects.toThrow('出库数量必须为正整数')
    expect(calls).toHaveLength(0)
  })

  it('只写入出库流水，库存由数据库事务联动', async () => {
    await createJintanMaterialsStockOut({
      inventory_id: 'inventory-1',
      quantity: 4,
      remarks: ' 到货 ',
    })
    expect(calls).toEqual([
      {
        table: 'jintan_materials_stock_out',
        operation: 'insert',
        payload: {
          inventory_id: 'inventory-1',
          quantity: 4,
          remarks: '到货',
        },
      },
    ])
  })

  it('编辑仅提交备注，删除仅删除流水', async () => {
    await updateJintanMaterialsStockOutRemarks({
      id: 'record-1',
      remarks: ' 修正 ',
    })
    await deleteJintanMaterialsStockOut('record-1')
    expect(calls).toEqual([
      {
        table: 'jintan_materials_stock_out',
        operation: 'update',
        payload: { remarks: '修正' },
      },
      { table: 'jintan_materials_stock_out', operation: 'delete' },
    ])
  })
})
