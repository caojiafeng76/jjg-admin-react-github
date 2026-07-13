import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType, TableProps } from 'antd'
import {
  App,
  Button,
  DatePicker,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import { isAdminRole, isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import {
  useBatchUpdateWorkshopOrderStatuses,
  useWorkshopOrderModels,
} from '@/features/workshop/OrderList/useWorkshopOrders'
import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  OrderProductionStatus,
  OrderStatusDashboardItem,
  OrderStatusExtrusionDetail,
  OrderStatusJobColumn,
  OrderStatusMaterialTransferDetail,
  OrderStatusPrecisionCuttingTransferDetail,
  OrderStatusProductionDetail,
  ReworkRepairInfo,
} from '@/services/apiOrderStatusDashboard'
import { getOrderStatusDashboardForExport } from '@/services/apiOrderStatusDashboard'
import AppPagination from '@/ui/AppPagination'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import {
  ORDER_STATUS_DASHBOARD_KEY,
  REWORK_REPAIR_STATUS_COLORS,
  REWORK_REPAIR_STATUS_LABELS,
  useOrderStatusDashboard,
} from './useOrderStatusDashboard'
import {
  applyColumnWidths,
  canCloseDashboardOrder,
  DEFAULT_PAGE_SIZE,
  EMPTY_SEARCH_VALUES,
  extractNumberFilters,
  extractTextFilters,
  getColumnKey,
  getTableColumnWidth,
  MIN_RESIZABLE_COLUMN_WIDTH,
  normalizeProductionStatusFilter,
  normalizeStatusTab,
  PRODUCTION_STATUS_OPTIONS,
  STATUS_TABS,
  type ColumnWidthMap,
  type SearchValues,
} from './dashboardUtils'

const { Text, Title } = Typography

const loadOrderStatusDashboardExcel = () =>
  import('@/utils/orderStatusDashboardExcel')

const preloadOrderStatusDashboardExcel = () => {
  void loadOrderStatusDashboardExcel()
}

const EMPTY_JOB_COLUMNS: OrderStatusJobColumn[] = []

const STATUS_COLOR: Record<OrderProductionStatus, string> = {
  正常: 'green',
  预警: 'gold',
  延期: 'red',
}

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
  '包装',
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

type SelectedExtrusionDetail = {
  record: OrderStatusDashboardItem
}

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

function renderExtrusionQuantityCell({
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
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/30">
            <svg
              className="size-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              {detail
                ? `${detail.record.project_no || '-'} / ${detail.jobName} 岗位生产工单明细`
                : '生产工单明细'}
            </span>
          </div>
        </div>
      }
      footer={null}
      width={1280}
      destroyOnHidden
      onCancel={onClose}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!rounded-t-2xl [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-100 [&_.ant-modal-header]:!bg-gradient-to-r [&_.ant-modal-header]:!from-slate-50 [&_.ant-modal-header]:!to-white"
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-3 py-1.5 ring-1 ring-blue-100/80">
              <span className="text-xs font-medium text-blue-600">明细</span>
              <span className="text-xs font-bold text-blue-700 tabular-nums">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80">
              <span className="text-xs font-medium text-cyan-600">工序</span>
              <span className="text-xs font-bold text-cyan-700 tabular-nums">
                {operationSummaryRows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80">
              <span className="text-xs font-medium text-emerald-600">合格</span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                {summary.qualifiedQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80">
              <span className="text-xs font-medium text-amber-600">来料</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums">
                {summary.incomingQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50/80 px-3 py-1.5 ring-1 ring-red-100/80">
              <span className="text-xs font-medium text-red-600">不合格</span>
              <span className="text-xs font-bold text-red-700 tabular-nums">
                {summary.defectQuantity.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 工序汇总表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                工序汇总
              </span>
            </div>
            <Table<OperationSummaryRow>
              rowKey="key"
              bordered
              size="small"
              columns={operationSummaryColumns}
              dataSource={operationSummaryRows}
              pagination={false}
              scroll={{ x: 370 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>

          {/* 详细数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                详细记录
              </span>
            </div>
            <Table<ProductionDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: productionDetailScrollX, y: 360 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>
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
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 shadow-md shadow-purple-500/30">
            <svg
              className="size-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              {detail
                ? `${detail.record.project_no || '-'} 物料转移明细`
                : '物料转移明细'}
            </span>
          </div>
        </div>
      }
      footer={null}
      width={920}
      destroyOnHidden
      onCancel={onClose}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!rounded-t-2xl [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-100 [&_.ant-modal-header]:!bg-gradient-to-r [&_.ant-modal-header]:!from-slate-50 [&_.ant-modal-header]:!to-white"
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80">
              <span className="text-xs font-medium text-purple-600">记录</span>
              <span className="text-xs font-bold text-purple-700 tabular-nums">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-pink-50/80 px-3 py-1.5 ring-1 ring-pink-100/80">
              <span className="text-xs font-medium text-pink-600">转移</span>
              <span className="text-xs font-bold text-pink-700 tabular-nums">
                {summary.transferQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80">
              <span className="text-xs font-medium text-emerald-600">
                已审核
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                {summary.auditedCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80">
              <span className="text-xs font-medium text-amber-600">未审核</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums">
                {summary.unauditedCount}
              </span>
            </div>
          </div>

          {/* 数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                转移记录
              </span>
            </div>
            <Table<TransferDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 780, y: 420 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>
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
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 shadow-md shadow-cyan-500/30">
            <svg
              className="size-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              {detail
                ? `${detail.record.project_no || '-'} 精切明细`
                : '精切明细'}
            </span>
          </div>
        </div>
      }
      footer={null}
      width={1180}
      destroyOnHidden
      onCancel={onClose}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!rounded-t-2xl [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-100 [&_.ant-modal-header]:!bg-gradient-to-r [&_.ant-modal-header]:!from-slate-50 [&_.ant-modal-header]:!to-white"
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80">
              <span className="text-xs font-medium text-cyan-600">记录</span>
              <span className="text-xs font-bold text-cyan-700 tabular-nums">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80">
              <span className="text-xs font-medium text-purple-600">精切</span>
              <span className="text-xs font-bold text-purple-700 tabular-nums">
                {summary.transferQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-teal-50/80 px-3 py-1.5 ring-1 ring-teal-100/80">
              <span className="text-xs font-medium text-teal-600">长料</span>
              <span className="text-xs font-bold text-teal-700 tabular-nums">
                {summary.longMaterialQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50/80 px-3 py-1.5 ring-1 ring-red-100/80">
              <span className="text-xs font-medium text-red-600">不良</span>
              <span className="text-xs font-bold text-red-700 tabular-nums">
                {summary.defectQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80">
              <span className="text-xs font-medium text-emerald-600">
                已审核
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                {summary.auditedCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80">
              <span className="text-xs font-medium text-amber-600">未审核</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums">
                {summary.unauditedCount}
              </span>
            </div>
          </div>

          {/* 数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                精切记录
              </span>
            </div>
            <Table<PrecisionCuttingDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 1640, y: 420 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

type ExtrusionDetailRow = OrderStatusExtrusionDetail & {
  key: string
}

function ExtrusionDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedExtrusionDetail | null
  onClose: () => void
}) {
  const rows = useMemo<ExtrusionDetailRow[]>(
    () =>
      (detail?.record.extrusionDetails ?? []).map((item, index) => ({
        ...item,
        key: `${item.createdAt}-${index}`,
      })),
    [detail],
  )
  const totalTheoreticalCount = rows.reduce(
    (total, item) => total + item.theoreticalOutputCount,
    0,
  )
  const totalActualOutputWeight = rows.reduce(
    (total, item) => total + item.actualOutputWeightKg,
    0,
  )
  const weightedYield =
    totalTheoreticalCount > 0
      ? rows.reduce(
          (sum, item) => sum + item.materialYield * item.theoreticalOutputCount,
          0,
        ) / totalTheoreticalCount
      : 0

  const columns: TableColumnsType<ExtrusionDetailRow> = [
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 110,
      fixed: 'left',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 70,
      render: renderText,
    },
    {
      title: '班组长',
      dataIndex: 'shiftLeaderName',
      key: 'shiftLeaderName',
      width: 100,
      render: renderText,
    },
    {
      title: '实际产出长度(mm)',
      dataIndex: 'actualOutputLengthMm',
      key: 'actualOutputLengthMm',
      width: 130,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '订单要求长度(mm)',
      dataIndex: 'orderLengthMm',
      key: 'orderLengthMm',
      width: 130,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '实际产出数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 110,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '理论支数',
      dataIndex: 'theoreticalOutputCount',
      key: 'theoreticalOutputCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '实际产出重量(kg)',
      dataIndex: 'actualOutputWeightKg',
      key: 'actualOutputWeightKg',
      width: 140,
      align: 'right',
      render: (value: number) => Number(value || 0).toFixed(2),
    },
    {
      title: '成材率(%)',
      dataIndex: 'materialYield',
      key: 'materialYield',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? `${value.toFixed(2)}%` : '-'),
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
  ]

  return (
    <Modal
      open={Boolean(detail)}
      title={
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30">
            <svg
              className="size-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              {detail
                ? `${detail.record.project_no || '-'} 挤压明细`
                : '挤压明细'}
            </span>
          </div>
        </div>
      }
      footer={null}
      width={1180}
      destroyOnHidden
      onCancel={onClose}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!rounded-t-2xl [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-100 [&_.ant-modal-header]:!bg-gradient-to-r [&_.ant-modal-header]:!from-slate-50 [&_.ant-modal-header]:!to-white"
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80">
              <span className="text-xs font-medium text-amber-600">记录</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80">
              <span className="text-xs font-medium text-purple-600">
                理论支数
              </span>
              <span className="text-xs font-bold text-purple-700 tabular-nums">
                {totalTheoreticalCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-orange-50/80 px-3 py-1.5 ring-1 ring-orange-100/80">
              <span className="text-xs font-medium text-orange-600">
                实际重量
              </span>
              <span className="text-xs font-bold text-orange-700 tabular-nums">
                {totalActualOutputWeight.toFixed(2)} kg
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80">
              <span className="text-xs font-medium text-emerald-600">
                加权成材率
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">
                {totalTheoreticalCount > 0
                  ? `${weightedYield.toFixed(2)}%`
                  : '-'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80">
              <span className="text-xs font-medium text-cyan-600">已审核</span>
              <span className="text-xs font-bold text-cyan-700 tabular-nums">
                {rows.filter((item) => item.isAudited).length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-pink-50/80 px-3 py-1.5 ring-1 ring-pink-100/80">
              <span className="text-xs font-medium text-pink-600">未审核</span>
              <span className="text-xs font-bold text-pink-700 tabular-nums">
                {rows.filter((item) => !item.isAudited).length}
              </span>
            </div>
          </div>

          {/* 数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                挤压记录
              </span>
            </div>
            <Table<ExtrusionDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 1060, y: 420 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function OrderStatusDashboard() {
  const { message, modal } = App.useApp()
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const canManageStatus = usePermission('feature:workshop-order.manage-status')
  const canExportCurrentFilters = isAdminRole(role)
  const { mutateAsync: updateOrderStatuses, isPending: isUpdatingOrderStatus } =
    useBatchUpdateWorkshopOrderStatuses()
  const [selectedJobDetail, setSelectedJobDetail] =
    useState<SelectedJobDetail | null>(null)
  const [selectedTransferDetail, setSelectedTransferDetail] =
    useState<SelectedTransferDetail | null>(null)
  const [selectedPrecisionCuttingDetail, setSelectedPrecisionCuttingDetail] =
    useState<SelectedPrecisionCuttingDetail | null>(null)
  const [selectedExtrusionDetail, setSelectedExtrusionDetail] =
    useState<SelectedExtrusionDetail | null>(null)
  const [columnWidths, setColumnWidths] = useState<ColumnWidthMap>({})
  const [closingOrderId, setClosingOrderId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
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
      gap: 12,
    })
  const { data, isLoading, isFetching, refetch } = useOrderStatusDashboard({
    page,
    pageSize,
    filters,
  })
  const isDataLoading = isLoading || isFetching

  const rows = useMemo(() => data?.items ?? [], [data?.items])
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
  const openExtrusionDetail = useCallback(
    (record: OrderStatusDashboardItem) => {
      setSelectedExtrusionDetail({ record })
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
        filters: extractTextFilters(rows, (r) => r.project_no),
        onFilter: (value, record) =>
          (record.project_no?.trim() ?? '') === (value as string),
        filterSearch: true,
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
        filters: extractNumberFilters(rows, (r) => Number(r.length_mm || 0)),
        onFilter: (value, record) =>
          Number(record.length_mm || 0) === (value as number),
        filterSearch: true,
        render: renderText,
      },
      {
        title: '订单数量',
        dataIndex: 'order_quantity',
        key: 'order_quantity',
        width: 76,
        fixed: 'left',
        align: 'right',
        filters: extractNumberFilters(rows, (r) =>
          Number(r.order_quantity || 0),
        ),
        onFilter: (value, record) =>
          Number(record.order_quantity || 0) === (value as number),
        filterSearch: true,
        render: renderQuantity,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 88,
        filters: extractTextFilters(rows, (r) => r.customer),
        onFilter: (value, record) =>
          (record.customer?.trim() ?? '') === (value as string),
        filterSearch: true,
        render: renderText,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 108,
        filters: extractTextFilters(rows, (r) => r.customer_model),
        onFilter: (value, record) =>
          (record.customer_model?.trim() ?? '') === (value as string),
        filterSearch: true,
        render: renderText,
      },
      {
        title: '交货日期',
        dataIndex: 'product_delivery_date',
        key: 'product_delivery_date',
        width: 88,
        filters: extractTextFilters(rows, (r) => r.product_delivery_date),
        onFilter: (value, record) =>
          (record.product_delivery_date ?? '') === (value as string),
        filterSearch: true,
        render: renderText,
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 112,
        filters: extractTextFilters(rows, (r) => r.material_code),
        onFilter: (value, record) =>
          (record.material_code?.trim() ?? '') === (value as string),
        filterSearch: true,
        render: renderText,
      },
      {
        title: '图材质',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 88,
        filters: extractTextFilters(rows, (r) => r.material_name),
        onFilter: (value, record) =>
          (record.material_name?.trim() ?? '') === (value as string),
        filterSearch: true,
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
        filters: extractNumberFilters(rows, (r) =>
          Number(r.jobOutputs[column.key] || 0),
        ),
        onFilter: (value, record) =>
          Number(record.jobOutputs[column.key] || 0) === (value as number),
        filterSearch: true,
        render: (_value: unknown, record: OrderStatusDashboardItem) =>
          renderJobOutputCell({
            jobName: column.key,
            onOpen: openJobDetail,
            record,
          }),
      }))

    const outputColumns: TableColumnsType<OrderStatusDashboardItem> = [
      {
        title: '挤压',
        dataIndex: 'extrusionQuantity',
        key: 'extrusionQuantity',
        width: 68,
        align: 'right',
        filters: extractNumberFilters(rows, (r) =>
          Number(r.extrusionQuantity || 0),
        ),
        onFilter: (value, record) =>
          Number(record.extrusionQuantity || 0) === (value as number),
        filterSearch: true,
        render: (_value, record) =>
          renderExtrusionQuantityCell({
            onOpen: openExtrusionDetail,
            record,
          }),
      },
      {
        title: '精切',
        dataIndex: 'precisionCuttingQuantity',
        key: 'precisionCuttingQuantity',
        width: 68,
        align: 'right',
        filters: extractNumberFilters(rows, (r) =>
          Number(r.precisionCuttingQuantity || 0),
        ),
        onFilter: (value, record) =>
          Number(record.precisionCuttingQuantity || 0) === (value as number),
        filterSearch: true,
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
        filters: extractNumberFilters(rows, (r) =>
          Number(r.transferQuantity || 0),
        ),
        onFilter: (value, record) =>
          Number(record.transferQuantity || 0) === (value as number),
        filterSearch: true,
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
        filters: extractTextFilters(rows, (r) =>
          r.transferWorkshops?.length ? r.transferWorkshops.join('、') : null,
        ),
        onFilter: (value, record) =>
          (record.transferWorkshops?.length
            ? record.transferWorkshops.join('、')
            : '') === (value as string),
        filterSearch: true,
        render: renderTransferWorkshops,
      },
      {
        title: '返工返修',
        key: 'reworkRepairStatus',
        width: 260,
        align: 'center',
        filters: [
          { text: '待生产', value: 'pendingProductionCount' },
          { text: '待技术', value: 'pendingTechnicalCount' },
          { text: '待品质', value: 'pendingQualityCount' },
          { text: '已完成', value: 'completedCount' },
        ],
        onFilter: (value, record) => {
          const key = value as keyof ReworkRepairInfo
          return Number(record.reworkRepairInfo[key] || 0) > 0
        },
        render: (_value, record) =>
          renderReworkRepairStatus(record.reworkRepairInfo),
      },
      {
        title: '成品率',
        dataIndex: 'yieldRate',
        key: 'yieldRate',
        width: 68,
        align: 'right',
        filters: extractNumberFilters(
          rows,
          (r) => r.yieldRate,
          (v) => `${v}%`,
        ),
        onFilter: (value, record) => record.yieldRate === (value as number),
        filterSearch: true,
        render: renderPercent,
      },
      {
        title: '完工率（%）',
        dataIndex: 'completionRate',
        key: 'completionRate',
        width: 82,
        align: 'right',
        filters: extractNumberFilters(
          rows,
          (r) => r.completionRate,
          (v) => `${v}%`,
        ),
        onFilter: (value, record) =>
          record.completionRate === (value as number),
        filterSearch: true,
        render: renderPercent,
      },
      {
        title: '生产状态',
        dataIndex: 'productionStatus',
        key: 'productionStatus',
        width: 156,
        fixed: 'right',
        align: 'center',
        filters: PRODUCTION_STATUS_OPTIONS.map((opt) => ({
          text: opt.label,
          value: opt.value,
        })),
        onFilter: (value, record) =>
          record.productionStatus === (value as string),
        render: (value: OrderProductionStatus, record) => {
          const canCloseOrder = canCloseDashboardOrder({
            canManageStatus,
            record,
          })

          return (
            <Space size={3} wrap>
              <Tag
                color={STATUS_COLOR[value]}
                className="!rounded-full !font-medium"
              >
                {value}
              </Tag>
              {record.status && (
                <Tag className="!rounded-full">{record.status}</Tag>
              )}
              {canCloseOrder ? (
                <button
                  type="button"
                  disabled={
                    isUpdatingOrderStatus && closingOrderId === record.id
                  }
                  onClick={(event) => {
                    event.stopPropagation()
                    handleCloseOrder(record)
                  }}
                  className="group flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 hover:shadow-md hover:shadow-emerald-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingOrderStatus && closingOrderId === record.id ? (
                    <svg
                      className="size-3 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="size-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <span>结案</span>
                </button>
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
    openExtrusionDetail,
    openPrecisionCuttingDetail,
    openTransferDetail,
    page,
    pageSize,
    rows,
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
    setSelectedExtrusionDetail(null)
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
    setSelectedExtrusionDetail(null)
  }

  async function handleExportCurrentFilters() {
    if (data?.total === 0) {
      message.warning('当前没有可导出的订单现状数据')
      return
    }

    try {
      setIsExporting(true)
      message.open({
        key: 'order-status-dashboard-export',
        type: 'loading',
        content: '正在导出当前筛选结果...',
        duration: 0,
      })

      const exportRows = await getOrderStatusDashboardForExport({
        filters,
        total: data?.total ?? 0,
      })

      if (exportRows.length === 0) {
        message.warning({
          key: 'order-status-dashboard-export',
          content: '当前没有可导出的订单现状数据',
        })
        return
      }

      const { exportOrderStatusDashboardToExcel } =
        await loadOrderStatusDashboardExcel()
      exportOrderStatusDashboardToExcel(exportRows, jobColumns)
      message.success({
        key: 'order-status-dashboard-export',
        content: `已导出 ${exportRows.length} 条订单现状数据`,
      })
    } catch (error) {
      message.error({
        key: 'order-status-dashboard-export',
        content: error instanceof Error ? error.message : '导出失败',
      })
    } finally {
      setIsExporting(false)
    }
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
    setSelectedExtrusionDetail(null)
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
    setSelectedExtrusionDetail(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      {/* 标题区 */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/50 bg-gradient-to-br from-white via-blue-50/30 to-slate-50/50 px-5 py-4 shadow-sm">
        {/* 背景装饰元素 */}
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-transparent blur-3xl" />
        <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-gradient-to-tr from-indigo-100/40 via-purple-50/30 to-transparent blur-2xl" />
        <div className="absolute top-0 right-20 h-px w-48 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          {/* 左侧：标题 */}
          <div className="flex items-center gap-4">
            {/* 装饰性图标容器 */}
            <div className="relative">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <svg
                  className="size-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              {/* 图标光晕 */}
              <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-md" />
            </div>

            <div>
              <Title
                level={4}
                className="mb-0! !text-xl !font-bold tracking-tight"
              >
                <span className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text">
                  订单现状
                </span>
              </Title>
              <p className="mt-0.5 text-xs text-slate-400">
                实时监控生产进度与订单状态
              </p>
            </div>
          </div>

          {/* 右侧：统计标签组 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 订单统计 */}
            <div className="group relative">
              <div className="flex items-center gap-1.5 rounded-full bg-blue-50/80 px-3 py-1.5 ring-1 ring-blue-100/80 transition-all duration-200 hover:bg-blue-100/80 hover:shadow-sm hover:shadow-blue-100">
                <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-600">订单</span>
                <span className="text-xs font-bold text-blue-700 tabular-nums">
                  {data?.total ?? 0}
                </span>
              </div>
            </div>

            {/* 岗位统计 */}
            <div className="group relative">
              <div className="flex items-center gap-1.5 rounded-full bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80 transition-all duration-200 hover:bg-cyan-100/80 hover:shadow-sm hover:shadow-cyan-100">
                <span className="size-1.5 rounded-full bg-cyan-500" />
                <span className="text-xs font-medium text-cyan-600">岗位</span>
                <span className="text-xs font-bold text-cyan-700 tabular-nums">
                  {jobColumns.length}
                </span>
              </div>
            </div>

            {/* 明细统计 */}
            <div className="group relative">
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80 transition-all duration-200 hover:bg-emerald-100/80 hover:shadow-sm hover:shadow-emerald-100">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">
                  明细
                </span>
                <span className="text-xs font-bold text-emerald-700 tabular-nums">
                  {data?.productionItemCount ?? 0}
                </span>
              </div>
            </div>

            {/* 转移统计 */}
            <div className="group relative">
              <div className="flex items-center gap-1.5 rounded-full bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80 transition-all duration-200 hover:bg-purple-100/80 hover:shadow-sm hover:shadow-purple-100">
                <span className="size-1.5 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-purple-600">
                  转移
                </span>
                <span className="text-xs font-bold text-purple-700 tabular-nums">
                  {data?.materialTransferCount ?? 0}
                </span>
              </div>
            </div>

            {canExportCurrentFilters && (
              <Button
                size="small"
                icon={<ArrowDownTrayIcon className="size-3.5" />}
                loading={isExporting}
                disabled={isDataLoading || (data?.total ?? 0) === 0}
                onClick={() => void handleExportCurrentFilters()}
                onMouseEnter={preloadOrderStatusDashboardExcel}
                onFocus={preloadOrderStatusDashboardExcel}
                className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md"
              >
                导出当前筛选结果
              </Button>
            )}

            {/* 刷新按钮 */}
            <Button
              size="small"
              icon={
                <ArrowPathIcon
                  className={`size-3.5 ${isFetching && !isLoading ? 'animate-spin' : ''}`}
                />
              }
              loading={isFetching && !isLoading}
              onClick={() => void refetch()}
              className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md"
            >
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs 标签页 */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200/60 bg-white/60 p-1 shadow-sm backdrop-blur-sm">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleStatusTabChange(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeStatus === tab.key
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 搜索区 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:shadow-slate-200/50">
        {/* 顶部装饰线 */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/40 to-transparent" />

        {/* 搜索标签 */}
        <div className="flex items-center gap-2 border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-4 py-2.5">
          <div className="flex size-5 items-center justify-center rounded-md bg-blue-100/80">
            <MagnifyingGlassIcon className="size-3 text-blue-500" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            筛选条件
          </span>
        </div>

        {/* 搜索表单 */}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* 交货日期 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400"
              >
                交货日期
              </Text>
              <DatePicker
                allowClear
                format="YYYY-MM-DD"
                placeholder="交货日期"
                value={
                  searchValues.orderDate ? dayjs(searchValues.orderDate) : null
                }
                onChange={(date) =>
                  updateSearchParamValue(
                    'orderDate',
                    date ? date.format('YYYY-MM-DD') : '',
                  )
                }
                className="!w-36 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white"
              />
            </div>

            {/* 项目号 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400"
              >
                项目号
              </Text>
              <Input
                allowClear
                placeholder="项目号"
                value={searchValues.projectNo}
                onChange={(event) =>
                  updateSearchParamValue('projectNo', event.target.value)
                }
                onPressEnter={handleSearch}
                className="!w-44 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white"
              />
            </div>

            {/* 客户 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400"
              >
                客户
              </Text>
              <Input
                allowClear
                placeholder="客户"
                value={searchValues.customer}
                onChange={(event) =>
                  updateSearchParamValue('customer', event.target.value)
                }
                onPressEnter={handleSearch}
                className="!w-32 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white"
              />
            </div>

            {/* 型号 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400"
              >
                型号
              </Text>
              <Input
                allowClear
                placeholder="型号"
                value={searchValues.model}
                onChange={(event) =>
                  updateSearchParamValue('model', event.target.value)
                }
                onPressEnter={handleSearch}
                className="!w-32 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white"
              />
            </div>

            {/* 料号 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400"
              >
                料号
              </Text>
              <Input
                allowClear
                placeholder="料号"
                value={searchValues.materialCode}
                onChange={(event) =>
                  updateSearchParamValue('materialCode', event.target.value)
                }
                onPressEnter={handleSearch}
                className="!w-36 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white"
              />
            </div>

            {/* 状态 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400"
              >
                状态
              </Text>
              <Select
                allowClear
                placeholder="生产状态"
                value={searchValues.productionStatus || undefined}
                options={PRODUCTION_STATUS_OPTIONS}
                onChange={(value) =>
                  updateSearchParamValue('productionStatus', value ?? '')
                }
                className="!w-32 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-200/80 [&_.ant-select-selector]:!bg-slate-50/50"
              />
            </div>

            {/* 操作按钮 */}
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="primary"
                icon={<MagnifyingGlassIcon className="size-4" />}
                loading={isFetching && !isLoading}
                onClick={handleSearch}
                className="!rounded-lg !bg-gradient-to-r !from-blue-500 !to-indigo-500 !shadow-md !shadow-blue-500/30 !transition-all !duration-200 hover:!from-blue-600 hover:!to-indigo-600 hover:!shadow-lg hover:!shadow-blue-500/40 active:!scale-95 active:!transform"
              >
                搜索
              </Button>
              <Button
                icon={<XMarkIcon className="size-4" />}
                onClick={handleResetSearch}
                className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-500 !shadow-sm !transition-all !duration-200 hover:!border-slate-300 hover:!bg-slate-50 hover:!text-slate-600"
              >
                重置
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div
        ref={tableContainerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm"
      >
        {/* 表头装饰 */}
        <div className="flex items-center justify-between border-b border-slate-100/60 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-md bg-blue-100/80">
              <svg
                className="size-3 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              数据列表
            </span>
          </div>

          {/* 可结案订单提示 */}
          {canManageStatus && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80">
                <svg
                  className="size-3.5 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs text-emerald-600">
                  {
                    rows.filter((r) =>
                      canCloseDashboardOrder({
                        canManageStatus: true,
                        record: r,
                      }),
                    ).length
                  }{' '}
                  个订单可结案
                </span>
              </div>
            </div>
          )}

          <span className="text-xs text-slate-400">
            共{' '}
            <span className="font-medium text-slate-600">
              {data?.total ?? 0}
            </span>{' '}
            条记录
          </span>
        </div>

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
          sticky={{ offsetHeader: 0 }}
          rowClassName={(record) =>
            record.productionStatus === '延期'
              ? 'bg-red-50/50 hover:bg-red-50'
              : record.productionStatus === '预警'
                ? 'bg-amber-50/50 hover:bg-amber-50'
                : 'hover:bg-blue-50/30'
          }
          onRow={() => ({
            style: { height: rowHeight },
            className: 'transition-colors duration-150',
          })}
          className="[&_.ant-table]:!font-mono [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-slate-500"
        />
      </div>

      {/* 分页区域 */}
      <div
        ref={paginationRef}
        className="flex shrink-0 items-center justify-between rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{data?.total ?? 0}</span>
          <span>条记录</span>
        </div>
        <AppPagination
          total={data?.total ?? 0}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          pageSizeOptions={['10', '20', '50']}
        />
      </div>

      {/* 模态框：生产明细 */}
      <ProductionDetailModal
        detail={selectedJobDetail}
        onClose={() => setSelectedJobDetail(null)}
      />

      {/* 模态框：物料转移 */}
      <TransferDetailModal
        detail={selectedTransferDetail}
        onClose={() => setSelectedTransferDetail(null)}
      />

      {/* 模态框：精切明细 */}
      <PrecisionCuttingDetailModal
        detail={selectedPrecisionCuttingDetail}
        onClose={() => setSelectedPrecisionCuttingDetail(null)}
      />

      {/* 模态框：挤压明细 */}
      <ExtrusionDetailModal
        detail={selectedExtrusionDetail}
        onClose={() => setSelectedExtrusionDetail(null)}
      />
    </div>
  )
}
