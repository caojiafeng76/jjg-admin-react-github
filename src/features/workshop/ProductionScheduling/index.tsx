import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowPathIcon,
  PencilSquareIcon,
  PlusIcon,
  QueueListIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType, TablePaginationConfig } from 'antd'
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'

import type {
  WorkshopOrderProcessSchedule,
  WorkshopOrderProcessScheduleStatus,
} from '@/features/workshop/OrderList'
import { WORKSHOP_ORDER_STATUS_OPTIONS } from '@/features/workshop/OrderList/orderStatus'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import {
  buildInitialProcessSchedules,
  createEmptyProcessSchedule,
  getProductionSchedulingProcessRows,
  normalizeProcessSchedules,
  parseSchedulingProcesses,
  PRODUCTION_SCHEDULING_PROCESS_OPTIONS,
  type ProductionSchedulingFilters,
  type ProductionSchedulingOrder,
  type ProductionSchedulingOrderUpdate,
  type ProductionSchedulingProcessRow,
} from '@/services/apiProductionScheduling'
import {
  useProductionSchedulingOrderStandardCapacity,
  useProductionSchedulingOrders,
  useUpdateProductionSchedulingOrder,
} from './useProductionScheduling'

const { Text, Title } = Typography

type SchedulingTabKey =
  | 'review'
  | 'status'
  | 'total-pending'
  | 'process-pending'
  | 'process-scheduled'
  | 'process-remaining'

type SearchFormValues = {
  customer?: string
  model?: string
  projectNo?: string
  status?: ProductionSchedulingFilters['status']
}

type ReviewFormValues = Omit<
  ProductionSchedulingOrderUpdate,
  | 'order_date'
  | 'planned_finish_date'
  | 'planned_start_date'
  | 'process_schedules'
> & {
  order_date?: dayjs.Dayjs | null
  planned_finish_date?: dayjs.Dayjs | null
  planned_start_date?: dayjs.Dayjs | null
}

const DEFAULT_FILTERS: ProductionSchedulingFilters = {
  status: '生产中',
}

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_TABLE_SCROLL_Y = 420
const MIN_TABLE_SCROLL_Y = 260
const TABLE_SCROLL_VERTICAL_PADDING = 72
const SCHEDULE_EDIT_TABLE_SCROLL_Y = 360

const STATUS_TAG_COLOR: Record<WorkshopOrderProcessScheduleStatus, string> = {
  待排: 'orange',
  已排: 'green',
  余排: 'gold',
}

const STATUS_OPTIONS: Array<{
  label: WorkshopOrderProcessScheduleStatus
  value: WorkshopOrderProcessScheduleStatus
}> = [
  { label: '待排', value: '待排' },
  { label: '已排', value: '已排' },
  { label: '余排', value: '余排' },
]

const ORDER_CATEGORY_OPTIONS = [
  { label: '样品单', value: '样品单' },
  { label: '散单（小单）', value: '散单（小单）' },
  { label: '大单', value: '大单' },
]

const DELIVERY_PRIORITY_OPTIONS = [
  { label: '正常', value: '正常' },
  { label: '急单', value: '急单' },
  { label: '特急单', value: '特急单' },
  { label: '急插单', value: '急插单' },
]

const MATERIAL_STATUS_OPTIONS = [
  { label: '正常', value: '正常' },
  { label: '等料', value: '等料' },
]

const TOOLING_STATUS_OPTIONS = [
  { label: '现有', value: '现有' },
  { label: '新做', value: '新做' },
  { label: '正常', value: '正常' },
]

const PROCESS_FLOW_SELECT_OPTIONS = PRODUCTION_SCHEDULING_PROCESS_OPTIONS.map(
  (item) => ({
    label: item.name,
    value: item.name,
  }),
)

function renderText(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Text type="secondary">-</Text>
  }

  return String(value)
}

function renderDate(value: string | null | undefined) {
  return value ? (
    dayjs(value).format('YYYY-MM-DD')
  ) : (
    <Text type="secondary">-</Text>
  )
}

function renderQuantity(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : '-'
}

function hasPositiveNumber(value: unknown) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) && numberValue > 0
}

function renderPercent(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return `${numberValue.toFixed(1)}%`
}

function toDatePickerValue(value: string | null | undefined) {
  return value ? dayjs(value) : null
}

function formatDatePickerValue(value: dayjs.Dayjs | null | undefined) {
  return value ? value.format('YYYY-MM-DD') : null
}

function formatProcessFlowNames(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const processes = parseSchedulingProcesses(trimmed)
  return processes.length
    ? processes.map((process) => process.name).join('→')
    : trimmed
}

function renderProcessFlow(value: unknown) {
  return renderText(formatProcessFlowNames(value))
}

function appendProcessToFlow(currentFlow: unknown, processName: string) {
  const currentText = typeof currentFlow === 'string' ? currentFlow.trim() : ''
  const flowPrefix = currentText
    .replace(/(?:\s*(?:→|>|＞|,|，|、|\/|／|\||｜|-|—)\s*)+$/g, '')
    .trim()

  return flowPrefix ? `${flowPrefix}→${processName}` : processName
}

function getOrderRowKey(order: ProductionSchedulingOrder) {
  return (
    order.id || order.project_no || `${order.customer}-${order.product_model}`
  )
}

