import type { TableColumnsType, TableProps } from 'antd'
import type { OrderStatusDashboardItem } from '@/services/apiOrderStatusDashboard'
import { getColumnKey } from './dashboardUtils'

type TableChange = NonNullable<TableProps<OrderStatusDashboardItem>['onChange']>

export interface DashboardTableView {
  filters: Parameters<TableChange>[1]
  sortColumnKey: string | null
  sortOrder: 'ascend' | 'descend' | null
}

export const EMPTY_TABLE_VIEW: DashboardTableView = {
  filters: {},
  sortColumnKey: null,
  sortOrder: null,
}

export function applyDashboardTableView(
  columns: TableColumnsType<OrderStatusDashboardItem>,
  view: DashboardTableView,
): TableColumnsType<OrderStatusDashboardItem> {
  return columns.map((column) => {
    const key = getColumnKey(column)
    return {
      ...column,
      // 型号由 URL 驱动服务端筛选，其余列只筛选当前页。
      ...('onFilter' in column && column.onFilter
        ? { filteredValue: view.filters[key] ?? null }
        : {}),
      ...('sorter' in column && column.sorter
        ? { sortOrder: key === view.sortColumnKey ? view.sortOrder : null }
        : {}),
    }
  })
}

/** 复用受控列的筛选和排序规则，使导出随翻页、轮询刷新重新计算。 */
export function getVisibleDashboardRows(
  rows: readonly OrderStatusDashboardItem[],
  columns: TableColumnsType<OrderStatusDashboardItem>,
): OrderStatusDashboardItem[] {
  let visibleRows = [...rows]

  for (const column of columns) {
    if (!('onFilter' in column) || !column.onFilter || !column.filteredValue?.length)
      continue

    const { onFilter, filteredValue, filters } = column
    visibleRows = visibleRows.filter(row => filteredValue.some((value) => {
      // antd 的筛选状态可能存为字符串，需恢复菜单项原始的数字类型。
      const filterValue = filters?.find(option => String(option.value) === String(value))?.value ?? value
      return onFilter(filterValue, row)
    }))
  }

  const sortedColumn = columns.find(column => 'sorter' in column && column.sorter && column.sortOrder)
  if (sortedColumn && 'sorter' in sortedColumn) {
    const { sorter, sortOrder } = sortedColumn
    const compare = typeof sorter === 'function' ? sorter : typeof sorter === 'object' ? sorter.compare : undefined
    if (compare && sortOrder) {
      visibleRows.sort((left, right) => compare(left, right, sortOrder) * (sortOrder === 'descend' ? -1 : 1))
    }
  }

  return visibleRows
}
