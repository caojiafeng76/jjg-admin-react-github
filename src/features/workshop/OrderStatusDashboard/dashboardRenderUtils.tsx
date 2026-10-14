import type { TableProps } from 'antd'
import { Button, Space, Tag, Typography } from 'antd'

import type {
  OrderStatusDashboardItem,
  OrderStatusExtrusionDetail,
  OrderStatusMaterialTransferDetail,
  OrderStatusPrecisionCuttingTransferDetail,
  OrderStatusProductionDetail,
  ReworkRepairInfo,
} from '@/services/apiOrderStatusDashboard'
import { DenseBodyCell, ResizableHeaderCell } from './dashboardTableCells'
import {
  REWORK_REPAIR_STATUS_COLORS,
  REWORK_REPAIR_STATUS_LABELS,
} from './useOrderStatusDashboard'

const { Text } = Typography

export type ProductionDetailRow = OrderStatusProductionDetail & {
  key: string
}

export type TransferDetailRow = OrderStatusMaterialTransferDetail & {
  key: string
}

export type PrecisionCuttingDetailRow =
  OrderStatusPrecisionCuttingTransferDetail & {
    key: string
  }

export type OperationSummaryRow = {
  detailCount: number
  key: string
  operation: string
  qualifiedQuantity: number
}

export type ExtrusionDetailRow = OrderStatusExtrusionDetail & {
  key: string
}

export type SelectedJobDetail = {
  jobName: string
  record: OrderStatusDashboardItem
}

export type SelectedTransferDetail = {
  record: OrderStatusDashboardItem
}

export type SelectedPrecisionCuttingDetail = {
  record: OrderStatusDashboardItem
}

export type SelectedExtrusionDetail = {
  record: OrderStatusDashboardItem
}

/** Viewer 角色在岗位生产工单明细弹窗中隐藏的列（工时/成本相关） */
export const VIEWER_PRODUCTION_DETAIL_HIDDEN_COLUMN_KEYS: ReadonlySet<string> =
  new Set([
    'standardSeconds',
    'qualifiedHours',
    'defectHours',
    'workHours',
    'dataCategory',
  ])

export const DENSE_TABLE_COMPONENTS = {
  body: { cell: DenseBodyCell },
  header: { cell: ResizableHeaderCell },
} satisfies NonNullable<TableProps<OrderStatusDashboardItem>['components']>

export function renderText(value: string | number | null | undefined) {
  const text =
    value === null || value === undefined || value === '' ? '-' : value

  return (
    <span
      className="block leading-tight wrap-break-word whitespace-normal"
      title={String(text)}
    >
      {text}
    </span>
  )
}

export function renderQuantity(value: number | null | undefined) {
  const normalizedValue = Number(value || 0)

  if (normalizedValue <= 0) {
    return <Text type="secondary">-</Text>
  }

  return <Text strong>{normalizedValue.toLocaleString()}</Text>
}

export function renderDetailQuantity(value: number | null | undefined) {
  return Number(value || 0).toLocaleString()
}

export function renderPercent(value: number | null) {
  if (value === null) {
    return <Text type="secondary">-</Text>
  }

  return `${value}%`
}

export function renderHours(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return <Text type="secondary">-</Text>
  }

  return value.toFixed(2)
}

export function renderTransferWorkshops(value: string[]) {
  if (value.length === 0) {
    return <Text type="secondary">-</Text>
  }

  return (
    <Space size={4} wrap>
      {value.map((workshop) => (
        <Tag key={workshop}>{workshop}</Tag>
      ))}
    </Space>
  )
}

export function renderTransferQuantityCell({
  onOpen,
  record,
}: {
  onOpen: (record: OrderStatusDashboardItem) => void
  record: OrderStatusDashboardItem
}) {
  const quantity = Number(record.transferQuantity || 0)

  if (quantity <= 0) {
    return <Text type="secondary">-</Text>
  }

  if (record.transferDetails.length === 0) {
    return <Text strong>{quantity.toLocaleString()}</Text>
  }

  return (
    <Button
      type="link"
      size="small"
      className="h-auto! px-0! text-xs! font-semibold!"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(record)
      }}
    >
      {quantity.toLocaleString()}
    </Button>
  )
}

