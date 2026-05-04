import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType, TableProps } from 'antd'
import {
  App,
  Button,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import type { WorkshopOrderStatus } from '@/features/workshop/OrderList/orderStatus'
import {
  useBatchUpdateWorkshopOrderStatuses,
  useWorkshopOrderModels,
} from '@/features/workshop/OrderList/useWorkshopOrders'
import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  OrderProductionStatus,
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
  OrderStatusMaterialTransferDetail,
  OrderStatusPrecisionCuttingTransferDetail,
  OrderStatusProductionDetail,
  ReworkRepairInfo,
} from '@/services/apiOrderStatusDashboard'
import AppPagination from '@/ui/AppPagination'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import {
  ORDER_STATUS_DASHBOARD_KEY,
  REWORK_REPAIR_STATUS_COLORS,
  REWORK_REPAIR_STATUS_LABELS,
  useOrderStatusDashboard,
} from './useOrderStatusDashboard'

const { Text, Title } = Typography

const DEFAULT_PAGE_SIZE = 20
const EMPTY_JOB_COLUMNS: OrderStatusJobColumn[] = []
const MIN_RESIZABLE_COLUMN_WIDTH = 44

const STATUS_COLOR: Record<OrderProductionStatus, string> = {
  正常: 'green',
  预警: 'gold',
  延期: 'red',
}

const PRODUCTION_STATUS_OPTIONS: Array<{
  label: OrderProductionStatus
  value: OrderProductionStatus
}> = [
  { label: '正常', value: '正常' },
  { label: '预警', value: '预警' },
  { label: '延期', value: '延期' },
]

const JOB_OUTPUT_COLUMN_WIDTH = 72
const JOB_OUTPUT_COLUMN_ORDER = [
  '精切',
  '自动切',
  'CNC',
  '冲床',
  '钻床',
  '端铣',
  '攻丝',
  '滚弯',
  '折弯',
  '焊接',
  '塑封',
  '去毛刺',
  '整形',
  '检验',
  '组装',
] as const
const JOB_OUTPUT_COLUMN_ORDER_MAP: ReadonlyMap<string, number> = new Map([
  ...JOB_OUTPUT_COLUMN_ORDER.map((jobName, index) => [jobName, index] as const),
  ['切割', 1],
])
const VIEWER_PRODUCTION_DETAIL_HIDDEN_COLUMN_KEYS: ReadonlySet<string> =
  new Set([
    'standardSeconds',
    'qualifiedHours',
    'defectHours',
    'workHours',
    'dataCategory',
  ])

const DENSE_TABLE_CELL_STYLE: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  padding: '4px 6px',
}

const DENSE_TABLE_STYLES = {
  root: {
    fontSize: 12,
    lineHeight: 1.2,
  },
} satisfies NonNullable<TableProps<OrderStatusDashboardItem>['styles']>

type ProductionDetailRow = OrderStatusProductionDetail & {
  key: string
}

type TransferDetailRow = OrderStatusMaterialTransferDetail & {
  key: string
}

type PrecisionCuttingDetailRow = OrderStatusPrecisionCuttingTransferDetail & {
  key: string
}

type OperationSummaryRow = {
  detailCount: number
  key: string
  operation: string
  qualifiedQuantity: number
}

type SelectedJobDetail = {
  jobName: string
  record: OrderStatusDashboardItem
}

type SelectedTransferDetail = {
  record: OrderStatusDashboardItem
}

type SelectedPrecisionCuttingDetail = {
  record: OrderStatusDashboardItem
}

type SearchValues = {
  customer: string
  materialCode: string
  model: string
  orderDate: string
  productionStatus: OrderProductionStatus | ''
  projectNo: string
}

type ColumnWidthMap = Record<string, number>

type ResizableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  columnKey?: string
  minWidth?: number
  onResizeColumn?: (columnKey: string, width: number) => void
  width?: number
}

function ResizableHeaderCell({
  children,
  columnKey,
  minWidth = MIN_RESIZABLE_COLUMN_WIDTH,
  onResizeColumn,
  style,
  width,
  ...props
}: ResizableHeaderCellProps) {
  function handleResizeStart(event: ReactMouseEvent<HTMLSpanElement>) {
    if (!columnKey || !onResizeColumn || typeof width !== 'number') {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = width
    const originalCursor = document.body.style.cursor
    const originalUserSelect = document.body.style.userSelect

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(
        minWidth,
        Math.round(startWidth + moveEvent.clientX - startX),
      )
      onResizeColumn(columnKey, nextWidth)
    }

    const handleResizeEnd = () => {
      document.body.style.cursor = originalCursor
      document.body.style.userSelect = originalUserSelect
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeEnd)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
  }

  return (
    <th
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    >
      <div
        style={{
          display: 'block',
          margin: '-4px -6px',
          padding: '4px 6px',
          position: 'relative',
        }}
      >
        {children}
        {columnKey && onResizeColumn ? (
          <span
            aria-label="调整列宽"
            role="separator"
            aria-orientation="vertical"
            onMouseDown={handleResizeStart}
            style={{
              bottom: 0,
              cursor: 'col-resize',
              position: 'absolute',
              right: -3,
              top: 0,
              width: 6,
              zIndex: 3,
            }}
          />
        ) : null}
      </div>
    </th>
  )
}

