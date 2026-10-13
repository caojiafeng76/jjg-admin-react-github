import { describe, expect, it, vi } from 'vitest'

import {
  applyMaterialTransferFilters,
  buildOrderProgressMap,
  normalizeMaterialTransferInsertPayload,
  normalizeMaterialTransferUpdatePayload,
} from './apiMaterialTransfersCalculations'
import type { MaterialTransferInsert } from './apiMaterialTransfersTypes'

function createQueryRecorder() {
  const calls: Array<[string, ...unknown[]]> = []
  const query = {} as Record<string, (...args: unknown[]) => unknown>

  for (const method of ['ilike', 'or', 'in', 'contains', 'eq', 'gte', 'lt']) {
    query[method] = vi.fn((...args: unknown[]) => {
      calls.push([method, ...args])
      return query
    })
  }

  return {
    calls,
    query: query as unknown as Parameters<
      typeof applyMaterialTransferFilters
    >[0],
  }
}

const BASE_INSERT: MaterialTransferInsert = {
  operator_employee_id: 'e1',
  operator_employee_ids: ['e1', 'e1', 'e2'],
  operator_names: [' 张三 ', '李四'],
  project_no: ' P001 ',
  recipient_name: ' 贾小勇 ',
  target_workshop: '仓库',
  transfer_quantity: 5,
  remark: '  ',
}

describe('物料转移计算函数', () => {
  it('新建数据去空格、操作人去重，空备注转为 null', () => {
    expect(normalizeMaterialTransferInsertPayload(BASE_INSERT)).toMatchObject({
      project_no: 'P001',
      recipient_name: '贾小勇',
      operator_employee_id: 'e1',
      operator_employee_ids: ['e1', 'e2'],
      operator_names: ['张三', '李四'],
      remark: null,
      is_audited: false,
      audited_at: null,
    })
  })

  it('转移数量非正整数或操作人缺失时抛出中文错误', () => {
    expect(() =>
      normalizeMaterialTransferInsertPayload({
        ...BASE_INSERT,
        transfer_quantity: 1.5,
      }),
    ).toThrow('转移数量必须为大于 0 的整数')
    expect(() =>
      normalizeMaterialTransferInsertPayload({
        ...BASE_INSERT,
        operator_employee_ids: [],
        operator_names: [],
      }),
    ).toThrow('请至少选择一名操作人')
    expect(() =>
      normalizeMaterialTransferUpdatePayload({ operator_names: ['张三'] }),
    ).toThrow('操作人信息不完整，请重新选择')
  })

  it('更新数据只规整传入的字段', () => {
    expect(
      normalizeMaterialTransferUpdatePayload({
        customer: ' 客户A ',
        is_audited: true,
      }),
    ).toEqual({ customer: '客户A', is_audited: true })
  })

  it('筛选条件按字段转换为查询调用', () => {
    const { calls, query } = createQueryRecorder()

    applyMaterialTransferFilters(query, {
      length_mm: [1200],
      employeeId: 'e1',
      targetWorkshop: '仓库',
      recipientName: '贾',
      isAudited: false,
    })

    expect(calls).toEqual([
      ['in', 'length_mm', [1200]],
      ['contains', 'operator_employee_ids', ['e1']],
      ['eq', 'target_workshop', '仓库'],
      ['ilike', 'recipient_name', '%贾%'],
      ['eq', 'is_audited', false],
    ])
  })

  it('订单进度按项目号合并订单数量与转移合计', () => {
    const progress = buildOrderProgressMap(
      new Map([
        ['P001', 100],
        ['P002', 0],
      ]),
      new Map([
        ['P001', 100],
        ['P003', 20],
      ]),
    )

    expect(progress.get('P001')).toMatchObject({
      completionRate: 100,
      isCompleted: true,
    })
    expect(progress.get('P002')).toMatchObject({
      completionRate: null,
      isCompleted: false,
    })
    expect(progress.get('P003')).toMatchObject({
      transferTotal: 20,
      orderQuantity: null,
    })
  })
})