export function renderPrecisionCuttingQuantityCell({
  onOpen,
  record,
}: {
  onOpen: (record: OrderStatusDashboardItem) => void
  record: OrderStatusDashboardItem
}) {
  const quantity = Number(record.precisionCuttingQuantity || 0)

  if (quantity <= 0) {
    return <Text type="secondary">-</Text>
  }

  if (record.precisionCuttingDetails.length === 0) {
    return <Text strong>{quantity.toLocaleString()}</Text>
  }

  return (
    <Button
      type="link"
      size="small"
      className="h-auto! px-0! text-xs! font-semibold!"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(record)
      }}
    >
      {quantity.toLocaleString()}
    </Button>
  )
}

export function renderExtrusionQuantityCell({
  onOpen,
  record,
}: {
  onOpen: (record: OrderStatusDashboardItem) => void
  record: OrderStatusDashboardItem
}) {
  const quantity = Number(record.extrusionQuantity || 0)

  if (quantity <= 0) {
    return <Text type="secondary">-</Text>
  }

  if (record.extrusionDetails.length === 0) {
    return <Text strong>{quantity.toLocaleString()}</Text>
  }

  return (
    <Button
      type="link"
      size="small"
      className="h-auto! px-0! text-xs! font-semibold!"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(record)
      }}
    >
      {quantity.toLocaleString()}
    </Button>
  )
}

const REWORK_REPAIR_STATUS_KEYS = [
  'pendingProductionCount',
  'pendingTechnicalCount',
  'pendingQualityCount',
  'completedCount',
] as const

export function renderReworkRepairStatus(reworkRepairInfo: ReworkRepairInfo) {
  const total =
    reworkRepairInfo.pendingProductionCount +
    reworkRepairInfo.pendingTechnicalCount +
    reworkRepairInfo.pendingQualityCount +
    reworkRepairInfo.completedCount

  if (total === 0) {
    return <Text type="secondary">-</Text>
  }

  return (
    <Space size={2} wrap>
      {REWORK_REPAIR_STATUS_KEYS.map((key) => {
        const count = reworkRepairInfo[key]

        if (count <= 0) {
          return null
        }

        return (
          <Tag
            key={key}
            color={REWORK_REPAIR_STATUS_COLORS[key]}
            className="text-xs!"
          >
            {REWORK_REPAIR_STATUS_LABELS[key]} {count}
          </Tag>
        )
      })}
    </Space>
  )
}

export function renderJobOutputCell({
  jobName,
  onOpen,
  record,
}: {
  jobName: string
  onOpen: (record: OrderStatusDashboardItem, jobName: string) => void
  record: OrderStatusDashboardItem
}) {
  const quantity = Number(record.jobOutputs[jobName] || 0)
  const detailCount = record.productionDetails.filter(
    (item) => item.jobName === jobName,
  ).length

  if (quantity <= 0) {
    if (detailCount === 0) {
      return <Text type="secondary">-</Text>
    }

    // 该订单在此岗位只有非末道工序数据：主列表不显示数字，但保留点击查看入口
    return (
      <Button
        type="link"
        size="small"
        className="h-auto! px-0! text-xs!"
        onClick={(event) => {
          event.stopPropagation()
          onOpen(record, jobName)
        }}
      >
        查看
      </Button>
    )
  }

  if (detailCount === 0) {
    return <Text strong>{quantity.toLocaleString()}</Text>
  }

  return (
    <Button
      type="link"
      size="small"
      className="h-auto! px-0! text-xs! font-semibold!"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(record, jobName)
      }}
    >
      {quantity.toLocaleString()}
    </Button>
  )
}