function DenseBodyCell({
  style,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    />
  )
}

const DENSE_TABLE_COMPONENTS = {
  body: { cell: DenseBodyCell },
  header: { cell: ResizableHeaderCell },
} satisfies NonNullable<TableProps<OrderStatusDashboardItem>['components']>

function getColumnKey<RecordType>(
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

function applyColumnWidths<RecordType>(
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
      onHeaderCell: () =>
        ({
          columnKey,
          minWidth: MIN_RESIZABLE_COLUMN_WIDTH,
          onResizeColumn,
          width,
        }) as ResizableHeaderCellProps,
    }
  })
}

function getTableColumnWidth<RecordType>(
  columns: TableColumnsType<RecordType>,
) {
  return columns.reduce((total, column) => {
    const width = column.width

    return total + (typeof width === 'number' ? width : 0)
  }, 0)
}

const EMPTY_SEARCH_VALUES: SearchValues = {
  customer: '',
  materialCode: '',
  model: '',
  orderDate: '',
  productionStatus: '',
  projectNo: '',
}

const STATUS_TABS: Array<{ key: WorkshopOrderStatus; label: string }> = [
  { key: '生产中', label: '生产中' },
  { key: '已结案', label: '已结案' },
]

function normalizeStatusTab(value: string | null): WorkshopOrderStatus {
  return value === '已结案' ? '已结案' : '生产中'
}