function makeReviewInitialValues(order: ProductionSchedulingOrder) {
  return {
    order_date: toDatePickerValue(order.order_date),
    planned_start_date: toDatePickerValue(order.planned_start_date),
    planned_finish_date: toDatePickerValue(order.planned_finish_date),
    delivery_review_result: order.delivery_review_result ?? null,
    process_flow: formatProcessFlowNames(order.process_flow),
    process_requirement: order.process_requirement ?? null,
    tooling_status: order.tooling_status ?? null,
    capacity_per_day: order.capacity_per_day ?? null,
    bottleneck_processes: order.bottleneck_processes ?? null,
    material_status: order.material_status ?? null,
    order_category: order.order_category ?? null,
    delivery_priority: order.delivery_priority ?? null,
    scheduling_remark: order.scheduling_remark ?? null,
  } satisfies ReviewFormValues
}

function formatReviewPayload(
  values: ReviewFormValues,
): ProductionSchedulingOrderUpdate {
  return {
    ...values,
    order_date: formatDatePickerValue(values.order_date),
    planned_start_date: formatDatePickerValue(values.planned_start_date),
    planned_finish_date: formatDatePickerValue(values.planned_finish_date),
  }
}

function getSummary(orders: ProductionSchedulingOrder[]) {
  return orders.reduce(
    (summary, order) => ({
      totalOrders: summary.totalOrders + 1,
      totalQuantity: summary.totalQuantity + order.total_pending_quantity,
      scheduledQuantity: summary.scheduledQuantity + order.scheduled_quantity,
      remainingQuantity:
        summary.remainingQuantity + order.remaining_schedule_quantity,
      processedQuantity: summary.processedQuantity + order.processed_quantity,
      transferQuantity: summary.transferQuantity + order.transfer_quantity,
    }),
    {
      processedQuantity: 0,
      remainingQuantity: 0,
      scheduledQuantity: 0,
      totalOrders: 0,
      totalQuantity: 0,
      transferQuantity: 0,
    },
  )
}

function makeBaseOrderColumns(): TableColumnsType<ProductionSchedulingOrder> {
  return [
    {
      title: '项目号',
      dataIndex: 'project_no',
      key: 'project_no',
      width: 126,
      fixed: 'left',
      render: renderText,
    },
    {
      title: '客户名称',
      dataIndex: 'customer',
      key: 'customer',
      width: 96,
      render: renderText,
    },
    {
      title: '产品型号',
      dataIndex: 'product_model',
      key: 'product_model',
      width: 108,
      render: renderText,
    },
    {
      title: '料号',
      dataIndex: 'material_code',
      key: 'material_code',
      width: 132,
      render: renderText,
    },
    {
      title: '长度',
      dataIndex: 'length_mm',
      key: 'length_mm',
      width: 78,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '订单数量',
      dataIndex: 'order_quantity',
      key: 'order_quantity',
      width: 86,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '表面要求',
      dataIndex: 'color_name',
      key: 'color_name',
      width: 86,
      render: renderText,
    },
    {
      title: '订单日期',
      dataIndex: 'order_date',
      key: 'order_date',
      width: 108,
      render: renderDate,
    },
    {
      title: '订单交期',
      dataIndex: 'product_delivery_date',
      key: 'product_delivery_date',
      width: 108,
      render: renderDate,
    },
  ]
}

function makeReviewColumns({
  onEditReview,
  onEditSchedule,
}: {
  onEditReview: (record: ProductionSchedulingOrder) => void
  onEditSchedule: (record: ProductionSchedulingOrder) => void
}): TableColumnsType<ProductionSchedulingOrder> {
  return [
    ...makeBaseOrderColumns(),
    {
      title: '计划开工日期',
      dataIndex: 'planned_start_date',
      key: 'planned_start_date',
      width: 118,
      render: renderDate,
    },
    {
      title: '计划完成日期',
      dataIndex: 'planned_finish_date',
      key: 'planned_finish_date',
      width: 118,
      render: renderDate,
    },
    {
      title: '交期评审结果',
      dataIndex: 'delivery_review_result',
      key: 'delivery_review_result',
      width: 120,
      render: renderText,
    },
    {
      title: '工艺流程',
      dataIndex: 'process_flow',
      key: 'process_flow',
      width: 150,
      ellipsis: true,
      render: renderProcessFlow,
    },
    {
      title: '工艺要求说明',
      dataIndex: 'process_requirement',
      key: 'process_requirement',
      width: 160,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '工装夹具情况',
      dataIndex: 'tooling_status',
      key: 'tooling_status',
      width: 118,
      render: renderText,
    },
    {
      title: '产能',
      dataIndex: 'capacity_per_day',
      key: 'capacity_per_day',
      width: 76,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '瓶颈工序',
      dataIndex: 'bottleneck_processes',
      key: 'bottleneck_processes',
      width: 116,
      render: renderText,
    },
    {
      title: '物料状态',
      dataIndex: 'material_status',
      key: 'material_status',
      width: 92,
      render: renderText,
    },
    {
      title: '订单类别',
      dataIndex: 'order_category',
      key: 'order_category',
      width: 112,
      render: renderText,
    },
    {
      title: '交期状态',
      dataIndex: 'delivery_priority',
      key: 'delivery_priority',
      width: 92,
      render: renderText,
    },
    {
      title: '备注',
      dataIndex: 'scheduling_remark',
      key: 'scheduling_remark',
      width: 150,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '操作',
      key: 'actions',
      width: 154,
      fixed: 'right',
      render: (_value, record) => (
        <div className="flex gap-2">
          <Button
            size="small"
            icon={<PencilSquareIcon className="size-4" />}
            onClick={() => onEditReview(record)}
          >
            初审
          </Button>
          <Button
            size="small"
            icon={<QueueListIcon className="size-4" />}
            onClick={() => onEditSchedule(record)}
          >
            排产
          </Button>
        </div>
      ),
    },
  ]
}

