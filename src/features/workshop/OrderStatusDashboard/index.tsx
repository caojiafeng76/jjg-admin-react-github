import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TableProps } from 'antd'
import { App, Table } from 'antd'
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
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'
import AppPagination from '@/ui/AppPagination'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import {
  ORDER_STATUS_DASHBOARD_KEY,
  useOrderStatusDashboard,
} from './useOrderStatusDashboard'
import {
  canCloseDashboardOrder,
  DEFAULT_PAGE_SIZE,
  EMPTY_SEARCH_VALUES,
  getTableColumnWidth,
  normalizeProductionStatusFilter,
  normalizeStatusTab,
  STATUS_TABS,
  type ColumnWidthMap,
  type SearchValues,
} from './dashboardUtils'
import {
  DENSE_TABLE_COMPONENTS,
  SelectedExtrusionDetail,
  SelectedJobDetail,
  SelectedPrecisionCuttingDetail,
  SelectedTransferDetail,
} from './dashboardRenderUtils'
import { createOrderStatusDashboardColumns } from './dashboardColumns'
import { ExtrusionDetailModal } from './ExtrusionDetailModal'
import { OrderStatusDashboardHeader } from './OrderStatusDashboardHeader'
import { OrderStatusDashboardSearchBar } from './OrderStatusDashboardSearchBar'
import { OrderStatusKpiGrid } from './OrderStatusKpiGrid'
import { PrecisionCuttingDetailModal } from './PrecisionCuttingDetailModal'
import { ProductionDetailModal } from './ProductionDetailModal'
import { TransferDetailModal } from './TransferDetailModal'
import { useOrderStatusDashboardExport } from './useOrderStatusDashboardExport'

const EMPTY_JOB_COLUMNS: OrderStatusJobColumn[] = []
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
  const { data, isLoading, isPlaceholderData, refetch } =
    useOrderStatusDashboard({
      page,
      pageSize,
      filters,
    })
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  // 查询/翻页/手动刷新时显示遮罩；30 秒定时轮询（库存等动态更新）静默进行
  const isUserFetching = isPlaceholderData || isManualRefreshing
  const isDataLoading = isLoading || isUserFetching
  const handleRefetch = useCallback(() => {
    setIsManualRefreshing(true)
    void refetch().finally(() => setIsManualRefreshing(false))
  }, [refetch])

  const rows = useMemo(() => data?.items ?? [], [data?.items])
  const jobColumns = data?.jobColumns ?? EMPTY_JOB_COLUMNS
  const {
    handleExportCurrentFilters,
    isExporting,
    preloadOrderStatusDashboardExcel,
  } = useOrderStatusDashboardExport({
    filters,
    jobColumns,
    total: data?.total,
  })
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

  const columns = useMemo(
    () =>
      createOrderStatusDashboardColumns({
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
      }),
    [
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
    ],
  )

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
      <OrderStatusDashboardHeader
        canExportCurrentFilters={canExportCurrentFilters}
        exportDisabled={isDataLoading || (data?.total ?? 0) === 0}
        isExporting={isExporting}
        isFetching={isDataLoading}
        isLoading={isLoading}
        onExport={handleExportCurrentFilters}
        onPreloadExport={preloadOrderStatusDashboardExcel}
        onRefetch={handleRefetch}
        onToggleKpis={() => setShowKpis((current) => !current)}
        showKpis={showKpis}
      />

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

      <OrderStatusDashboardSearchBar
        isSearching={isUserFetching && !isLoading}
        onReset={handleResetSearch}
        onSearch={handleSearch}
        onUpdateValue={updateSearchParamValue}
        searchValues={searchValues}
      />

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
          pageSizeOptions={['10', '20', '50', '100', '500']}
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
