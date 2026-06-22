import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TableCellsIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType, TableProps } from 'antd'
import {
  App,
  Button,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import zhCN from 'antd/es/locale/zh_CN'

import { WORKSHOP_ORDER_STATUS_OPTIONS } from '@/features/workshop/OrderList/orderStatus'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import ExportButton from '@/ui/ExportButton'
import { getErrorDisplayInfo } from '@/utils/errorHandler'
import type {
  ProductionSchedulingFilters,
  ProductionSchedulingOrder,
  ProductionSchedulingOrderUpdate,
} from '@/services/apiProductionScheduling'
import { getAllEmployees } from '@/services/apiEmployees'
import { exportProductionScheduledPlanToExcel } from '@/utils/productionSchedulingPlanExcel'
import {
  useProductionSchedulingOrders,
  useUpdateProductionSchedulingOrder,
} from './useProductionScheduling'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'

const { Text, Title } = Typography

type SearchFormValues = {
  customer?: string
  model?: string
  projectNo?: string
  status?: ProductionSchedulingFilters['status']
  progressStatus?: string
  plannedStartDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  orderDateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
}

type SchedulingFormValues = {
  planned_finish_date?: dayjs.Dayjs | null
  planned_start_date?: dayjs.Dayjs | null
  product_delivery_date?: dayjs.Dayjs | null
  process_requirement?: string | null
  tooling_status?: string | null
  responsible_person_ids?: string[]
  progress_status?: string | null
  progress_percent?: number | null
  scheduling_remark?: string | null
}

const DEFAULT_FILTERS: ProductionSchedulingFilters = {
  status: '生产中',
}

const DEFAULT_PAGE_SIZE = 20

const PROGRESS_STATUS_OPTIONS = [
  { label: '未开工', value: '未开工' },
  { label: '进行中', value: '进行中' },
  { label: '已完工', value: '已完工' },
  { label: '延期', value: '延期' },
]

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

function renderDateTime(value: string | null | undefined) {
  return value ? (
    dayjs(value).format('YYYY-MM-DD HH:mm')
  ) : (
    <Text type="secondary">-</Text>
  )
}

function renderQuantity(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue.toLocaleString() : '-'
}

function renderOrderCode(order: ProductionSchedulingOrder) {
  return order.id ? order.id.slice(0, 8) : '-'
}

function toDatePickerValue(value: string | null | undefined) {
  return value ? dayjs(value) : null
}

function formatDatePickerValue(value: dayjs.Dayjs | null | undefined) {
  return value ? value.format('YYYY-MM-DD') : null
}

function getProductSpec(order: ProductionSchedulingOrder | null) {
  if (!order) {
    return ''
  }

  return [
    order.product_model,
    order.customer_model,
    order.material_name,
    order.material_code,
    order.length_mm ? `${order.length_mm}mm` : null,
    order.color_name,
  ]
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter(Boolean)
    .join(' / ')
}

function getProgressText(order: ProductionSchedulingOrder) {
  const status = order.progress_status?.trim()
  const orderQuantity = Number(order.order_quantity || 0)
  const transferQuantity = Number(order.transfer_quantity || 0)

  if (status === '延期') {
    return '延期'
  }

  if (orderQuantity > 0 && transferQuantity >= orderQuantity) {
    return '已完工'
  }

  if (transferQuantity > 0) {
    return `进行中（${order.transfer_rate.toFixed(1)}%）`
  }

  return status || '未开工'
}

function getProgressStatus(order: ProductionSchedulingOrder) {
  const progressText = getProgressText(order)

  if (progressText.startsWith('进行中')) {
    return '进行中'
  }

  return progressText
}

function getProgressPercentValue(order: ProductionSchedulingOrder) {
  const transferRate = Number(order.transfer_rate || 0)

  if (transferRate > 0) {
    return Math.min(100, Number(transferRate.toFixed(1)))
  }

  return order.progress_percent ?? null
}

function getOrderRowKey(order: ProductionSchedulingOrder) {
  return (
    order.id || order.project_no || `${order.customer}-${order.product_model}`
  )
}

/**
 * 从 project_no 中提取订单日期。
 * 约定：前 6 位为 YYMMDD（世纪基准 2000），例如 25052702-01 → 2025-05-27。
 * 长度不足、含非数字或日期越界时返回 null。
 */
function parseProjectNoDate(
  projectNo: string | null | undefined,
): string | null {
  if (!projectNo) return null
  const head = projectNo.replace(/[\s-].*$/, '').slice(0, 6)
  if (!/^\d{6}$/.test(head)) return null
  const yy = Number(head.slice(0, 2))
  const mm = Number(head.slice(2, 4))
  const dd = Number(head.slice(4, 6))
  const date = dayjs(
    `20${String(yy).padStart(2, '0')}-${mm}-${dd}`,
    'YYYY-M-D',
    true,
  )
  if (!date.isValid()) return null
  return date.format('YYYY-MM-DD')
}

function makeSchedulingInitialValues(
  order: ProductionSchedulingOrder,
): SchedulingFormValues {
  return {
    planned_start_date: toDatePickerValue(order.planned_start_date),
    planned_finish_date: toDatePickerValue(order.planned_finish_date),
    product_delivery_date: toDatePickerValue(order.product_delivery_date),
    process_requirement: order.process_requirement ?? null,
    tooling_status: order.tooling_status ?? null,
    responsible_person_ids: order.responsible_person_ids ?? [],
    progress_status: getProgressStatus(order),
    progress_percent: getProgressPercentValue(order),
    scheduling_remark: order.scheduling_remark ?? null,
  }
}

function formatSchedulingPayload(
  order: ProductionSchedulingOrder,
  values: SchedulingFormValues,
  employeeMap: Map<string, string>,
): ProductionSchedulingOrderUpdate {
  const responsible_person_ids = values.responsible_person_ids ?? []
  const responsible_person_names = responsible_person_ids
    .map((id) => employeeMap.get(id))
    .filter((name): name is string => Boolean(name))

  return {
    ...values,
    planned_start_date: formatDatePickerValue(values.planned_start_date),
    planned_finish_date: formatDatePickerValue(values.planned_finish_date),
    product_delivery_date: formatDatePickerValue(values.product_delivery_date),
    progress_percent: getProgressPercentValue(order),
    progress_status: getProgressStatus(order),
    responsible_person_ids,
    responsible_person_names,
  }
}

function getSummary(orders: ProductionSchedulingOrder[]) {
  return orders.reduce(
    (summary, order) => {
      const progressStatus = getProgressStatus(order)

      return {
        delayedOrders:
          summary.delayedOrders + (progressStatus === '延期' ? 1 : 0),
        finishedOrders:
          summary.finishedOrders + (progressStatus === '已完工' ? 1 : 0),
        inProgressOrders:
          summary.inProgressOrders + (progressStatus === '进行中' ? 1 : 0),
        totalOrders: summary.totalOrders + 1,
        totalQuantity:
          summary.totalQuantity + Number(order.order_quantity || 0),
      }
    },
    {
      delayedOrders: 0,
      finishedOrders: 0,
      inProgressOrders: 0,
      totalOrders: 0,
      totalQuantity: 0,
    },
  )
}

function makeOrderColumns({
  onEdit,
}: {
  onEdit: (record: ProductionSchedulingOrder) => void
}): TableColumnsType<ProductionSchedulingOrder> {
  return [
    {
      title: '订单编号',
      key: 'order_code',
      width: 110,
      fixed: 'left',
      render: (_value, record) => renderText(renderOrderCode(record)),
    },
    {
      title: '订单日期',
      key: 'order_date',
      width: 100,
      render: (_value, record) => renderText(parseProjectNoDate(record.project_no)),
    },
    {
      title: '项目号',
      dataIndex: 'project_no',
      key: 'project_no',
      width: 130,
      fixed: 'left',
      render: renderText,
    },
    {
      title: '客户名称',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
      render: renderText,
    },
    {
      title: '产品名称及规格',
      key: 'product_spec',
      width: 240,
      ellipsis: true,
      render: (_value, record) => renderText(getProductSpec(record)),
    },
    {
      title: '订单数量',
      dataIndex: 'order_quantity',
      key: 'order_quantity',
      width: 100,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '合格标准',
      dataIndex: 'process_requirement',
      key: 'process_requirement',
      width: 160,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '计划开工时间',
      dataIndex: 'planned_start_date',
      key: 'planned_start_date',
      width: 128,
      render: renderDate,
    },
    {
      title: '计划完工时间',
      dataIndex: 'planned_finish_date',
      key: 'planned_finish_date',
      width: 128,
      render: renderDate,
    },
    {
      title: '交付日期',
      dataIndex: 'product_delivery_date',
      key: 'product_delivery_date',
      width: 118,
      render: renderDate,
    },
    {
      title: '分配设备(ERP编号)',
      dataIndex: 'tooling_status',
      key: 'tooling_status',
      width: 160,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '负责班组/人员',
      dataIndex: 'responsible_person_names',
      key: 'responsible_person_names',
      width: 160,
      render: (value: string[] | null | undefined) =>
        renderText(value?.length ? value.join('、') : null),
    },
    {
      title: '当前进度',
      key: 'progress',
      width: 150,
      render: (_value, record) => renderText(getProgressText(record)),
    },
    {
      title: '转移数量',
      dataIndex: 'transfer_quantity',
      key: 'transfer_quantity',
      width: 110,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '转移进度',
      dataIndex: 'transfer_rate',
      key: 'transfer_rate',
      width: 100,
      align: 'right',
      render: (value) => `${Number(value || 0).toFixed(1)}%`,
    },
    {
      title: '最近转移车间',
      dataIndex: 'transfer_latest_workshop',
      key: 'transfer_latest_workshop',
      width: 130,
      render: renderText,
    },
    {
      title: '最近转移时间',
      dataIndex: 'transfer_latest_date',
      key: 'transfer_latest_date',
      width: 150,
      render: renderDateTime,
    },
    {
      title: '备注',
      dataIndex: 'scheduling_remark',
      key: 'scheduling_remark',
      width: 180,
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
          icon={<PencilSquareIcon className="size-4" />}
          onClick={() => onEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ]
}

interface SummaryCardProps {
  dotColor: string
  label: string
  value: string | number
  valueClass: string
}

function SummaryCard({ dotColor, label, value, valueClass }: SummaryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 transition-opacity duration-200 group-hover:opacity-40" style={{ color: dotColor.replace('bg-', '').replace('-500', '-400') }} />
      <div className="flex items-center justify-between">
        <Text type="secondary" className="!text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </Text>
        <span
          aria-hidden
          className={'inline-flex size-2.5 rounded-full ring-2 ring-white ' + dotColor}
        />
      </div>
      <div className={'mt-2 text-3xl font-bold tabular-nums tracking-tight ' + valueClass}>
        {value}
      </div>
    </div>
  )
}

export default function ProductionScheduling() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [searchForm] = Form.useForm<SearchFormValues>()
  const [schedulingForm] = Form.useForm<SchedulingFormValues>()
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight()
  const [filters, setFilters] =
    useState<ProductionSchedulingFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [editingOrder, setEditingOrder] =
    useState<ProductionSchedulingOrder | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: getAllEmployees,
    staleTime: 5 * 60 * 1000,
  })
  const { data: machineOptions = [] } = useMachineEquipmentOptions()
  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.id, e.name])),
    [employees],
  )
  const machineSelectOptions = useMemo(
    () =>
      machineOptions.map((item) => ({
        value: item.unified_device_no,
        label: `${item.unified_device_no} | ${item.machine_name}`,
      })),
    [machineOptions],
  )

  const {
    data: schedulingResult,
    isFetching,
    isLoading,
    refetch,
  } = useProductionSchedulingOrders({ filters, page, pageSize })
  const updateMutation = useUpdateProductionSchedulingOrder()
  const orders = useMemo(
    () => schedulingResult?.orders ?? [],
    [schedulingResult?.orders],
  )
  const total = schedulingResult?.total ?? 0
  const tableLoading = isLoading && orders.length === 0
  const summary = useMemo(() => getSummary(orders), [orders])
  const selectedOrders = useMemo(() => {
    if (selectedRowKeys.length === 0) return orders
    const keySet = new Set(selectedRowKeys.map(String))
    return orders.filter((o) => keySet.has(String(getOrderRowKey(o))))
  }, [orders, selectedRowKeys])

  const openEditModal = useCallback(
    (order: ProductionSchedulingOrder) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setEditingOrder(order)
      schedulingForm.setFieldsValue(makeSchedulingInitialValues(order))
      setModalOpen(true)
    },
    [message, schedulingForm, viewerDenied, viewerOperationTip],
  )

  const columns = useMemo(
    () => makeOrderColumns({ onEdit: openEditModal }),
    [openEditModal],
  )

  const rowSelection: TableProps<ProductionSchedulingOrder>['rowSelection'] =
    useMemo(
      () => ({
        selectedRowKeys,
        onChange: (keys) => setSelectedRowKeys(keys),
        fixed: true,
        columnWidth: 40,
        preserveSelectedRowKeys: true,
      }),
      [selectedRowKeys],
    )

  useEffect(() => {
    setSelectedRowKeys([])
  }, [page, pageSize, filters])

  const handleSearch = useCallback((values: SearchFormValues) => {
    setPage(1)
    const plannedRange = values.plannedStartDateRange
    const orderRange = values.orderDateRange
    setFilters({
      customer: values.customer?.trim() || undefined,
      model: values.model?.trim() || undefined,
      projectNo: values.projectNo?.trim() || undefined,
      status: values.status || '生产中',
      progressStatus: values.progressStatus || undefined,
      plannedStartDateFrom: plannedRange?.[0]
        ? plannedRange[0].format('YYYY-MM-DD')
        : undefined,
      plannedStartDateTo: plannedRange?.[1]
        ? plannedRange[1].format('YYYY-MM-DD')
        : undefined,
      orderDateFrom: orderRange?.[0]
        ? orderRange[0].format('YYYY-MM-DD')
        : undefined,
      orderDateTo: orderRange?.[1]
        ? orderRange[1].format('YYYY-MM-DD')
        : undefined,
    })
  }, [])

  const handleReset = useCallback(() => {
    searchForm.resetFields()
    setPage(1)
    setFilters(DEFAULT_FILTERS)
  }, [searchForm])

  const handleSave = useCallback(async () => {
    if (!editingOrder?.id) {
      return
    }

    try {
      const values = await schedulingForm.validateFields()
      await updateMutation.mutateAsync({
        id: editingOrder.id,
        values: formatSchedulingPayload(editingOrder, values, employeeMap),
      })
      message.success('订单排产信息已保存')
      setModalOpen(false)
      setEditingOrder(null)
    } catch (error) {
      const { message: errorMessage } = getErrorDisplayInfo(
        error,
        '订单排产信息保存失败',
      )
      message.error(errorMessage)
    }
  }, [editingOrder, message, schedulingForm, updateMutation, employeeMap])

  const handleExport = useCallback(() => {
    if (selectedOrders.length === 0) {
      message.warning(
        selectedRowKeys.length > 0
          ? '当前页已选条目已全部移出视图，请重新勾选'
          : '当前没有可导出的订单排产数据',
      )
      return
    }

    exportProductionScheduledPlanToExcel(selectedOrders)
  }, [message, selectedOrders, selectedRowKeys])

  const PROGRESS_STATUS_TAGS: Array<{ label: string; value: string | null }> = [
    { label: '全部', value: null },
    { label: '未开工', value: '未开工' },
    { label: '进行中', value: '进行中' },
    { label: '已完工', value: '已完工' },
    { label: '延期', value: '延期' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 p-3">
      {/* 标题区 + 进度快捷标签 */}
      <div className="relative overflow-hidden rounded-xl border border-blue-100/50 bg-white px-4 py-4 shadow-sm">
        {/* 背景装饰 */}
        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-blue-100/40 to-blue-50/20 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-gradient-to-tr from-blue-50/30 to-transparent blur-xl" />
        
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-1 shrink-0 items-center justify-center">
              <div className="h-full w-1 rounded-full bg-gradient-to-b from-[#1677ff] via-blue-500 to-blue-400 shadow-sm shadow-blue-200" />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }} className="!text-xl !font-bold !text-slate-800">
                <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">订单排产</span>
              </Title>
              <Text type="secondary" className="!text-sm text-slate-500">
                基础版排产表，仅维护订单、计划时间、设备人员、进度和备注。
              </Text>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Text type="secondary" className="mr-1 !text-xs font-medium uppercase tracking-wide text-slate-400">
              快速筛选
            </Text>
            {PROGRESS_STATUS_TAGS.map((tag) => {
              const active =
                (tag.value ?? null) === (filters.progressStatus ?? null)
              return (
                <Tag.CheckableTag
                  key={tag.label}
                  checked={active}
                  onChange={() => {
                    const nextProgress = tag.value ?? undefined
                    setPage(1)
                    setFilters((prev) => ({
                      ...prev,
                      progressStatus: nextProgress,
                    }))
                    searchForm.setFieldsValue({
                      progressStatus: tag.value ?? undefined,
                    })
                  }}
                  className={
                    '!m-0 rounded-full border px-3.5 !text-xs font-medium transition-all duration-200 ' +
                    (active
                      ? '!border-[#1677ff] !bg-gradient-to-r !from-[#1677ff] !to-blue-400 !text-white !shadow-sm !shadow-blue-200'
                      : '!border-slate-200 !bg-white !text-slate-600 hover:!border-blue-300 hover:!bg-blue-50/50 hover:!text-blue-600')
                  }
                >
                  {tag.label}
                </Tag.CheckableTag>
              )
            })}
          </div>
        </div>
      </div>

      {/* 搜索区 */}
      <div className="rounded-xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="border-b border-slate-100 px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">筛选条件</span>
        </div>
        <div className="p-4">
          <Form<SearchFormValues>
            form={searchForm}
            layout="inline"
            initialValues={DEFAULT_FILTERS}
            onFinish={handleSearch}
            className="flex flex-wrap items-end gap-x-4 gap-y-3"
          >
            <Form.Item name="projectNo" label={<span className="!text-xs text-slate-500">项目号</span>} className="!mb-0">
              <Input allowClear placeholder="多关键词用空格分隔" className="!w-48" />
            </Form.Item>
            <Form.Item name="model" label={<span className="!text-xs text-slate-500">型号</span>} className="!mb-0">
              <Input allowClear placeholder="产品/客户型号" className="!w-36" />
            </Form.Item>
            <Form.Item name="customer" label={<span className="!text-xs text-slate-500">客户</span>} className="!mb-0">
              <Input allowClear className="!w-32" />
            </Form.Item>
            <Form.Item name="status" label={<span className="!text-xs text-slate-500">订单状态</span>} className="!mb-0">
              <Select
                className="!w-28"
                options={[
                  { label: '全部', value: '全部' },
                  ...WORKSHOP_ORDER_STATUS_OPTIONS.map((item) => ({
                    label: item.label,
                    value: item.value,
                  })),
                ]}
              />
            </Form.Item>
            <Form.Item name="progressStatus" label={<span className="!text-xs text-slate-500">当前进度</span>} className="!mb-0">
              <Select
                allowClear
                className="!w-28"
                placeholder="全部"
                options={[
                  { label: '未开工', value: '未开工' },
                  { label: '进行中', value: '进行中' },
                  { label: '已完工', value: '已完工' },
                  { label: '延期', value: '延期' },
                ]}
              />
            </Form.Item>
            <Form.Item name="plannedStartDateRange" label={<span className="!text-xs text-slate-500">计划开工</span>} className="!mb-0">
              <DatePicker.RangePicker
                allowClear
                className="!w-52"
                placeholder={['开始', '结束']}
              />
            </Form.Item>
            <Form.Item name="orderDateRange" label={<span className="!text-xs text-slate-500">订单日期</span>} className="!mb-0">
              <DatePicker.RangePicker
                format="YYYY-MM-DD"
                allowClear
                className="!w-52"
                placeholder={['开始', '结束']}
              />
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit" icon={<ArrowPathIcon className="size-4" />}>
                查询
              </Button>
            </Form.Item>
            <Form.Item className="!mb-0">
              <Button onClick={handleReset}>重置</Button>
            </Form.Item>
          </Form>
        </div>
      </div>

      {/* 摘要卡 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        <SummaryCard
          label="订单数"
          value={summary.totalOrders}
          dotColor="bg-slate-400"
          valueClass="text-slate-700"
        />
        <SummaryCard
          label="订单数量"
          value={renderQuantity(summary.totalQuantity)}
          dotColor="bg-slate-400"
          valueClass="text-slate-700"
        />
        <SummaryCard
          label="进行中"
          value={summary.inProgressOrders}
          dotColor="bg-sky-500"
          valueClass="text-sky-600"
        />
        <SummaryCard
          label="已完工"
          value={summary.finishedOrders}
          dotColor="bg-emerald-500"
          valueClass="text-emerald-600"
        />
        <SummaryCard
          label="延期"
          value={summary.delayedOrders}
          dotColor="bg-rose-500"
          valueClass="text-rose-600"
        />
      </div>

      {/* 操作条 */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-600">
            <span className="text-slate-400">共</span>
            <span className="ml-1 font-semibold text-slate-800">{summary.totalOrders}</span>
            <span className="ml-1 text-slate-400">条</span>
          </span>
          {selectedRowKeys.length > 0 && (
            <span className="rounded-full bg-gradient-to-r from-blue-500/10 to-blue-400/10 px-3 py-0.5 text-xs font-medium text-blue-600 ring-1 ring-blue-200/50">
              已选 {selectedOrders.length} 条
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            handleExport={handleExport}
            count={selectedOrders.length}
          >
            {selectedRowKeys.length > 0
              ? `导出选中 (${selectedOrders.length})`
              : '导出基础排产表'}
          </ExportButton>
          <Button
            type="text"
            icon={<ArrowPathIcon className="size-4" />}
            onClick={() => refetch()}
            loading={isFetching}
            className="text-slate-500 hover:text-blue-500"
          />
        </div>
      </div>

      {/* 表格区 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <Table<ProductionSchedulingOrder>
            size="small"
            rowKey={getOrderRowKey}
            columns={columns}
            dataSource={orders}
            loading={tableLoading}
            pagination={false}
            scroll={{ x: 2530, y: scrollY }}
            tableLayout="fixed"
            rowSelection={rowSelection}
            rowClassName={(_record, index) =>
              index % 2 === 0 ? 'bg-slate-50/40' : ''
            }
            className="[&_.ant-table]:!font-medium"
          />
        </div>
        <div
          ref={paginationRef}
          className="flex shrink-0 justify-end border-t border-slate-100 px-3 py-2"
        >
          <ConfigProvider locale={zhCN}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger={{ getPopupContainer: () => document.body }}
              showTotal={(value) => `共 ${value} 条`}
              onChange={(nextPage, nextPageSize) => {
                setPage(nextPage)
                setPageSize(nextPageSize || DEFAULT_PAGE_SIZE)
              }}
            />
          </ConfigProvider>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-400" />
            <span className="font-semibold">{editingOrder?.project_no || '编辑订单排产'}</span>
          </div>
        }
        open={modalOpen}
        width={860}
        okText="保存"
        cancelText="取消"
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        classNames={{ 
          container: 'rounded-xl',
          mask: 'backdrop-blur-sm',
        }}
        styles={{
          header: {
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: 12,
            marginBottom: 16,
            background: 'linear-gradient(to bottom, #fafbfc, #ffffff)',
          },
          body: {
            padding: '0 4px 4px',
          },
        }}
        onCancel={() => {
          setModalOpen(false)
          setEditingOrder(null)
        }}
        onOk={handleSave}
      >
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-white px-4 py-2.5 shadow-sm">
          <TableCellsIcon className="size-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700">{getProductSpec(editingOrder)}</span>
        </div>
        <Form<SchedulingFormValues> form={schedulingForm} layout="vertical" className="[&_.ant-form-item-label>label]:!font-medium">
          <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-3">
            <Form.Item name="planned_start_date" label={<span className="!text-xs !font-medium !text-slate-500">计划开工时间</span>} className="[&_.ant-picker]:!w-full">
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item name="planned_finish_date" label={<span className="!text-xs !font-medium !text-slate-500">计划完工时间</span>} className="[&_.ant-picker]:!w-full">
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item name="product_delivery_date" label={<span className="!text-xs !font-medium !text-slate-500">交付日期</span>} className="[&_.ant-picker]:!w-full">
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item
              name="tooling_status"
              label={<span className="!text-xs !font-medium !text-slate-500">分配设备(ERP编号)</span>}
              className="md:col-span-2"
            >
              <Select
                allowClear
                showSearch
                placeholder="选择机器编号"
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={machineSelectOptions}
              />
            </Form.Item>
            <Form.Item name="responsible_person_ids" label={<span className="!text-xs !font-medium !text-slate-500">负责班组/人员</span>}>
              <Select
                mode="multiple"
                allowClear
                showSearch
                placeholder="选择负责该订单的员工"
                optionFilterProp="label"
                options={employees.map((e) => ({
                  label: e.name,
                  value: e.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="progress_status"
              label={<span className="!text-xs !font-medium !text-slate-500">当前进度</span>}
              extra={<span className="!text-xs text-slate-400">有转移记录时按转移数量自动计算；选择"延期"可覆盖自动进度。</span>}
            >
              <Select allowClear options={PROGRESS_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="progress_percent" label={<span className="!text-xs !font-medium !text-slate-500">进度百分比</span>}>
              <InputNumber
                disabled={Number(editingOrder?.transfer_rate || 0) > 0}
                min={0}
                max={100}
                addonAfter="%"
                className="!w-full"
              />
            </Form.Item>
            <Form.Item
              name="process_requirement"
              label={<span className="!text-xs !font-medium !text-slate-500">合格标准</span>}
              className="md:col-span-3"
            >
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
            <Form.Item
              name="scheduling_remark"
              label={<span className="!text-xs !font-medium !text-slate-500">备注</span>}
              className="md:col-span-3"
            >
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