function makeStatusColumns({
  onEditSchedule,
}: {
  onEditSchedule: (record: ProductionSchedulingOrder) => void
}): TableColumnsType<ProductionSchedulingOrder> {
  return [
    {
      title: '项目号',
      dataIndex: 'project_no',
      key: 'project_no',
      width: 126,
      fixed: 'left',
      render: renderText,
    },
    {
      title: '工艺流程',
      dataIndex: 'process_flow',
      key: 'process_flow',
      width: 148,
      ellipsis: true,
      render: renderProcessFlow,
    },
    ...makeBaseOrderColumns().slice(1),
    {
      title: '评审',
      dataIndex: 'delivery_review_result',
      key: 'delivery_review_result',
      width: 82,
      render: renderText,
    },
    {
      title: '计划生产日期',
      dataIndex: 'planned_start_date',
      key: 'planned_start_date',
      width: 118,
      render: renderDate,
    },
    {
      title: '计划完成日期',
      dataIndex: 'planned_finish_date',
      key: 'planned_finish_date',
      width: 118,
      render: renderDate,
    },
    {
      title: '总待排',
      dataIndex: 'total_pending_quantity',
      key: 'total_pending_quantity',
      width: 86,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '已排产',
      dataIndex: 'scheduled_quantity',
      key: 'scheduled_quantity',
      width: 86,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '已排占比',
      dataIndex: 'scheduled_rate',
      key: 'scheduled_rate',
      width: 86,
      align: 'right',
      render: renderPercent,
    },
    {
      title: '余排产',
      dataIndex: 'remaining_schedule_quantity',
      key: 'remaining_schedule_quantity',
      width: 86,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '余排占比',
      dataIndex: 'remaining_schedule_rate',
      key: 'remaining_schedule_rate',
      width: 86,
      align: 'right',
      render: renderPercent,
    },
    {
      title: '已加工',
      dataIndex: 'processed_quantity',
      key: 'processed_quantity',
      width: 86,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '加工占比',
      dataIndex: 'processed_rate',
      key: 'processed_rate',
      width: 86,
      align: 'right',
      render: renderPercent,
    },
    {
      title: '转移',
      dataIndex: 'transfer_quantity',
      key: 'transfer_quantity',
      width: 86,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '转移占比',
      dataIndex: 'transfer_rate',
      key: 'transfer_rate',
      width: 86,
      align: 'right',
      render: renderPercent,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 92,
      render: renderText,
    },
    {
      title: '订单类别',
      dataIndex: 'order_category',
      key: 'order_category',
      width: 112,
      render: renderText,
    },
    {
      title: '交期状态',
      dataIndex: 'delivery_priority',
      key: 'delivery_priority',
      width: 92,
      render: renderText,
    },
    {
      title: '备注',
      dataIndex: 'scheduling_remark',
      key: 'scheduling_remark',
      width: 150,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '操作',
      key: 'actions',
      width: 92,
      fixed: 'right',
      render: (_value, record) => (
        <Button
          size="small"
          icon={<QueueListIcon className="size-4" />}
          onClick={() => onEditSchedule(record)}
        >
          排产
        </Button>
      ),
    },
  ]
}

function makeTotalPendingColumns({
  onEditSchedule,
}: {
  onEditSchedule: (record: ProductionSchedulingOrder) => void
}): TableColumnsType<ProductionSchedulingOrder> {
  return [
    ...makeBaseOrderColumns(),
    {
      title: '交期评审结果',
      dataIndex: 'delivery_review_result',
      key: 'delivery_review_result',
      width: 120,
      render: renderText,
    },
    {
      title: '工艺流程',
      dataIndex: 'process_flow',
      key: 'process_flow',
      width: 160,
      ellipsis: true,
      render: renderProcessFlow,
    },
    {
      title: '工艺要求说明',
      dataIndex: 'process_requirement',
      key: 'process_requirement',
      width: 160,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '工装夹具情况',
      dataIndex: 'tooling_status',
      key: 'tooling_status',
      width: 118,
      render: renderText,
    },
    {
      title: '产能',
      dataIndex: 'capacity_per_day',
      key: 'capacity_per_day',
      width: 76,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '瓶颈工序',
      dataIndex: 'bottleneck_processes',
      key: 'bottleneck_processes',
      width: 116,
      render: renderText,
    },
    {
      title: '物料状态',
      dataIndex: 'material_status',
      key: 'material_status',
      width: 92,
      render: renderText,
    },
    {
      title: '待排数量',
      dataIndex: 'remaining_schedule_quantity',
      key: 'remaining_schedule_quantity',
      width: 92,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '订单类别',
      dataIndex: 'order_category',
      key: 'order_category',
      width: 112,
      render: renderText,
    },
    {
      title: '交期状态',
      dataIndex: 'delivery_priority',
      key: 'delivery_priority',
      width: 92,
      render: renderText,
    },
    {
      title: '备注',
      dataIndex: 'scheduling_remark',
      key: 'scheduling_remark',
      width: 150,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '操作',
      key: 'actions',
      width: 92,
      fixed: 'right',
      render: (_value, record) => (
        <Button
          size="small"
          icon={<QueueListIcon className="size-4" />}
          onClick={() => onEditSchedule(record)}
        >
          排产
        </Button>
      ),
    },
  ]
}