function canCloseDashboardOrder({
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

function normalizeProductionStatusFilter(
  value: string | null,
): OrderProductionStatus | '' {
  return value === '正常' || value === '预警' || value === '延期' ? value : ''
}

function renderText(value: string | number | null | undefined) {
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

function renderQuantity(value: number | null | undefined) {
  const normalizedValue = Number(value || 0)

  if (normalizedValue <= 0) {
    return <Text type="secondary">-</Text>
  }

  return <Text strong>{normalizedValue.toLocaleString()}</Text>
}

function renderDetailQuantity(value: number | null | undefined) {
  return Number(value || 0).toLocaleString()
}

function renderPercent(value: number | null) {
  if (value === null) {
    return <Text type="secondary">-</Text>
  }

  return `${value}%`
}

function renderHours(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return <Text type="secondary">-</Text>
  }

  return value.toFixed(2)
}

function renderTransferWorkshops(value: string[]) {
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

function renderTransferQuantityCell({
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

function renderPrecisionCuttingQuantityCell({
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

const REWORK_REPAIR_STATUS_KEYS = [
  'pendingProductionCount',
  'pendingTechnicalCount',
  'pendingQualityCount',
  'completedCount',
] as const

function renderReworkRepairStatus(reworkRepairInfo: ReworkRepairInfo) {
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

function renderJobOutputCell({
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
    return <Text type="secondary">-</Text>
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

function ProductionDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedJobDetail | null
  onClose: () => void
}) {
  const { role } = useAuth()
  const isViewer = isViewerRole(role)
  const rows = useMemo<ProductionDetailRow[]>(
    () =>
      (detail?.record.productionDetails ?? [])
        .filter((item) => item.jobName === detail?.jobName)
        .map((item) => ({ ...item, key: item.id })),
    [detail],
  )
  const operationSummaryRows = useMemo<OperationSummaryRow[]>(() => {
    const summaryMap = new Map<string, OperationSummaryRow>()

    for (const row of rows) {
      const operation = row.operation || '-'
      const current = summaryMap.get(operation) ?? {
        detailCount: 0,
        key: operation,
        operation,
        qualifiedQuantity: 0,
      }

      current.detailCount += 1
      current.qualifiedQuantity += row.qualifiedQuantity
      summaryMap.set(operation, current)
    }

    return Array.from(summaryMap.values()).sort((left, right) =>
      left.operation.localeCompare(right.operation),
    )
  }, [rows])
  const summary = useMemo(
    () => ({
      defectQuantity: rows.reduce(
        (total, item) => total + item.defectQuantity,
        0,
      ),
      incomingQuantity: rows.reduce(
        (total, item) => total + item.incomingQualifiedQuantity,
        0,
      ),
      qualifiedQuantity: rows.reduce(
        (total, item) => total + item.qualifiedQuantity,
        0,
      ),
    }),
    [rows],
  )
  const operationSummaryColumns: TableColumnsType<OperationSummaryRow> = [
    {
      title: '工序',
      dataIndex: 'operation',
      key: 'operation',
      width: 160,
      render: renderText,
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQuantity',
      key: 'qualifiedQuantity',
      width: 120,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '明细数',
      dataIndex: 'detailCount',
      key: 'detailCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
  ]
  const baseColumns: TableColumnsType<ProductionDetailRow> = [
    {
      title: '日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 110,
      fixed: 'left',
      render: renderText,
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 80,
      render: renderText,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: renderText,
    },
    {
      title: '岗位',
      dataIndex: 'jobName',
      key: 'jobName',
      width: 110,
      render: renderText,
    },
    {
      title: '工序',
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: renderText,
    },
    {
      title: '型号',
      dataIndex: 'productModel',
      key: 'productModel',
      width: 110,
      render: renderText,
    },
    {
      title: '客户型号',
      dataIndex: 'customerModel',
      key: 'customerModel',
      width: 120,
      render: renderText,
    },
    {
      title: '长度',
      dataIndex: 'lengthMm',
      key: 'lengthMm',
      width: 90,
      align: 'right',
      render: renderText,
    },
    {
      title: '设备',
      key: 'machine',
      width: 150,
      render: (_value, item) =>
        renderText(
          [item.unifiedDeviceNo, item.machineName].filter(Boolean).join(' / '),
        ),
    },
    {
      title: '来料接收数',
      dataIndex: 'incomingQualifiedQuantity',
      key: 'incomingQualifiedQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQuantity',
      key: 'qualifiedQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '不合格数量',
      dataIndex: 'defectQuantity',
      key: 'defectQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '加工不良',
      dataIndex: 'defectQuantity1',
      key: 'defectQuantity1',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '加工原因',
      dataIndex: 'defectReason1',
      key: 'defectReason1',
      width: 120,
      render: renderText,
    },
    {
      title: '原料不良',
      dataIndex: 'defectQuantity2',
      key: 'defectQuantity2',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '原料原因',
      dataIndex: 'defectReason2',
      key: 'defectReason2',
      width: 120,
      render: renderText,
    },
    {
      title: '外协不良',
      dataIndex: 'outsourceDefectQuantity',
      key: 'outsourceDefectQuantity',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '外协原因',
      dataIndex: 'outsourceDefectReason',
      key: 'outsourceDefectReason',
      width: 120,
      render: renderText,
    },
    {
      title: '外协单位',
      dataIndex: 'outsourceUnit',
      key: 'outsourceUnit',
      width: 120,
      render: renderText,
    },
    {
      title: '调机不良',
      dataIndex: 'setupDefectQuantity',
      key: 'setupDefectQuantity',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '调机负责人',
      dataIndex: 'setupResponsible',
      key: 'setupResponsible',
      width: 120,
      render: renderText,
    },
    {
      title: '标准工时(秒)',
      dataIndex: 'standardSeconds',
      key: 'standardSeconds',
      width: 110,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '合格工时(h)',
      dataIndex: 'qualifiedHours',
      key: 'qualifiedHours',
      width: 110,
      align: 'right',
      render: renderHours,
    },
    {
      title: '减分工时(h)',
      dataIndex: 'defectHours',
      key: 'defectHours',
      width: 110,
      align: 'right',
      render: renderHours,
    },
    {
      title: '工时(h)',
      dataIndex: 'workHours',
      key: 'workHours',
      width: 90,
      align: 'right',
      render: renderHours,
    },
    {
      title: '数据类别',
      dataIndex: 'dataCategory',
      key: 'dataCategory',
      width: 90,
      render: renderText,
    },
    {
      title: '录入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      render: renderText,
    },
  ]
  const columns = isViewer
    ? baseColumns.filter(
        (column) =>
          !VIEWER_PRODUCTION_DETAIL_HIDDEN_COLUMN_KEYS.has(
            getColumnKey(column),
          ),
      )
    : baseColumns
  const productionDetailScrollX = getTableColumnWidth(columns)

  return (
    <Modal
      open={Boolean(detail)}
      title={
        detail
          ? `${detail.record.project_no || '-'} / ${detail.jobName} 岗位生产工单明细`
          : '生产工单明细'
      }
      footer={null}
      width={1280}
      destroyOnHidden
      onCancel={onClose}
    >
      {detail && (
        <div className="space-y-4">
          <Space size={8} wrap>
            <Tag color="blue">明细 {rows.length}</Tag>
            <Tag color="cyan">工序 {operationSummaryRows.length}</Tag>
            <Tag color="green">
              合格 {summary.qualifiedQuantity.toLocaleString()}
            </Tag>
            <Tag color="gold">
              来料 {summary.incomingQuantity.toLocaleString()}
            </Tag>
            <Tag color={summary.defectQuantity > 0 ? 'red' : 'default'}>
              不合格 {summary.defectQuantity.toLocaleString()}
            </Tag>
          </Space>

          <Table<OperationSummaryRow>
            rowKey="key"
            bordered
            size="small"
            columns={operationSummaryColumns}
            dataSource={operationSummaryRows}
            pagination={false}
            scroll={{ x: 370 }}
          />

          <Table<ProductionDetailRow>
            rowKey="key"
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: productionDetailScrollX, y: 360 }}
          />
        </div>
      )}
    </Modal>
  )
}

function TransferDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedTransferDetail | null
  onClose: () => void
}) {
  const rows = useMemo<TransferDetailRow[]>(
    () =>
      (detail?.record.transferDetails ?? []).map((item, index) => ({
        ...item,
        key: `${item.createdAt}-${index}`,
      })),
    [detail],
  )
  const summary = useMemo(
    () => ({
      auditedCount: rows.filter((item) => item.isAudited).length,
      transferQuantity: rows.reduce(
        (total, item) => total + item.transferQuantity,
        0,
      ),
      unauditedCount: rows.filter((item) => !item.isAudited).length,
    }),
    [rows],
  )
  const columns: TableColumnsType<TransferDetailRow> = [
    {
      title: '转移时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      fixed: 'left',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '接收车间',
      dataIndex: 'targetWorkshop',
      key: 'targetWorkshop',
      width: 120,
      render: renderText,
    },
    {
      title: '转移数量',
      dataIndex: 'transferQuantity',
      key: 'transferQuantity',
      width: 110,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '操作人',
      dataIndex: 'operatorNames',
      key: 'operatorNames',
      width: 180,
      render: (value: string[]) => renderText(value.join('、')),
    },
    {
      title: '接收人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      width: 120,
      render: renderText,
    },
    {
      title: '审核状态',
      dataIndex: 'isAudited',
      key: 'isAudited',
      width: 100,
      align: 'center',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'gold'}>
          {value ? '已审核' : '未审核'}
        </Tag>
      ),
    },
  ]

  return (
    <Modal
      open={Boolean(detail)}
      title={
        detail
          ? `${detail.record.project_no || '-'} 物料转移明细`
          : '物料转移明细'
      }
      footer={null}
      width={920}
      destroyOnHidden
      onCancel={onClose}
    >
      {detail && (
        <div className="space-y-4">
          <Space size={8} wrap>
            <Tag color="blue">记录 {rows.length}</Tag>
            <Tag color="purple">
              转移 {summary.transferQuantity.toLocaleString()}
            </Tag>
            <Tag color="green">已审核 {summary.auditedCount}</Tag>
            <Tag color={summary.unauditedCount > 0 ? 'gold' : 'default'}>
              未审核 {summary.unauditedCount}
            </Tag>
          </Space>

          <Table<TransferDetailRow>
            rowKey="key"
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 780, y: 420 }}
          />
        </div>
      )}
    </Modal>
  )
}

function PrecisionCuttingDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedPrecisionCuttingDetail | null
  onClose: () => void
}) {
  const rows = useMemo<PrecisionCuttingDetailRow[]>(
    () =>
      (detail?.record.precisionCuttingDetails ?? []).map((item) => ({
        ...item,
        key: item.id,
      })),
    [detail],
  )
  const summary = useMemo(
    () => ({
      auditedCount: rows.filter((item) => item.isAudited).length,
      defectQuantity: rows.reduce(
        (total, item) =>
          total +
          item.rawMaterialDefectCount +
          item.processingDefectCount +
          item.outsourceDefectQuantity,
        0,
      ),
      longMaterialQuantity: rows.reduce(
        (total, item) => total + item.longMaterialQuantity,
        0,
      ),
      transferQuantity: rows.reduce(
        (total, item) => total + item.transferQuantity,
        0,
      ),
      unauditedCount: rows.filter((item) => !item.isAudited).length,
    }),
    [rows],
  )
  const columns: TableColumnsType<PrecisionCuttingDetailRow> = [
    {
      title: '转移时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      fixed: 'left',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '接收车间',
      dataIndex: 'targetWorkshop',
      key: 'targetWorkshop',
      width: 100,
      render: renderText,
    },
    {
      title: '精切数量',
      dataIndex: 'transferQuantity',
      key: 'transferQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '长料长度',
      dataIndex: 'longMaterialLengthMm',
      key: 'longMaterialLengthMm',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '长料支数',
      dataIndex: 'longMaterialQuantity',
      key: 'longMaterialQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '原料不良',
      dataIndex: 'rawMaterialDefectCount',
      key: 'rawMaterialDefectCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '加工不良',
      dataIndex: 'processingDefectCount',
      key: 'processingDefectCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '外协不良',
      dataIndex: 'outsourceDefectQuantity',
      key: 'outsourceDefectQuantity',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '不良原因',
      dataIndex: 'defectReason',
      key: 'defectReason',
      width: 120,
      render: renderText,
    },
    {
      title: '责任工序',
      dataIndex: 'responsibleProcess',
      key: 'responsibleProcess',
      width: 110,
      render: renderText,
    },
    {
      title: '责任人',
      dataIndex: 'processOwner',
      key: 'processOwner',
      width: 100,
      render: renderText,
    },
    {
      title: '操作人',
      dataIndex: 'operatorNames',
      key: 'operatorNames',
      width: 140,
      render: (value: string[]) => renderText(value.join('、')),
    },
    {
      title: '接收人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      width: 100,
      render: renderText,
    },
    {
      title: '审核状态',
      dataIndex: 'isAudited',
      key: 'isAudited',
      width: 90,
      align: 'center',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'gold'}>
          {value ? '已审核' : '未审核'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 160,
      render: renderText,
    },
  ]

  return (
    <Modal
      open={Boolean(detail)}
      title={
        detail ? `${detail.record.project_no || '-'} 精切明细` : '精切明细'
      }
      footer={null}
      width={1180}
      destroyOnHidden
      onCancel={onClose}
    >
      {detail && (
        <div className="space-y-4">
          <Space size={8} wrap>
            <Tag color="blue">记录 {rows.length}</Tag>
            <Tag color="purple">
              精切 {summary.transferQuantity.toLocaleString()}
            </Tag>
            <Tag color="cyan">
              长料 {summary.longMaterialQuantity.toLocaleString()}
            </Tag>
            <Tag color={summary.defectQuantity > 0 ? 'red' : 'default'}>
              不良 {summary.defectQuantity.toLocaleString()}
            </Tag>
            <Tag color="green">已审核 {summary.auditedCount}</Tag>
            <Tag color={summary.unauditedCount > 0 ? 'gold' : 'default'}>
              未审核 {summary.unauditedCount}
            </Tag>
          </Space>

          <Table<PrecisionCuttingDetailRow>
            rowKey="key"
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 1640, y: 420 }}
          />
        </div>
      )}
    </Modal>
  )
}

