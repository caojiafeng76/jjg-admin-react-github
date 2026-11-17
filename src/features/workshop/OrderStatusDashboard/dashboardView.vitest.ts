import type { TableColumnsType } from 'antd'
import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import { describe, expect, it } from 'vitest'
import { createDashboardOrder } from '@/test/fixtures/orderStatusDashboard'
import { applyDashboardTableView, EMPTY_TABLE_VIEW, getVisibleDashboardRows } from './dashboardView'

describe('dashboard visible rows', () => {
  const columns: TableColumnsType<OrderStatusDashboardItem> = [
    { key: 'project_no', sorter: (left, right) => left.project_no!.localeCompare(right.project_no!, 'en', { numeric: true }) },
    { key: 'order_quantity', filters: [{ text: '100', value: 100 }], onFilter: (value, row) => row.order_quantity === value },
    { key: 'productionStatus', onFilter: (value, row) => row.productionStatus === value },
    { key: 'product_model', filteredValue: ['105-268'] },
  ]
  const rows = [
    createDashboardOrder({ project_no: 'P-10', productionStatus: '正常' }),
    createDashboardOrder({ project_no: 'P-2', productionStatus: '预警' }),
    createDashboardOrder({ project_no: 'P-1', order_quantity: 200 }),
  ]

  it('matches typed numeric menus, intersects column filters and applies the selected sort', () => {
    const controlledColumns = applyDashboardTableView(columns, {
      filters: { order_quantity: ['100'], productionStatus: ['正常', '预警'] },
      sortColumnKey: 'project_no',
      sortOrder: 'descend',
    })
    expect(getVisibleDashboardRows(rows, controlledColumns).map(row => row.project_no)).toEqual(['P-10', 'P-2'])
    expect(getVisibleDashboardRows(rows, applyDashboardTableView(columns, EMPTY_TABLE_VIEW))).toEqual(rows)
    expect(rows.map(row => row.project_no)).toEqual(['P-10', 'P-2', 'P-1'])
    expect(controlledColumns[3]).toHaveProperty('filteredValue', ['105-268'])
  })
})