function makeProcessColumns(
  mode: 'pending' | 'scheduled' | 'remaining',
): TableColumnsType<ProductionSchedulingProcessRow> {
  const dateColumns: TableColumnsType<ProductionSchedulingProcessRow> = []

  if (mode === 'scheduled' || mode === 'remaining') {
    dateColumns.push({
      title: mode === 'remaining' ? '上次排产日期' : '排产日期',
      key: mode === 'remaining' ? 'last_scheduled_date' : 'scheduled_date',
      width: 118,
      render: (_value, record) =>
        renderDate(
          mode === 'remaining'
            ? record.schedule.last_scheduled_date
            : record.schedule.scheduled_date,
        ),
    })
  }

  if (mode === 'remaining') {
    dateColumns.push({
      title: '余排计划日期',
      key: 'remaining_scheduled_date',
      width: 118,
      render: (_value, record) => renderDate(record.schedule.scheduled_date),
    })
  }

  dateColumns.push({
    title: '要求生产日期',
    key: 'required_production_date',
    width: 118,
    render: (_value, record) =>
      renderDate(record.schedule.required_production_date),
  })

  return [
    {
      title: '工序',
      key: 'process_name',
      width: 86,
      fixed: 'left',
      render: (_value, record) => renderText(record.schedule.process_name),
    },
    {
      title: '状态',
      key: 'status',
      width: 76,
      render: (_value, record) => (
        <Tag color={STATUS_TAG_COLOR[record.schedule.status]}>
          {record.schedule.status}
        </Tag>
      ),
    },
    {
      title: '项目号',
      key: 'project_no',
      width: 126,
      render: (_value, record) => renderText(record.order.project_no),
    },
    {
      title: '客户名称',
      key: 'customer',
      width: 96,
      render: (_value, record) => renderText(record.order.customer),
    },
    {
      title: '产品型号',
      key: 'product_model',
      width: 108,
      render: (_value, record) => renderText(record.order.product_model),
    },
    {
      title: '料号',
      key: 'material_code',
      width: 132,
      render: (_value, record) => renderText(record.order.material_code),
    },
    {
      title: '长度',
      key: 'length_mm',
      width: 78,
      align: 'right',
      render: (_value, record) => renderQuantity(record.order.length_mm),
    },
    {
      title: '订单数量',
      key: 'order_quantity',
      width: 86,
      align: 'right',
      render: (_value, record) => renderQuantity(record.order.order_quantity),
    },
    {
      title: '表面要求',
      key: 'surface',
      width: 86,
      render: (_value, record) => renderText(record.order.color_name),
    },
    {
      title: '订单日期',
      key: 'order_date',
      width: 108,
      render: (_value, record) => renderDate(record.order.order_date),
    },
    {
      title: '订单交期',
      key: 'product_delivery_date',
      width: 108,
      render: (_value, record) =>
        renderDate(record.order.product_delivery_date),
    },
    {
      title: '交期评审结果',
      key: 'delivery_review_result',
      width: 120,
      render: (_value, record) =>
        renderText(record.order.delivery_review_result),
    },
    {
      title: '工艺流程',
      key: 'process_flow',
      width: 150,
      ellipsis: true,
      render: (_value, record) => renderProcessFlow(record.order.process_flow),
    },
    {
      title: '工艺要求说明',
      key: 'process_requirement',
      width: 160,
      ellipsis: true,
      render: (_value, record) => renderText(record.order.process_requirement),
    },
    ...dateColumns,
    {
      title: '排产数量',
      key: 'scheduled_quantity',
      width: 92,
      align: 'right',
      render: (_value, record) =>
        renderQuantity(record.schedule.scheduled_quantity),
    },
    {
      title: '工装夹具情况',
      key: 'tooling_status',
      width: 118,
      render: (_value, record) => renderText(record.order.tooling_status),
    },
    {
      title: '产能',
      key: 'capacity_per_day',
      width: 76,
      align: 'right',
      render: (_value, record) => renderQuantity(record.order.capacity_per_day),
    },
    {
      title: '瓶颈工序',
      key: 'bottleneck_processes',
      width: 116,
      render: (_value, record) => renderText(record.order.bottleneck_processes),
    },
    {
      title: '物料状态',
      key: 'material_status',
      width: 92,
      render: (_value, record) => renderText(record.order.material_status),
    },
    {
      title: '订单类别',
      key: 'order_category',
      width: 112,
      render: (_value, record) => renderText(record.order.order_category),
    },
    {
      title: '交期状态',
      key: 'delivery_priority',
      width: 92,
      render: (_value, record) => renderText(record.order.delivery_priority),
    },
    {
      title: '备注',
      key: 'remark',
      width: 150,
      ellipsis: true,
      render: (_value, record) => renderText(record.schedule.remark),
    },
  ]
}

