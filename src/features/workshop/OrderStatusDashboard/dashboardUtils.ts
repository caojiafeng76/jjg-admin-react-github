import type { TableColumnsType } from 'antd'

import type { WorkshopOrderStatus } from '@/features/workshop/OrderList/orderStatus'
import type {
  OrderProductionStatus,
  OrderStatusDashboardItem,
} from '@/services/apiOrderStatusDashboard'

export const DEFAULT_PAGE_SIZE = 20
export const MIN_RESIZABLE_COLUMN_WIDTH = 44

export const PRODUCTION_STATUS_OPTIONS: Array<{
  label: OrderProductionStatus
  value: OrderProductionStatus
}> = [
  { label: '正常', value: '正常' },
  { label: '预警', value: '预警' },
  { label: '延期', value: '延期' },
]

export const EMPTY_SEARCH_VALUES: SearchValues = {
  customer: '',
  materialCode: '',
  model: '',
  orderDate: '',
  productionStatus: '',
  projectNo: '',
}

export const STATUS_TABS: Array<{ key: WorkshopOrderStatus; label: string }> = [
  { key: '生产中', label: '生产中' },
  { key: '已结案', label: '已结案' },
]

export type SearchValues = {
  customer: string
  materialCode: string
  model: string
  orderDate: string
  productionStatus: OrderProductionStatus | ''
  projectNo: string
}

export type ColumnWidthMap = Record<string, number>

export function getColumnKey<RecordType>(
  column: TableColumnsType<RecordType>[number],
) {
  if (column.key !== undefined) {
    return String(column.key)
  }

  if ('dataIndex' in column && column.dataIndex !== undefined) {
    return Array.isArray(column.dataIndex)
      ? column.dataIndex.join('.')
      : String(column.dataIndex)
  }

  return ''
}

export function applyColumnWidths<RecordType>(
  columns: TableColumnsType<RecordType>,
  columnWidths: ColumnWidthMap,
  onResizeColumn: (columnKey: string, width: number) => void,
): TableColumnsType<RecordType> {
  return columns.map((column) => {
    const columnKey = getColumnKey(column)
    const defaultWidth = typeof column.width === 'number' ? column.width : 0
    const width = columnKey
      ? (columnWidths[columnKey] ?? defaultWidth)
      : defaultWidth

    return {
      ...column,
      width,
      onHeaderCell: () => ({
        columnKey,
        minWidth: MIN_RESIZABLE_COLUMN_WIDTH,
        onResizeColumn,
        width,
      }),
    }
  })
}

export function getTableColumnWidth<RecordType>(
  columns: TableColumnsType<RecordType>,
) {
  return columns.reduce((total, column) => {
    const width = column.width

    return total + (typeof width === 'number' ? width : 0)
  }, 0)
}

export function normalizeStatusTab(value: string | null): WorkshopOrderStatus {
  return value === '已结案' ? '已结案' : '生产中'
}

export function canCloseDashboardOrder({
  canManageStatus,
  record,
}: {
  canManageStatus: boolean
  record: OrderStatusDashboardItem
}) {
  return (
    canManageStatus &&
    Boolean(record.id) &&
    normalizeStatusTab(record.status ?? null) !== '已结案' &&
    (record.completionRate ?? 0) >= 100
  )
}

export function normalizeProductionStatusFilter(
  value: string | null,
): OrderProductionStatus | '' {
  return value === '正常' || value === '预警' || value === '延期' ? value : ''
}

export function extractTextFilters(
  items: OrderStatusDashboardItem[],
  getter: (item: OrderStatusDashboardItem) => string | null | undefined,
) {
  const values = Array.from(
    new Set(
      items
        .map(getter)
        .map((value) => (typeof value === 'string' ? value.trim() : value))
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right, 'zh-CN'))

  return values.map((value) => ({ text: value, value }))
}

export function extractNumberFilters(
  items: OrderStatusDashboardItem[],
  getter: (item: OrderStatusDashboardItem) => number | null | undefined,
  format?: (value: number) => string,
) {
  const values = Array.from(
    new Set(
      items
        .map(getter)
        .filter((value): value is number => value !== null && value !== undefined),
    ),
  ).sort((left, right) => left - right)

  return values.map((value) => ({
    text: format ? format(value) : String(value),
    value,
  }))
}
