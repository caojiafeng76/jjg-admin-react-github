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
  createJintanPartsStockIn,
  deleteJintanPartsStockIn,
  updateJintanPartsStockInRemarks,
} from './apiJintanPartsStockIn'

describe('金檀木业配件入库服务', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it.each([0, -1, 1.5, Number.NaN])('拒绝无效入库数量 %s', async (quantity) => {
    await expect(
      createJintanPartsStockIn({
        inventory_id: 'inventory-1',
        quantity,
        remarks: '',
      }),
    ).rejects.toThrow('入库数量必须为正整数')
    expect(calls).toHaveLength(0)
  })

  it('只写入入库流水，库存由数据库事务联动', async () => {
    await createJintanPartsStockIn({
      inventory_id: 'inventory-1',
      quantity: 4,
      remarks: ' 到货 ',
    })
    expect(calls).toEqual([
      {
        table: 'jintan_parts_stock_in',
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
    await updateJintanPartsStockInRemarks({ id: 'record-1', remarks: ' 修正 ' })
    await deleteJintanPartsStockIn('record-1')
    expect(calls).toEqual([
      {
        table: 'jintan_parts_stock_in',
        operation: 'update',
        payload: { remarks: '修正' },
      },
      { table: 'jintan_parts_stock_in', operation: 'delete' },
    ])
  })
})
