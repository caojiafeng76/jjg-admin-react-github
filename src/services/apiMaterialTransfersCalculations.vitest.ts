import type { MaterialTransferInsert } from './apiMaterialTransfersTypes'

import { describe, expect, it, vi } from 'vitest'
import {
  applyMaterialTransferFilters,
  buildOrderProgressMap,
  normalizeMaterialTransferInsertPayload,
  normalizeMaterialTransferUpdatePayload,
} from './apiMaterialTransfersCalculations'
import {
  isWarehouseWorkshop,
  MATERIAL_TRANSFER_WORKSHOPS,
} from './apiMaterialTransfersTypes'
import { PRECISION_CUTTING_TRANSFER_WORKSHOPS } from './apiPrecisionCuttingTransfersTypes'
import { PRECISION_FINISHING_CUTTING_WORKSHOPS } from './precisionFinishingCuttings/types'

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

  it('筛选条件按客户型号多关键词过滤 customer_model 列而非 material_code', () => {
    const { calls, query } = createQueryRecorder()

    applyMaterialTransferFilters(query, {
      projectNo: '26103001',
      productModel: '105-330',
      customerModel: ' SC-752 ， 拉手左 ',
    })

    expect(calls).toEqual([
      ['or', 'project_no.ilike.%26103001%'],
      ['or', 'product_model.ilike.%105-330%'],
      ['or', 'customer_model.ilike.%SC-752%,customer_model.ilike.%拉手左%'],
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

  it('三张流转/切割单的接收车间常量都在「仓库」后包含「凉亭仓库」', () => {
    for (const workshops of [
      MATERIAL_TRANSFER_WORKSHOPS,
      PRECISION_CUTTING_TRANSFER_WORKSHOPS,
      PRECISION_FINISHING_CUTTING_WORKSHOPS,
    ]) {
      const warehouseIndex = workshops.indexOf('仓库')
      const liangtingIndex = workshops.indexOf('凉亭仓库')
      expect(warehouseIndex).toBeGreaterThan(-1)
      expect(liangtingIndex).toBe(warehouseIndex + 1)
    }
  })

  it('isWarehouseWorkshop 正确识别仓库与凉亭仓库', () => {
    expect(isWarehouseWorkshop('仓库')).toBe(true)
    expect(isWarehouseWorkshop('凉亭仓库')).toBe(true)
    expect(isWarehouseWorkshop(' 凉亭仓库 ')).toBe(true)
    expect(isWarehouseWorkshop('精加工')).toBe(false)
    expect(isWarehouseWorkshop('')).toBe(false)
    expect(isWarehouseWorkshop(null)).toBe(false)
  })

  it('筛选条件支持按「凉亭仓库」过滤接收车间', () => {
    const { calls, query } = createQueryRecorder()

    applyMaterialTransferFilters(query, {
      targetWorkshop: '凉亭仓库',
    })

    expect(calls).toEqual([['eq', 'target_workshop', '凉亭仓库']])
  })
})
