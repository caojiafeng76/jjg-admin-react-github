import type { TableColumnsType } from 'antd'
import { Space, Tag } from 'antd'
import type {
  OrderProductionStatus,
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
  ReworkRepairInfo,
} from '@/services/apiOrderStatusDashboard'
import {
  applyColumnWidths,
  canCloseDashboardOrder,
  type ColumnWidthMap,
  extractNumberFilters,
  extractTextFilters,
  PRODUCTION_STATUS_OPTIONS,
} from './dashboardUtils'
import {
  renderExtrusionQuantityCell,
  renderJobOutputCell,
  renderPercent,
  renderPrecisionCuttingQuantityCell,
  renderQuantity,
  renderReworkRepairStatus,
  renderText,
  renderTransferQuantityCell,
  renderTransferWorkshops,
} from './dashboardRenderUtils'

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

export interface OrderStatusDashboardColumnsOptions {
  canManageStatus: boolean
  closingOrderId: string | null
  columnWidths: ColumnWidthMap
  handleCloseOrder: (record: OrderStatusDashboardItem) => void
  handleResizeColumn: (columnKey: string, width: number) => void
  isUpdatingOrderStatus: boolean
  jobColumns: OrderStatusJobColumn[]
  modelFilterValues: string[]
  modelOptions: string[]
  openExtrusionDetail: (record: OrderStatusDashboardItem) => void
  openJobDetail: (record: OrderStatusDashboardItem, jobName: string) => void
  openPrecisionCuttingDetail: (record: OrderStatusDashboardItem) => void
  openTransferDetail: (record: OrderStatusDashboardItem) => void
  page: number
  pageSize: number
  rows: OrderStatusDashboardItem[]
}

export function createOrderStatusDashboardColumns({
  canManageStatus,
  closingOrderId,
  columnWidths,
  handleCloseOrder,
  handleResizeColumn,
  isUpdatingOrderStatus,
  jobColumns,
  modelFilterValues,
  modelOptions,
  openExtrusionDetail,
  openJobDetail,
  openPrecisionCuttingDetail,
  openTransferDetail,
  page,
  pageSize,
  rows,
}: OrderStatusDashboardColumnsOptions): TableColumnsType<OrderStatusDashboardItem> {
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
      filters: extractNumberFilters(rows, (r) => Number(r.order_quantity || 0)),
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
      onFilter: (value, record) => record.completionRate === (value as number),
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
                disabled={isUpdatingOrderStatus && closingOrderId === record.id}
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
}
