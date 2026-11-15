import type { TableColumnsType } from 'antd'
import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'

import { describe, expect, it } from 'vitest'
import {
  applyColumnWidths,
  buildDashboardSummary,
  canCloseDashboardOrder,
  extractNumberFilters,
  extractTextFilters,
  getTableColumnWidth,
  normalizeProductionStatusFilter,
  normalizeStatusTab,
} from './dashboardUtils'

describe('dashboardUtils', () => {
  it('normalizes only supported URL status filters', () => {
    expect(normalizeStatusTab('已结案')).toBe('已结案')
    expect(normalizeStatusTab('unexpected')).toBe('生产中')
    expect(normalizeProductionStatusFilter('预警')).toBe('预警')
    expect(normalizeProductionStatusFilter('unexpected')).toBe('')
  })

  it('allows closure only for manageable completed open orders', () => {
    const record = {
      completionRate: 100,
      id: 'order-1',
      status: '生产中',
    } as OrderStatusDashboardItem

    expect(canCloseDashboardOrder({ canManageStatus: true, record })).toBe(true)
    expect(
      canCloseDashboardOrder({
        canManageStatus: true,
        record: { ...record, status: '已结案' },
      }),
    ).toBe(false)
    expect(
      canCloseDashboardOrder({
        canManageStatus: false,
        record,
      }),
    ).toBe(false)
  })

  it('creates sorted unique text and numeric filters', () => {
    const items = [
      { material_code: ' B ', completionRate: 12 },
      { material_code: 'A', completionRate: 3 },
      { material_code: 'B', completionRate: 12 },
      { material_code: '', completionRate: null },
    ] as unknown as OrderStatusDashboardItem[]

    expect(extractTextFilters(items, item => item.material_code)).toEqual([
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B' },
    ])
    expect(extractNumberFilters(items, item => item.completionRate)).toEqual([
      { text: '3', value: 3 },
      { text: '12', value: 12 },
    ])
  })

  it('uses stored widths and preserves table width totals', () => {
    interface Row { name: string, quantity: number }
    const columns = [
      { dataIndex: 'name', width: 120 },
      { key: 'quantity', width: 80 },
    ] satisfies TableColumnsType<Row>

    const resized = applyColumnWidths(columns, { name: 160 }, () => undefined)

    expect(resized.map(column => column.width)).toEqual([160, 80])
    expect(getTableColumnWidth(resized)).toBe(240)
  })
})

describe('buildDashboardSummary', () => {
  const rework = (pendingProductionCount: number, completedCount: number) => ({
    totalQuantity: pendingProductionCount + completedCount,
    pendingWorkshopCount: 0,
    pendingProductionCount,
    pendingTechnicalCount: 0,
    pendingQualityCount: 0,
    completedCount,
  })

  it('sums quantities, averages rates and counts statuses', () => {
    const rows = [
      {
        order_quantity: 52,
        extrusionQuantity: 0,
        precisionCuttingQuantity: 10,
        transferQuantity: 3,
        inventoryQuantity: 5,
        jobOutputs: { 切割: 60, CNC: 52 },
        completionRate: 50,
        yieldRate: null,
        productionStatus: '延期',
        reworkRepairInfo: rework(1, 0),
      },
      {
        order_quantity: 93,
        extrusionQuantity: 7,
        precisionCuttingQuantity: 0,
        transferQuantity: 0,
        inventoryQuantity: -6,
        jobOutputs: { 切割: 95 },
        completionRate: 81,
        yieldRate: 98.2,
        productionStatus: '正常',
        reworkRepairInfo: rework(0, 2),
      },
      {
        order_quantity: 93,
        extrusionQuantity: 0,
        precisionCuttingQuantity: 0,
        transferQuantity: 0,
        inventoryQuantity: 93,
        jobOutputs: { 切割: 97, CNC: 94 },
        completionRate: 0,
        yieldRate: 96.4,
        productionStatus: '延期',
        reworkRepairInfo: rework(2, 1),
      },
    ] as unknown as OrderStatusDashboardItem[]

    const summary = buildDashboardSummary(rows, ['切割', 'CNC', '包装'])

    expect(summary.orderQuantity).toBe(238)
    expect(summary.extrusionQuantity).toBe(7)
    expect(summary.precisionCuttingQuantity).toBe(10)
    expect(summary.transferQuantity).toBe(3)
    expect(summary.inventoryQuantity).toBe(92)
    expect(summary.jobOutputs).toEqual({ 切割: 252, CNC: 146, 包装: 0 })
    expect(summary.completionRate).toBe(43.7)
    expect(summary.yieldRate).toBe(97.3)
    expect(summary.productionStatusCounts).toEqual({ 正常: 1, 预警: 0, 延期: 2 })
    expect(summary.reworkRepairInfo.pendingProductionCount).toBe(3)
    expect(summary.reworkRepairInfo.completedCount).toBe(3)
  })

  it('returns zeros and null averages for empty rows', () => {
    const summary = buildDashboardSummary([], ['切割'])

    expect(summary.orderQuantity).toBe(0)
    expect(summary.jobOutputs).toEqual({ 切割: 0 })
    expect(summary.completionRate).toBeNull()
    expect(summary.yieldRate).toBeNull()
  })
})