export default function OrderStatusDashboard() {
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()
  const canManageStatus = usePermission('feature:workshop-order.manage-status')
  const { mutateAsync: updateOrderStatuses, isPending: isUpdatingOrderStatus } =
    useBatchUpdateWorkshopOrderStatuses()
  const [selectedJobDetail, setSelectedJobDetail] =
    useState<SelectedJobDetail | null>(null)
  const [selectedTransferDetail, setSelectedTransferDetail] =
    useState<SelectedTransferDetail | null>(null)
  const [selectedPrecisionCuttingDetail, setSelectedPrecisionCuttingDetail] =
    useState<SelectedPrecisionCuttingDetail | null>(null)
  const [columnWidths, setColumnWidths] = useState<ColumnWidthMap>({})
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE
  const activeStatus = normalizeStatusTab(searchParams.get('status'))
  const searchParamValues = useMemo<SearchValues>(
    () => ({
      customer: searchParams.get('customer')?.trim() ?? '',
      materialCode: searchParams.get('materialCode')?.trim() ?? '',
      orderDate: searchParams.get('orderDate')?.trim() ?? '',
      productionStatus: normalizeProductionStatusFilter(
        searchParams.get('productionStatus'),
      ),
      projectNo: searchParams.get('projectNo')?.trim() ?? '',
      model: searchParams.get('model')?.trim() ?? '',
    }),
    [searchParams],
  )
  const [searchValues, setSearchValues] =
    useState<SearchValues>(searchParamValues)
  const { data: modelOptions = [] } = useWorkshopOrderModels()
  const modelFilterValues = useMemo(
    () => normalizeSearchKeywords(searchParamValues.model) ?? [],
    [searchParamValues.model],
  )
  const filters = useMemo(
    () => ({
      customer: searchParamValues.customer || undefined,
      materialCode: searchParamValues.materialCode || undefined,
      orderDate: searchParamValues.orderDate || undefined,
      productionStatus: searchParamValues.productionStatus || undefined,
      projectNo: searchParamValues.projectNo || undefined,
      model: searchParamValues.model || undefined,
      status: activeStatus,
    }),
    [activeStatus, searchParamValues],
  )
  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      headerHeight: 32,
      targetRowCount: Math.min(pageSize, 14),
      minRowHeight: 30,
    })
  const { data, isLoading, isFetching, refetch } = useOrderStatusDashboard({
    page,
    pageSize,
    filters,
  })
  const isDataLoading = isLoading || isFetching

  const rows = data?.items ?? []
  const jobColumns = data?.jobColumns ?? EMPTY_JOB_COLUMNS
  const openJobDetail = useCallback(
    (record: OrderStatusDashboardItem, jobName: string) => {
      setSelectedJobDetail({ record, jobName })
    },
    [],
  )
  const openTransferDetail = useCallback((record: OrderStatusDashboardItem) => {
    setSelectedTransferDetail({ record })
  }, [])
  const openPrecisionCuttingDetail = useCallback(
    (record: OrderStatusDashboardItem) => {
      setSelectedPrecisionCuttingDetail({ record })
    },
    [],
  )
  const handleResizeColumn = useCallback((columnKey: string, width: number) => {
    setColumnWidths((current) => {
      if (current[columnKey] === width) {
        return current
      }

      return { ...current, [columnKey]: width }
    })
  }, [])
  const handleCloseOrder = useCallback(
    (record: OrderStatusDashboardItem) => {
      if (!record.id) {
        message.error('当前订单缺少 ID，无法结案')
        return
      }

      const orderLabel = record.project_no || '当前订单'

      modal.confirm({
        title: '确认结案',
        content:
          `确定将订单 ${orderLabel} 标记为已结案吗？` +
          '结案后新增生产工单时将无法再关联该订单。',
        okText: '确认结案',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          setClosingOrderId(record.id!)

          try {
            await updateOrderStatuses({
              ids: [record.id!],
              status: '已结案',
            })
            await queryClient.invalidateQueries({
              queryKey: [ORDER_STATUS_DASHBOARD_KEY],
            })
            message.success('订单已结案')
          } catch (error) {
            message.error(
              error instanceof Error
                ? error.message
                : '订单结案失败，请稍后重试',
            )
          } finally {
            setClosingOrderId(null)
          }
        },
      })
    },
    [message, modal, queryClient, updateOrderStatuses],
  )

  const columns = useMemo<TableColumnsType<OrderStatusDashboardItem>>(() => {
    const baseColumns: TableColumnsType<OrderStatusDashboardItem> = [
      {
        title: '序号',
        key: 'index',
        width: 46,
        fixed: 'left',
        align: 'center',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 132,
        fixed: 'left',
        sorter: (left, right) =>
          String(left.project_no || '').localeCompare(
            String(right.project_no || ''),
            'zh-CN',
            {
              numeric: true,
              sensitivity: 'base',
            },
          ),
        sortDirections: ['ascend', 'descend'],
        render: renderText,
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 94,
        fixed: 'left',
        filters: modelOptions.map((model) => ({ text: model, value: model })),
        filteredValue: modelFilterValues.length ? modelFilterValues : null,
        filterMultiple: true,
        filterSearch: true,
        render: renderText,
      },
      {
        title: '长度',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 64,
        fixed: 'left',
        align: 'right',
        render: renderText,
      },
      {
        title: '订单数量',
        dataIndex: 'order_quantity',
        key: 'order_quantity',
        width: 76,
        fixed: 'left',
        align: 'right',
        render: renderQuantity,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 88,
        render: renderText,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 108,
        render: renderText,
      },
      {
        title: '交货日期',
        dataIndex: 'product_delivery_date',
        key: 'product_delivery_date',
        width: 88,
        render: renderText,
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 112,
        render: renderText,
      },
      {
        title: '图材质',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 88,
        render: renderText,
      },
    ]

    const sortedJobColumns = [...jobColumns]
      .filter((column) => column.key !== '精切')
      .sort((left, right) => {
        const leftOrder =
          JOB_OUTPUT_COLUMN_ORDER_MAP.get(left.key) ?? Number.MAX_SAFE_INTEGER
        const rightOrder =
          JOB_OUTPUT_COLUMN_ORDER_MAP.get(right.key) ?? Number.MAX_SAFE_INTEGER

        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder
        }

        return left.title.localeCompare(right.title, 'zh-Hans-CN')
      })
    const sortedJobOutputColumns: TableColumnsType<OrderStatusDashboardItem> =
      sortedJobColumns.map((column) => ({
        title: column.title,
        key: `job-${column.key}`,
        width: JOB_OUTPUT_COLUMN_WIDTH,
        align: 'right',
        render: (_value: unknown, record: OrderStatusDashboardItem) =>
          renderJobOutputCell({
            jobName: column.key,
            onOpen: openJobDetail,
            record,
          }),
      }))

    const outputColumns: TableColumnsType<OrderStatusDashboardItem> = [
      {
        title: '精切',
        dataIndex: 'precisionCuttingQuantity',
        key: 'precisionCuttingQuantity',
        width: 68,
        align: 'right',
        render: (_value, record) =>
          renderPrecisionCuttingQuantityCell({
            onOpen: openPrecisionCuttingDetail,
            record,
          }),
      },
      ...sortedJobOutputColumns,
    ]

    const statusColumns: TableColumnsType<OrderStatusDashboardItem> = [
      {
        title: '物料转移数量',
        dataIndex: 'transferQuantity',
        key: 'transferQuantity',
        width: 94,
        align: 'right',
        render: (_value, record) =>
          renderTransferQuantityCell({
            onOpen: openTransferDetail,
            record,
          }),
      },
      {
        title: '接收车间',
        dataIndex: 'transferWorkshops',
        key: 'transferWorkshops',
        width: 118,
        render: renderTransferWorkshops,
      },
      {
        title: '返工返修',
        key: 'reworkRepairStatus',
        width: 260,
        align: 'center',
        render: (_value, record) =>
          renderReworkRepairStatus(record.reworkRepairInfo),
      },
      {
        title: '成品率',
        dataIndex: 'yieldRate',
        key: 'yieldRate',
        width: 68,
        align: 'right',
        render: renderPercent,
      },
      {
        title: '完工率（%）',
        dataIndex: 'completionRate',
        key: 'completionRate',
        width: 82,
        align: 'right',
        render: renderPercent,
      },
      {
        title: '生产状态',
        dataIndex: 'productionStatus',
        key: 'productionStatus',
        width: 156,
        fixed: 'right',
        align: 'center',
        render: (value: OrderProductionStatus, record) => {
          const canCloseOrder = canCloseDashboardOrder({
            canManageStatus,
            record,
          })

          return (
            <Space size={4} wrap>
              <Tag color={STATUS_COLOR[value]}>{value}</Tag>
              {record.status && <Tag>{record.status}</Tag>}
              {canCloseOrder ? (
                <Button
                  type="primary"
                  danger
                  size="small"
                  loading={
                    isUpdatingOrderStatus && closingOrderId === record.id
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    handleCloseOrder(record)
                  }}
                >
                  结案
                </Button>
              ) : null}
            </Space>
          )
        },
      },
    ]

    return applyColumnWidths(
      [...baseColumns, ...outputColumns, ...statusColumns],
      columnWidths,
      handleResizeColumn,
    )
  }, [
    columnWidths,
    canManageStatus,
    closingOrderId,
    handleResizeColumn,
    handleCloseOrder,
    isUpdatingOrderStatus,
    jobColumns,
    modelFilterValues,
    modelOptions,
    openJobDetail,
    openPrecisionCuttingDetail,
    openTransferDetail,
    page,
    pageSize,
  ])

  const tableWidth = getTableColumnWidth(columns)

  useEffect(() => {
    setSearchValues(searchParamValues)
  }, [searchParamValues])

  function updateSearchParamValue<TKey extends keyof SearchValues>(
    key: TKey,
    value: SearchValues[TKey],
  ) {
    setSearchValues((current) => ({ ...current, [key]: value }))
  }

  function setOrDeleteParam(
    params: URLSearchParams,
    key: keyof SearchValues,
    value: string,
  ) {
    const normalizedValue = value.trim()

    if (normalizedValue) {
      params.set(key, normalizedValue)
    } else {
      params.delete(key)
    }
  }

  function handleSearch() {
    const next = new URLSearchParams(searchParams)

    setOrDeleteParam(next, 'customer', searchValues.customer)
    setOrDeleteParam(next, 'materialCode', searchValues.materialCode)
    setOrDeleteParam(next, 'orderDate', searchValues.orderDate)
    setOrDeleteParam(next, 'productionStatus', searchValues.productionStatus)
    setOrDeleteParam(next, 'projectNo', searchValues.projectNo)
    setOrDeleteParam(next, 'model', searchValues.model)
    next.set('page', '1')
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedPrecisionCuttingDetail(null)
    setSelectedTransferDetail(null)
  }

  function handleResetSearch() {
    const next = new URLSearchParams(searchParams)

    next.delete('customer')
    next.delete('materialCode')
    next.delete('orderDate')
    next.delete('productionStatus')
    next.delete('projectNo')
    next.delete('model')
    next.set('page', '1')
    setSearchValues(EMPTY_SEARCH_VALUES)
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedPrecisionCuttingDetail(null)
    setSelectedTransferDetail(null)
  }

  const handleTableChange: TableProps<OrderStatusDashboardItem>['onChange'] = (
    _pagination,
    tableFilters,
    _sorter,
    extra,
  ) => {
    if (extra.action !== 'filter') {
      return
    }

    const selectedModels = (tableFilters.product_model ?? [])
      .map(String)
      .filter(Boolean)
    const next = new URLSearchParams(searchParams)
    const modelValue = selectedModels.join(',')

    setOrDeleteParam(next, 'model', modelValue)
    next.set('page', '1')
    setSearchValues((current) => ({ ...current, model: modelValue }))
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedPrecisionCuttingDetail(null)
    setSelectedTransferDetail(null)
  }

  function handleStatusTabChange(nextStatus: string) {
    const normalizedStatus = normalizeStatusTab(nextStatus)
    const next = new URLSearchParams(searchParams)

    if (normalizedStatus === '生产中') {
      next.delete('status')
    } else {
      next.set('status', normalizedStatus)
    }

    next.set('page', '1')
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedPrecisionCuttingDetail(null)
    setSelectedTransferDetail(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <Title level={4} className="mb-0!">
            订单现状
          </Title>
        </div>
        <Space size={8} wrap>
          <Tag color="blue">订单 {data?.total ?? 0}</Tag>
          <Tag color="cyan">岗位 {jobColumns.length}</Tag>
          <Tag color="green">明细 {data?.productionItemCount ?? 0}</Tag>
          <Tag color="purple">转移 {data?.materialTransferCount ?? 0}</Tag>
          <Button
            size="small"
            icon={<ArrowPathIcon className="size-4" />}
            loading={isFetching && !isLoading}
            onClick={() => void refetch()}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeStatus}
        items={STATUS_TABS}
        onChange={handleStatusTabChange}
        tabBarStyle={{ marginBottom: 0 }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Text type="secondary">搜索：</Text>
        <Input
          allowClear
          placeholder="交货日期"
          value={searchValues.orderDate}
          onChange={(event) =>
            updateSearchParamValue('orderDate', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Input
          allowClear
          placeholder="项目号"
          value={searchValues.projectNo}
          onChange={(event) =>
            updateSearchParamValue('projectNo', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Input
          allowClear
          placeholder="客户"
          value={searchValues.customer}
          onChange={(event) =>
            updateSearchParamValue('customer', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Input
          allowClear
          placeholder="型号"
          value={searchValues.model}
          onChange={(event) =>
            updateSearchParamValue('model', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Input
          allowClear
          placeholder="料号"
          value={searchValues.materialCode}
          onChange={(event) =>
            updateSearchParamValue('materialCode', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Select
          allowClear
          placeholder="生产状态"
          value={searchValues.productionStatus || undefined}
          options={PRODUCTION_STATUS_OPTIONS}
          onChange={(value) =>
            updateSearchParamValue('productionStatus', value ?? '')
          }
          style={{ width: 140 }}
        />
        <Button
          type="primary"
          icon={<MagnifyingGlassIcon className="size-4" />}
          loading={isFetching && !isLoading}
          onClick={handleSearch}
        >
          搜索
        </Button>
        <Button
          icon={<XMarkIcon className="size-4" />}
          onClick={handleResetSearch}
        >
          重置
        </Button>
      </div>

      <div
        ref={tableContainerRef}
        className="min-h-0 flex-1 overflow-auto pb-3"
      >
        <Table<OrderStatusDashboardItem>
          rowKey="id"
          bordered
          size="small"
          components={DENSE_TABLE_COMPONENTS}
          loading={{ spinning: isDataLoading, tip: '数据加载中...' }}
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{
            x: tableWidth,
            y: scrollY,
            scrollToFirstRowOnChange: true,
          }}
          onChange={handleTableChange}
          styles={DENSE_TABLE_STYLES}
          sticky={{ offsetScroll: 8 }}
          rowClassName={(record) =>
            record.productionStatus === '延期'
              ? 'bg-red-50'
              : record.productionStatus === '预警'
                ? 'bg-amber-50'
                : ''
          }
          onRow={() => ({ style: { height: rowHeight } })}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination
          total={data?.total ?? 0}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          pageSizeOptions={['10', '20', '50']}
        />
      </div>

      <ProductionDetailModal
        detail={selectedJobDetail}
        onClose={() => setSelectedJobDetail(null)}
      />
      <TransferDetailModal
        detail={selectedTransferDetail}
        onClose={() => setSelectedTransferDetail(null)}
      />
      <PrecisionCuttingDetailModal
        detail={selectedPrecisionCuttingDetail}
        onClose={() => setSelectedPrecisionCuttingDetail(null)}
      />
    </div>
  )
}
