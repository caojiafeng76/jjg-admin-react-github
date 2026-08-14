import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType, TableProps } from 'antd'
import {
  App,
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import { isAdminRole } from '@/config/access'
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
  OrderStatusJobColumn,
  ReworkRepairInfo,
} from '@/services/apiOrderStatusDashboard'
import { getOrderStatusDashboardForExport } from '@/services/apiOrderStatusDashboard'
import AppPagination from '@/ui/AppPagination'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import {
  ORDER_STATUS_DASHBOARD_KEY,
  useOrderStatusDashboard,
} from './useOrderStatusDashboard'
import {
  applyColumnWidths,
  canCloseDashboardOrder,
  DEFAULT_PAGE_SIZE,
  EMPTY_SEARCH_VALUES,
  extractNumberFilters,
  extractTextFilters,
  getTableColumnWidth,
  normalizeProductionStatusFilter,
  normalizeStatusTab,
  PRODUCTION_STATUS_OPTIONS,
  STATUS_TABS,
  type ColumnWidthMap,
  type SearchValues,
} from './dashboardUtils'
import {
  DENSE_TABLE_COMPONENTS,
  renderExtrusionQuantityCell,
  renderJobOutputCell,
  renderPercent,
  renderPrecisionCuttingQuantityCell,
  renderQuantity,
  renderReworkRepairStatus,
  renderText,
  renderTransferQuantityCell,
  renderTransferWorkshops,
  SelectedExtrusionDetail,
  SelectedJobDetail,
  SelectedPrecisionCuttingDetail,
  SelectedTransferDetail,
  Text,
  Title,
} from './dashboardRenderUtils'
import { ExtrusionDetailModal } from './ExtrusionDetailModal'
import { OrderStatusKpiGrid } from './OrderStatusKpiGrid'
import { PrecisionCuttingDetailModal } from './PrecisionCuttingDetailModal'
import { ProductionDetailModal } from './ProductionDetailModal'
import { TransferDetailModal } from './TransferDetailModal'

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
  // KPI 看板默认策略：可视高度 ≥800px（1080p 及以上）默认展开，小屏默认收起保表格；
  // 用户可随时通过页头"看板"按钮切换。
  const [showKpis, setShowKpis] = useState(() => window.innerHeight >= 800)
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
      targetRowCount: Math.min(pageSize, 10),
      minRowHeight: 24,
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
    <div className="flex h-full min-h-0 flex-col gap-1.5 p-3">
      {/* 标题区 */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100/50 bg-gradient-to-br from-white via-blue-50/30 to-slate-50/50 px-4 py-2 shadow-sm dark:border-blue-900/40 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/40">
        {/* 背景装饰元素 */}
        <div className="absolute -top-8 -right-8 size-32 rounded-full bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-transparent blur-3xl dark:from-blue-900/30 dark:via-blue-900/10 dark:to-transparent" />
        <div className="absolute -bottom-6 -left-6 size-24 rounded-full bg-gradient-to-tr from-indigo-100/40 via-purple-50/30 to-transparent blur-2xl dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-transparent" />
        <div className="absolute top-0 right-20 h-px w-48 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent dark:via-blue-800/40" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          {/* 左侧：标题 */}
          <div className="flex items-center gap-4">
            {/* 装饰性图标容器 */}
            <div className="relative">
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
                className="mb-0! !text-base !font-bold tracking-tight"
              >
                <span className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 bg-clip-text dark:from-slate-100 dark:via-slate-200 dark:to-slate-400">
                  订单现状
                </span>
              </Title>
              <p className="mt-0 text-[11px] text-slate-400 dark:text-slate-500">
                实时监控生产进度与订单状态
              </p>
            </div>
          </div>

          {/* 右侧：看板开关 / 导出 / 刷新 */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="small"
              icon={<DocumentChartBarIcon className="size-3.5" />}
              onClick={() => setShowKpis((current) => !current)}
              className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md dark:!border-slate-600/60 dark:!bg-slate-800/80 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-400"
            >
              {showKpis ? '收起看板' : '展开看板'}
            </Button>
            {canExportCurrentFilters && (
              <Button
                size="small"
                icon={<ArrowDownTrayIcon className="size-3.5" />}
                loading={isExporting}
                disabled={isDataLoading || (data?.total ?? 0) === 0}
                onClick={() => void handleExportCurrentFilters()}
                onMouseEnter={preloadOrderStatusDashboardExcel}
                onFocus={preloadOrderStatusDashboardExcel}
                className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md dark:!border-slate-600/60 dark:!bg-slate-800/80 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-400"
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
              className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-600 !shadow-sm backdrop-blur-sm transition-all duration-200 hover:!border-blue-300 hover:!bg-blue-50/80 hover:!text-blue-600 hover:!shadow-md dark:!border-slate-600/60 dark:!bg-slate-800/80 dark:!text-slate-300 dark:hover:!border-blue-500 dark:hover:!bg-blue-900/30 dark:hover:!text-blue-400"
            >
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* KPI 看板（Bento Grid，图表配色随主题 token；可收起以让位表格） */}
      {showKpis && (
        <OrderStatusKpiGrid kpis={data?.kpis} loading={isDataLoading} />
      )}

      {/* Tabs 标签页 */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200/60 bg-white/60 p-1 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/60">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleStatusTabChange(tab.key)}
            className={`flex-1 rounded-lg px-4 py-1 text-sm font-medium transition-all duration-200 ${
              activeStatus === tab.key
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 搜索区 */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:shadow-slate-200/50 dark:border-slate-700/50 dark:bg-slate-800/80 dark:hover:shadow-none">
        {/* 搜索表单（不换行：窄屏横向滚动，恒为一行高度） */}
        <div className="p-2.5">
          <div className="flex items-center gap-x-6 overflow-x-auto [&>*]:shrink-0">
            {/* 交货日期 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400 dark:text-slate-500"
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
                className="!w-36 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
              />
            </div>

            {/* 项目号 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400 dark:text-slate-500"
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
                className="!w-44 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
              />
            </div>

            {/* 客户 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400 dark:text-slate-500"
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
                className="!w-32 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
              />
            </div>

            {/* 型号 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400 dark:text-slate-500"
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
                className="!w-32 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
              />
            </div>

            {/* 料号 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400 dark:text-slate-500"
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
                className="!w-36 !rounded-lg !border-slate-200/80 !bg-slate-50/50 transition-all duration-200 hover:!border-slate-300 hover:!bg-white focus:!border-blue-400 focus:!bg-white dark:!border-slate-600/70 dark:!bg-slate-900/60 dark:hover:!border-slate-500 dark:hover:!bg-slate-800/80 dark:focus:!border-blue-500 dark:focus:!bg-slate-800/80"
              />
            </div>

            {/* 状态 */}
            <div className="group flex items-center gap-2.5">
              <Text
                type="secondary"
                className="!text-xs font-medium text-slate-400 dark:text-slate-500"
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
                className="!w-32 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-slate-200/80 [&_.ant-select-selector]:!bg-slate-50/50 dark:[&_.ant-select-selector]:!border-slate-600/70 dark:[&_.ant-select-selector]:!bg-slate-900/60"
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
                className="!rounded-lg !border-slate-200/80 !bg-white/80 !text-slate-500 !shadow-sm !transition-all !duration-200 hover:!border-slate-300 hover:!bg-slate-50 hover:!text-slate-600 dark:!border-slate-600/70 dark:!bg-slate-800/80 dark:!text-slate-400 dark:hover:!border-slate-500 dark:hover:!bg-slate-700 dark:hover:!text-slate-200"
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
        className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-800/80"
      >
        {/* 表头装饰 */}
        <div className="flex items-center justify-between border-b border-slate-100/60 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 px-4 py-1.5 dark:border-slate-700/60 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-md bg-blue-100/80 dark:bg-blue-900/40">
              <svg
                className="size-3 text-blue-500 dark:text-blue-400"
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
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              数据列表
            </span>
          </div>

          {/* 可结案订单提示 */}
          {canManageStatus && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80 dark:bg-emerald-900/30 dark:ring-emerald-900/50">
                <svg
                  className="size-3.5 text-emerald-500 dark:text-emerald-400"
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
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
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

          <span className="text-xs text-slate-400 dark:text-slate-500">
            岗位{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {jobColumns.length}
            </span>{' '}
            · 共{' '}
            <span className="font-medium text-slate-600 dark:text-slate-300">
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
              ? 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/30 dark:hover:bg-red-950/40'
              : record.productionStatus === '预警'
                ? 'bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-950/30 dark:hover:bg-amber-950/40'
                : 'hover:bg-blue-50/30 dark:hover:bg-blue-950/40'
          }
          onRow={() => ({
            style: { height: rowHeight },
            className: 'transition-colors duration-150',
          })}
          className="[&_.ant-table]:!font-mono [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-slate-500 dark:[&_.ant-table-thead>tr>th]:!text-slate-400"
        />
      </div>

      {/* 分页区域 */}
      <div
        ref={paginationRef}
        className="flex shrink-0 items-center justify-between rounded-xl border border-slate-200/60 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80"
      >
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {data?.total ?? 0}
          </span>
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
