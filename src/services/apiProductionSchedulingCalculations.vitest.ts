import { describe, expect, it } from 'vitest'

import type {
  WorkshopOrder,
  WorkshopOrderProcessSchedule,
} from '@/features/workshop/OrderList'
import {
  calculateInventoryQuantity,
  getOrderScheduledQuantity,
  parseSchedulingProcesses,
  percent,
  reconcileProcessSchedulesWithFlow,
} from './apiProductionSchedulingCalculations'

function makeSchedule(
  overrides: Partial<WorkshopOrderProcessSchedule>,
): WorkshopOrderProcessSchedule {
  return {
    id: 'schedule-1',
    process_code: '①',
    process_name: '精切',
    status: '已排',
    operator_id: null,
    operator_name: null,
    required_production_date: null,
    scheduled_date: '2026-10-01',
    last_scheduled_date: null,
    scheduled_quantity: 40,
    remark: null,
    ...overrides,
  }
}

describe('订单排产计算函数', () => {
  it('按工序编号解析工序，无编号时按名称解析并把"自动切"归为切割', () => {
    expect(parseSchedulingProcesses('①③①')).toEqual([
      { code: '①', name: '精切' },
      { code: '③', name: 'CNC' },
    ])
    expect(parseSchedulingProcesses('自动切 / 冲床')).toEqual([
      { code: '②', name: '切割' },
      { code: '④', name: '冲床' },
    ])
    expect(parseSchedulingProcesses('  ')).toEqual([])
  })

  it('已排数量不足订单数量时补一条余排记录', () => {
    const schedules = reconcileProcessSchedulesWithFlow({
      order_quantity: 100,
      process_flow: '①',
      process_schedules: [makeSchedule({})],
    })

    expect(schedules).toHaveLength(2)
    expect(schedules[1]).toMatchObject({
      process_code: '①',
      status: '余排',
      scheduled_quantity: 60,
      last_scheduled_date: '2026-10-01',
    })
  })

  it('订单已排数量取各工序已排合计的最大值', () => {
    const order = {
      order_quantity: 100,
      process_flow: '①②',
      process_schedules: [
        makeSchedule({ id: 'a', scheduled_quantity: 30 }),
        makeSchedule({ id: 'b', scheduled_quantity: 50 }),
        makeSchedule({
          id: 'c',
          process_code: '②',
          process_name: '切割',
          scheduled_quantity: 60,
        }),
      ],
    } as unknown as WorkshopOrder

    expect(getOrderScheduledQuantity(order)).toBe(80)
  })

  it('百分比保留一位小数，总数为 0 时返回 0', () => {
    expect(percent(1, 3)).toBe(33.3)
    expect(percent(5, 0)).toBe(0)
  })

  it('库存 = 精切转入 + 自动切合格 - 各工序报废 - 转移出去', () => {
    expect(
      calculateInventoryQuantity({
        precisionCuttingQuantity: 100,
        autoCutQuantity: 50,
        defectQuantity: 5,
        transferQuantity: 120,
      }),
    ).toBe(25)
  })

  it('库存缺失数据按 0 计算，转移超出时保留负数', () => {
    expect(
      calculateInventoryQuantity({
        precisionCuttingQuantity: Number.NaN,
        autoCutQuantity: 10,
        defectQuantity: 0,
        transferQuantity: 0,
      }),
    ).toBe(10)
    expect(
      calculateInventoryQuantity({
        precisionCuttingQuantity: 10,
        autoCutQuantity: 0,
        defectQuantity: 2,
        transferQuantity: 12,
      }),
    ).toBe(-4)
  })
})
