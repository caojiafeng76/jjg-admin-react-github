import type { TableColumnsType } from 'antd'
import { describe, expect, it } from 'vitest'

import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import {
  applyColumnWidths,
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

    expect(extractTextFilters(items, (item) => item.material_code)).toEqual([
      { text: 'A', value: 'A' },
      { text: 'B', value: 'B' },
    ])
    expect(extractNumberFilters(items, (item) => item.completionRate)).toEqual([
      { text: '3', value: 3 },
      { text: '12', value: 12 },
    ])
  })

  it('uses stored widths and preserves table width totals', () => {
    type Row = { name: string; quantity: number }
    const columns = [
      { dataIndex: 'name', width: 120 },
      { key: 'quantity', width: 80 },
    ] satisfies TableColumnsType<Row>

    const resized = applyColumnWidths(columns, { name: 160 }, () => undefined)

    expect(resized.map((column) => column.width)).toEqual([160, 80])
    expect(getTableColumnWidth(resized)).toBe(240)
  })
})
