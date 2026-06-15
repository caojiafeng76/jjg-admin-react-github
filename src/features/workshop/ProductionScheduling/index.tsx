import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TableCellsIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType, TablePaginationConfig, TableProps } from 'antd'
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
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'

import { WORKSHOP_ORDER_STATUS_OPTIONS } from '@/features/workshop/OrderList/orderStatus'
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
const DEFAULT_TABLE_SCROLL_Y = 520
const MIN_TABLE_SCROLL_Y = 280
const TABLE_SCROLL_VERTICAL_PADDING = 56

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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition-colors duration-150 hover:border-[#1677ff]/40">
      <div className="flex items-center justify-between">
        <Text type="secondary" className="!text-slate-500">
          {label}
        </Text>
        <span
          aria-hidden
          className={'inline-block size-2 rounded-full ' + dotColor}
        />
      </div>
      <div
        className={
          'mt-1 text-2xl font-semibold tabular-nums ' + valueClass
        }
      >
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
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] =
    useState<ProductionSchedulingFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [editingOrder, setEditingOrder] =
    useState<ProductionSchedulingOrder | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tableScrollY, setTableScrollY] = useState(DEFAULT_TABLE_SCROLL_Y)
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

  useEffect(() => {
    const container = tableContainerRef.current
    if (!container) {
      return
    }

    let animationFrameId = 0

    const updateTableScrollY = () => {
      const pagination = container.querySelector<HTMLElement>(
        '.ant-table-pagination',
      )
      const paginationHeight = pagination?.offsetHeight ?? 32
      const nextScrollY = Math.max(
        MIN_TABLE_SCROLL_Y,
        container.clientHeight -
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
  }, [orders.length, pageSize])

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
    <div className="flex h-full min-h-0 flex-col gap-3 bg-slate-50 p-3">
      {/* 标题区 + 进度快捷标签 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1 inline-block h-9 w-1 rounded-full bg-[#1677ff]"
          />
          <div>
            <Title level={4} style={{ margin: 0 }} className="!text-xl !font-semibold !text-slate-800">
              订单排产
            </Title>
            <Text type="secondary" className="!text-slate-500">
              基础版排产表，仅维护订单、计划时间、设备人员、进度和备注。
            </Text>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Text type="secondary" className="mr-1 !text-slate-500">
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
                  '!m-0 rounded-md border px-3 !text-sm transition-colors duration-150 ' +
                  (active
                    ? '!border-[#1677ff] !bg-[#1677ff] !text-white'
                    : '!border-slate-200 !bg-white !text-slate-600 hover:!border-[#1677ff]/40 hover:!text-[#1677ff]')
                }
              >
                {tag.label}
              </Tag.CheckableTag>
            )
          })}
        </div>
      </div>

      {/* 搜索区 */}
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
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
          <Form.Item name="progressStatus" label="当前进度">
            <Select
              allowClear
              style={{ width: 110 }}
              placeholder="全部"
              options={[
                { label: '未开工', value: '未开工' },
                { label: '进行中', value: '进行中' },
                { label: '已完工', value: '已完工' },
                { label: '延期', value: '延期' },
              ]}
            />
          </Form.Item>
          <Form.Item name="plannedStartDateRange" label="计划开工">
            <DatePicker.RangePicker
              allowClear
              style={{ width: 240 }}
              placeholder={['开始日期', '结束日期']}
            />
          </Form.Item>
          <Form.Item name="orderDateRange" label="订单日期">
            <DatePicker.RangePicker
              format="YYYY-MM-DD"
              allowClear
              placeholder={['开始', '结束']}
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

      {/* 摘要卡 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <SummaryCard
          label="订单数"
          value={summary.totalOrders}
          dotColor="bg-slate-400"
          valueClass="text-slate-800"
        />
        <SummaryCard
          label="订单数量"
          value={renderQuantity(summary.totalQuantity)}
          dotColor="bg-slate-400"
          valueClass="text-slate-800"
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
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>共 {summary.totalOrders} 条</span>
          {selectedRowKeys.length > 0 && (
            <span className="rounded-full bg-[#1677ff]/10 px-2 py-0.5 text-xs font-medium text-[#1677ff]">
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
        </div>
      </div>

      {/* 表格区 */}
      <div
        ref={tableContainerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-white"
      >
        <Table<ProductionSchedulingOrder>
          size="small"
          rowKey={getOrderRowKey}
          columns={columns}
          dataSource={orders}
          loading={tableLoading}
          pagination={tablePagination}
          scroll={{ x: 2530, y: tableScrollY }}
          tableLayout="fixed"
          rowSelection={rowSelection}
          rowClassName={(_record, index) =>
            index % 2 === 0 ? 'bg-slate-50/40' : ''
          }
        />
      </div>

      <Modal
        title={editingOrder?.project_no || '编辑订单排产'}
        open={modalOpen}
        width={860}
        okText="保存"
        cancelText="取消"
        confirmLoading={updateMutation.isPending}
        destroyOnHidden
        classNames={{ container: 'rounded-xl' }}
        styles={{
          header: {
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 12,
            marginBottom: 16,
          },
        }}
        onCancel={() => {
          setModalOpen(false)
          setEditingOrder(null)
        }}
        onOk={handleSave}
      >
        <div className="mb-3 flex items-center gap-2 rounded-md border border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-2 text-sm text-slate-700">
          <TableCellsIcon className="size-4 text-slate-500" />
          <span>{getProductSpec(editingOrder)}</span>
        </div>
        <Form<SchedulingFormValues> form={schedulingForm} layout="vertical">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <Form.Item name="planned_start_date" label="计划开工时间">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="planned_finish_date" label="计划完工时间">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="product_delivery_date" label="交付日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="tooling_status"
              label="分配设备(ERP编号)"
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
            <Form.Item name="responsible_person_ids" label="负责班组/人员">
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
              label="当前进度"
              extra="有转移记录时按转移数量自动计算；选择“延期”可覆盖自动进度。"
            >
              <Select allowClear options={PROGRESS_STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item name="progress_percent" label="进度百分比">
              <InputNumber
                disabled={Number(editingOrder?.transfer_rate || 0) > 0}
                min={0}
                max={100}
                addonAfter="%"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item
              name="process_requirement"
              label="合格标准"
              className="md:col-span-3"
            >
              <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
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
    </div>
  )
}