export default function ProductionScheduling() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [searchForm] = Form.useForm<SearchFormValues>()
  const [reviewForm] = Form.useForm<ReviewFormValues>()
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] =
    useState<ProductionSchedulingFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [activeTab, setActiveTab] = useState<SchedulingTabKey>('review')
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] =
    useState<ProductionSchedulingOrder | null>(null)
  const [scheduleRows, setScheduleRows] = useState<
    WorkshopOrderProcessSchedule[]
  >([])
  const [tableScrollY, setTableScrollY] = useState(DEFAULT_TABLE_SCROLL_Y)

  const {
    data: schedulingResult,
    isFetching,
    isLoading,
    refetch,
  } = useProductionSchedulingOrders({ filters, page, pageSize })
  const updateMutation = useUpdateProductionSchedulingOrder()
  const shouldAutoFillReviewCapacity =
    reviewModalOpen &&
    editingOrder !== null &&
    !hasPositiveNumber(editingOrder.capacity_per_day)
  const { data: reviewStandardCapacity, isFetching: isReviewCapacityFetching } =
    useProductionSchedulingOrderStandardCapacity({
      enabled: shouldAutoFillReviewCapacity,
      order: editingOrder,
    })
  const orders = schedulingResult?.orders ?? []
  const total = schedulingResult?.total ?? 0
  const tableLoading = isLoading && orders.length === 0
  const processRows = useMemo(
    () => getProductionSchedulingProcessRows(orders),
    [orders],
  )
  const totalPendingOrders = useMemo(
    () => orders.filter((order) => order.remaining_schedule_quantity > 0),
    [orders],
  )
  const pendingProcessRows = useMemo(
    () => processRows.filter((row) => row.schedule.status === '待排'),
    [processRows],
  )
  const scheduledProcessRows = useMemo(
    () => processRows.filter((row) => row.schedule.status === '已排'),
    [processRows],
  )
  const remainingProcessRows = useMemo(
    () => processRows.filter((row) => row.schedule.status === '余排'),
    [processRows],
  )
  const summary = useMemo(() => getSummary(orders), [orders])

  useEffect(() => {
    const container = tabsContainerRef.current
    if (!container) {
      return
    }

    let animationFrameId = 0

    const updateTableScrollY = () => {
      const nav = container.querySelector<HTMLElement>('.ant-tabs-nav')
      const pagination = container.querySelector<HTMLElement>(
        '.ant-table-pagination',
      )
      const containerHeight =
        container.clientHeight || window.innerHeight - DEFAULT_TABLE_SCROLL_Y
      const navHeight = nav?.offsetHeight ?? 40
      const paginationHeight = pagination?.offsetHeight ?? 32
      const nextScrollY = Math.max(
        MIN_TABLE_SCROLL_Y,
        containerHeight -
          navHeight -
          paginationHeight -
          TABLE_SCROLL_VERTICAL_PADDING,
      )

      setTableScrollY((currentScrollY) =>
        Math.abs(currentScrollY - nextScrollY) > 2
          ? nextScrollY
          : currentScrollY,
      )
    }

    const scheduleUpdate = () => {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = requestAnimationFrame(updateTableScrollY)
    }

    const timeoutId = window.setTimeout(scheduleUpdate, 0)
    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(container)
    window.addEventListener('resize', scheduleUpdate)

    scheduleUpdate()

    return () => {
      window.clearTimeout(timeoutId)
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [
    activeTab,
    orders.length,
    pageSize,
    pendingProcessRows.length,
    remainingProcessRows.length,
    scheduledProcessRows.length,
    totalPendingOrders.length,
  ])

  useEffect(() => {
    const standardCapacity = Number(reviewStandardCapacity || 0)

    if (
      !reviewModalOpen ||
      !editingOrder ||
      !hasPositiveNumber(standardCapacity)
    ) {
      return
    }

    if (hasPositiveNumber(reviewForm.getFieldValue('capacity_per_day'))) {
      return
    }

    reviewForm.setFieldValue('capacity_per_day', standardCapacity)
    setEditingOrder((currentOrder) => {
      if (!currentOrder || currentOrder.id !== editingOrder.id) {
        return currentOrder
      }

      return { ...currentOrder, capacity_per_day: standardCapacity }
    })
  }, [editingOrder, reviewForm, reviewModalOpen, reviewStandardCapacity])

  const openReviewModal = useCallback(
    (order: ProductionSchedulingOrder) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setEditingOrder(order)
      reviewForm.setFieldsValue(makeReviewInitialValues(order))
      setReviewModalOpen(true)
    },
    [message, reviewForm, viewerDenied, viewerOperationTip],
  )

  const openScheduleModal = useCallback(
    (order: ProductionSchedulingOrder) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      const normalizedRows = normalizeProcessSchedules(order.process_schedules)
      setEditingOrder(order)
      setScheduleRows(
        normalizedRows.length > 0
          ? normalizedRows
          : buildInitialProcessSchedules(order),
      )
      setScheduleModalOpen(true)
    },
    [message, viewerDenied, viewerOperationTip],
  )

  const reviewColumns = useMemo(
    () =>
      makeReviewColumns({
        onEditReview: openReviewModal,
        onEditSchedule: openScheduleModal,
      }),
    [openReviewModal, openScheduleModal],
  )
  const statusColumns = useMemo(
    () => makeStatusColumns({ onEditSchedule: openScheduleModal }),
    [openScheduleModal],
  )
  const totalPendingColumns = useMemo(
    () => makeTotalPendingColumns({ onEditSchedule: openScheduleModal }),
    [openScheduleModal],
  )
  const processPendingColumns = useMemo(() => makeProcessColumns('pending'), [])
  const processScheduledColumns = useMemo(
    () => makeProcessColumns('scheduled'),
    [],
  )
  const processRemainingColumns = useMemo(
    () => makeProcessColumns('remaining'),
    [],
  )

  const tablePagination = useMemo<TablePaginationConfig>(
    () => ({
      current: page,
      pageSize,
      showSizeChanger: true,
      showTotal: (value) => `共 ${value} 条`,
      total,
      onChange: (nextPage, nextPageSize) => {
        setPage(nextPage)
        setPageSize(nextPageSize || DEFAULT_PAGE_SIZE)
      },
    }),
    [page, pageSize, total],
  )

  const handleSearch = useCallback((values: SearchFormValues) => {
    setPage(1)
    setFilters({
      customer: values.customer?.trim() || undefined,
      model: values.model?.trim() || undefined,
      projectNo: values.projectNo?.trim() || undefined,
      status: values.status || '生产中',
    })
  }, [])

  const handleReset = useCallback(() => {
    searchForm.resetFields()
    setPage(1)
    setFilters(DEFAULT_FILTERS)
  }, [searchForm])

  const handleAppendProcessFlow = useCallback(
    (processName: string) => {
      reviewForm.setFieldValue(
        'process_flow',
        appendProcessToFlow(
          reviewForm.getFieldValue('process_flow'),
          processName,
        ),
      )
    },
    [reviewForm],
  )

  const handleSaveReview = useCallback(async () => {
    if (!editingOrder?.id) {
      return
    }

    const values = await reviewForm.validateFields()
    await updateMutation.mutateAsync({
      id: editingOrder.id,
      values: formatReviewPayload(values),
    })
    message.success('订单初审信息已保存')
    setReviewModalOpen(false)
    setEditingOrder(null)
  }, [editingOrder?.id, message, reviewForm, updateMutation])

  const handleScheduleRowChange = useCallback(
    (rowId: string, patch: Partial<WorkshopOrderProcessSchedule>) => {
      setScheduleRows((currentRows) =>
        currentRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                ...patch,
              }
            : row,
        ),
      )
    },
    [],
  )

  const handleProcessSelect = useCallback(
    (rowId: string, processCode: string) => {
      const process = PRODUCTION_SCHEDULING_PROCESS_OPTIONS.find(
        (item) => item.code === processCode,
      )
      handleScheduleRowChange(rowId, {
        process_code: process?.code || processCode,
        process_name: process?.name || processCode,
      })
    },
    [handleScheduleRowChange],
  )

  const handleAddScheduleRow = useCallback(() => {
    setScheduleRows((currentRows) => [
      ...currentRows,
      createEmptyProcessSchedule(editingOrder || undefined),
    ])
  }, [editingOrder])

  const handleResetSchedulesFromFlow = useCallback(() => {
    if (!editingOrder) {
      return
    }

    setScheduleRows(buildInitialProcessSchedules(editingOrder))
  }, [editingOrder])

  const handleDeleteScheduleRow = useCallback((rowId: string) => {
    setScheduleRows((currentRows) =>
      currentRows.filter((row) => row.id !== rowId),
    )
  }, [])

  const handleSaveSchedules = useCallback(async () => {
    if (!editingOrder?.id) {
      return
    }

    const processSchedules = normalizeProcessSchedules(scheduleRows)
    if (processSchedules.length === 0) {
      message.warning('请至少保留一条有效的工序排产记录')
      return
    }

    await updateMutation.mutateAsync({
      id: editingOrder.id,
      values: {
        process_schedules: processSchedules,
      },
    })
    message.success('工序排产明细已保存')
    setScheduleModalOpen(false)
    setEditingOrder(null)
    setScheduleRows([])
  }, [editingOrder?.id, message, scheduleRows, updateMutation])

  const scheduleEditColumns = useMemo(
    (): TableColumnsType<WorkshopOrderProcessSchedule> => [
      {
        title: '工序',
        key: 'process',
        width: 150,
        render: (_value, record) => (
          <Select
            showSearch={{ optionFilterProp: 'label' }}
            value={record.process_code || undefined}
            placeholder="选择工序"
            options={PRODUCTION_SCHEDULING_PROCESS_OPTIONS.map((item) => ({
              label: `${item.code} ${item.name}`,
              value: item.code,
            }))}
            onChange={(value) => handleProcessSelect(record.id, value)}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 104,
        render: (_value, record) => (
          <Select
            value={record.status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              handleScheduleRowChange(record.id, {
                status: value,
              })
            }
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '要求生产日期',
        dataIndex: 'required_production_date',
        key: 'required_production_date',
        width: 148,
        render: (_value, record) => (
          <DatePicker
            value={toDatePickerValue(record.required_production_date)}
            onChange={(value) =>
              handleScheduleRowChange(record.id, {
                required_production_date: formatDatePickerValue(value),
              })
            }
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '排产日期/余排计划',
        dataIndex: 'scheduled_date',
        key: 'scheduled_date',
        width: 156,
        render: (_value, record) => (
          <DatePicker
            value={toDatePickerValue(record.scheduled_date)}
            onChange={(value) =>
              handleScheduleRowChange(record.id, {
                scheduled_date: formatDatePickerValue(value),
              })
            }
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '上次排产日期',
        dataIndex: 'last_scheduled_date',
        key: 'last_scheduled_date',
        width: 148,
        render: (_value, record) => (
          <DatePicker
            value={toDatePickerValue(record.last_scheduled_date)}
            onChange={(value) =>
              handleScheduleRowChange(record.id, {
                last_scheduled_date: formatDatePickerValue(value),
              })
            }
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '排产数量',
        dataIndex: 'scheduled_quantity',
        key: 'scheduled_quantity',
        width: 118,
        render: (_value, record) => (
          <InputNumber
            min={0}
            value={record.scheduled_quantity ?? undefined}
            onChange={(value) =>
              handleScheduleRowChange(record.id, {
                scheduled_quantity: value == null ? null : Number(value),
              })
            }
            style={{ width: '100%' }}
          />
        ),
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 180,
        render: (_value, record) => (
          <Input
            value={record.remark ?? undefined}
            onChange={(event) =>
              handleScheduleRowChange(record.id, {
                remark: event.target.value,
              })
            }
          />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 72,
        align: 'center',
        render: (_value, record) => (
          <Button
            danger
            size="small"
            icon={<TrashIcon className="size-4" />}
            onClick={() => handleDeleteScheduleRow(record.id)}
          />
        ),
      },
    ],
    [handleDeleteScheduleRow, handleProcessSelect, handleScheduleRowChange],
  )

  const tabItems = useMemo(
    () => [
      {
        key: 'review',
        label: `订单初审 ${orders.length}`,
        children: (
          <Table<ProductionSchedulingOrder>
            size="small"
            rowKey={getOrderRowKey}
            columns={reviewColumns}
            dataSource={orders}
            loading={tableLoading}
            pagination={tablePagination}
            scroll={{ x: 2200, y: tableScrollY }}
            tableLayout="fixed"
          />
        ),
      },
      {
        key: 'status',
        label: `排产状态 ${orders.length}`,
        children: (
          <Table<ProductionSchedulingOrder>
            size="small"
            rowKey={getOrderRowKey}
            columns={statusColumns}
            dataSource={orders}
            loading={tableLoading}
            pagination={tablePagination}
            scroll={{ x: 2450, y: tableScrollY }}
            tableLayout="fixed"
          />
        ),
      },
      {
        key: 'total-pending',
        label: `总待排 ${totalPendingOrders.length}`,
        children: (
          <Table<ProductionSchedulingOrder>
            size="small"
            rowKey={getOrderRowKey}
            columns={totalPendingColumns}
            dataSource={totalPendingOrders}
            loading={tableLoading}
            pagination={tablePagination}
            scroll={{ x: 2100, y: tableScrollY }}
            tableLayout="fixed"
          />
        ),
      },
      {
        key: 'process-pending',
        label: `工序待排 ${pendingProcessRows.length}`,
        children: (
          <Table<ProductionSchedulingProcessRow>
            size="small"
            rowKey="key"
            columns={processPendingColumns}
            dataSource={pendingProcessRows}
            loading={tableLoading}
            pagination={{ pageSize, showSizeChanger: true }}
            scroll={{ x: 2300, y: tableScrollY }}
            tableLayout="fixed"
          />
        ),
      },
      {
        key: 'process-scheduled',
        label: `工序已排 ${scheduledProcessRows.length}`,
        children: (
          <Table<ProductionSchedulingProcessRow>
            size="small"
            rowKey="key"
            columns={processScheduledColumns}
            dataSource={scheduledProcessRows}
            loading={tableLoading}
            pagination={{ pageSize, showSizeChanger: true }}
            scroll={{ x: 2400, y: tableScrollY }}
            tableLayout="fixed"
          />
        ),
      },
      {
        key: 'process-remaining',
        label: `工序余排 ${remainingProcessRows.length}`,
        children: (
          <Table<ProductionSchedulingProcessRow>
            size="small"
            rowKey="key"
            columns={processRemainingColumns}
            dataSource={remainingProcessRows}
            loading={tableLoading}
            pagination={{ pageSize, showSizeChanger: true }}
            scroll={{ x: 2500, y: tableScrollY }}
            tableLayout="fixed"
          />
        ),
      },
    ],
    [
      orders,
      pageSize,
      pendingProcessRows,
      processPendingColumns,
      processRemainingColumns,
      processScheduledColumns,
      remainingProcessRows,
      reviewColumns,
      scheduledProcessRows,
      statusColumns,
      tableLoading,
      tablePagination,
      tableScrollY,
      totalPendingColumns,
      totalPendingOrders,
    ],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            订单排产
          </Title>
          <Text type="secondary">
            覆盖初审、计划日期、工序待排、已排和余排明细。
          </Text>
        </div>
        <Form<SearchFormValues>
          form={searchForm}
          layout="inline"
          initialValues={DEFAULT_FILTERS}
          onFinish={handleSearch}
          className="gap-y-2"
        >
          <Form.Item name="projectNo" label="项目号">
            <Input allowClear placeholder="多关键词用空格分隔" />
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Input allowClear placeholder="产品/客户型号" />
          </Form.Item>
          <Form.Item name="customer" label="客户">
            <Input allowClear />
          </Form.Item>
          <Form.Item name="status" label="订单状态">
            <Select
              style={{ width: 118 }}
              options={[
                { label: '全部', value: '全部' },
                ...WORKSHOP_ORDER_STATUS_OPTIONS.map((item) => ({
                  label: item.label,
                  value: item.value,
                })),
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
          <Form.Item>
            <Button
              icon={<ArrowPathIcon className="size-4" />}
              onClick={() => refetch()}
              loading={isFetching}
            />
          </Form.Item>
        </Form>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-3 text-sm md:grid-cols-6">
        <div>
          <Text type="secondary">订单数</Text>
          <div className="text-lg font-semibold">{summary.totalOrders}</div>
        </div>
        <div>
          <Text type="secondary">总待排</Text>
          <div className="text-lg font-semibold">
            {renderQuantity(summary.totalQuantity)}
          </div>
        </div>
        <div>
          <Text type="secondary">已排产</Text>
          <div className="text-lg font-semibold text-emerald-700">
            {renderQuantity(summary.scheduledQuantity)}
          </div>
        </div>
        <div>
          <Text type="secondary">余排产</Text>
          <div className="text-lg font-semibold text-amber-700">
            {renderQuantity(summary.remainingQuantity)}
          </div>
        </div>
        <div>
          <Text type="secondary">已加工</Text>
          <div className="text-lg font-semibold text-sky-700">
            {renderQuantity(summary.processedQuantity)}
          </div>
        </div>
        <div>
          <Text type="secondary">转移</Text>
          <div className="text-lg font-semibold text-indigo-700">
            {renderQuantity(summary.transferQuantity)}
          </div>
        </div>
      </div>

      <div ref={tabsContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as SchedulingTabKey)}
          items={tabItems}
          destroyOnHidden
          className="flex h-full min-h-0 flex-col [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:overflow-hidden"
        />
      </div>

      <Modal
        title={editingOrder?.project_no || '订单初审'}
        open={reviewModalOpen}
        width={960}
        okText="保存"
        cancelText="取消"
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        onCancel={() => {
          setReviewModalOpen(false)
          setEditingOrder(null)
        }}
        onOk={handleSaveReview}
      >
        <Form<ReviewFormValues> form={reviewForm} layout="vertical">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <Form.Item name="order_date" label="订单日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="planned_start_date" label="计划开工日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="planned_finish_date" label="计划完成日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="delivery_review_result" label="交期评审结果">
              <Input allowClear />
            </Form.Item>
            <Form.Item name="tooling_status" label="工装夹具情况">
              <Select allowClear options={TOOLING_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="capacity_per_day" label="产能">
              <InputNumber
                min={0}
                placeholder={isReviewCapacityFetching ? '匹配中' : undefined}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="material_status" label="物料状态">
              <Select allowClear options={MATERIAL_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="order_category" label="订单类别归类">
              <Select allowClear options={ORDER_CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item name="delivery_priority" label="交期状态">
              <Select allowClear options={DELIVERY_PRIORITY_OPTIONS} />
            </Form.Item>
            <Form.Item label="工艺流程" className="md:col-span-3">
              <div className="flex flex-col gap-2 md:flex-row">
                <Form.Item name="process_flow" noStyle>
                  <Input allowClear placeholder="如：精切→CNC→冲床" />
                </Form.Item>
                <Select<string>
                  showSearch={{ optionFilterProp: 'label' }}
                  value={undefined}
                  placeholder="选择工序追加"
                  options={PROCESS_FLOW_SELECT_OPTIONS}
                  onSelect={handleAppendProcessFlow}
                  style={{ minWidth: 180 }}
                />
              </div>
            </Form.Item>
            <Form.Item
              name="process_requirement"
              label="工艺要求说明"
              className="md:col-span-2"
            >
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
            <Form.Item name="bottleneck_processes" label="瓶颈工序">
              <Input allowClear />
            </Form.Item>
            <Form.Item
              name="scheduling_remark"
              label="备注"
              className="md:col-span-3"
            >
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={editingOrder?.project_no || '工序排产'}
        open={scheduleModalOpen}
        width={1180}
        okText="保存"
        cancelText="取消"
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        onCancel={() => {
          setScheduleModalOpen(false)
          setEditingOrder(null)
          setScheduleRows([])
        }}
        onOk={handleSaveSchedules}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">
            <span>订单数量：</span>
            <span className="font-medium">
              {renderQuantity(editingOrder?.order_quantity)}
            </span>
            <span className="ml-4">工艺流程：</span>
            <span className="font-medium">
              {renderProcessFlow(editingOrder?.process_flow)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              icon={<QueueListIcon className="size-4" />}
              onClick={handleResetSchedulesFromFlow}
            >
              按流程生成
            </Button>
            <Button
              size="small"
              icon={<PlusIcon className="size-4" />}
              onClick={handleAddScheduleRow}
            >
              新增工序
            </Button>
          </div>
        </div>
        <Table<WorkshopOrderProcessSchedule>
          size="small"
          rowKey="id"
          columns={scheduleEditColumns}
          dataSource={scheduleRows}
          pagination={false}
          scroll={{ x: 1100, y: SCHEDULE_EDIT_TABLE_SCROLL_Y }}
          tableLayout="fixed"
        />
      </Modal>
    </div>
  )
}
