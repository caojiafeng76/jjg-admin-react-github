import type { TableProps } from 'antd'
import type { CSSProperties } from 'react'
import type {
  SelectedExtrusionDetail,
  SelectedJobDetail,
  SelectedPrecisionCuttingDetail,
  SelectedTransferDetail,
} from './dashboardRenderUtils'
import type { ColumnWidthMap, SearchValues } from './dashboardUtils'
import type { DashboardTableView } from './dashboardView'
import type {
  OrderStatusDashboardItem,
  OrderStatusJobColumn,
} from '@/services/apiOrderStatusDashboard'

import { useQueryClient } from '@tanstack/react-query'
import { App, Table, Tabs } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isAdminRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import {
  useBatchUpdateWorkshopOrderStatuses,
  useWorkshopOrderModels,
} from '@/features/workshop/OrderList/useWorkshopOrders'
import { usePermission } from '@/hooks/usePermission'
import AppPagination from '@/ui/AppPagination'
import { TableEmpty, TableState } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import { createOrderStatusDashboardColumns } from './dashboardColumns'
import {
  DENSE_TABLE_COMPONENTS,
} from './dashboardRenderUtils'
import { renderOrderStatusSummary } from './dashboardSummary'
import {
  canCloseDashboardOrder,

  DEFAULT_PAGE_SIZE,
  EMPTY_SEARCH_VALUES,
  getTableColumnWidth,
  normalizeProductionStatusFilter,
  normalizeStatusTab,

  STATUS_TABS,
} from './dashboardUtils'
import { applyDashboardTableView, EMPTY_TABLE_VIEW, getVisibleDashboardRows } from './dashboardView'
import { ExtrusionDetailModal } from './ExtrusionDetailModal'
import { OrderStatusDashboardHeader } from './OrderStatusDashboardHeader'
import { OrderStatusDashboardSearchBar } from './OrderStatusDashboardSearchBar'
import { PrecisionCuttingDetailModal } from './PrecisionCuttingDetailModal'
import { ProductionDetailModal } from './ProductionDetailModal'
import { TransferDetailModal } from './TransferDetailModal'
import {
  ORDER_STATUS_DASHBOARD_KEY,
  useOrderStatusDashboard,
} from './useOrderStatusDashboard'
import { useOrderStatusDashboardExport } from './useOrderStatusDashboardExport'

const EMPTY_JOB_COLUMNS: OrderStatusJobColumn[] = []
const TABLE_SECTION_STYLE = {
  // 表头、汇总和横向滚动条占用实际高度，剩余空间留给表体。
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gridTemplateRows: 'auto minmax(0, max-content) auto auto',
  alignContent: 'start',
  height: '100cqh',
} satisfies CSSProperties

export default function OrderStatusDashboard() {
  const { message, modal } = App.useApp()
  const { role } = useAuth()
  const queryClient = useQueryClient()
  const canManageStatus = usePermission('feature:workshop-order.manage-status')
  const canExportCurrentPage = isAdminRole(role)
  const { mutateAsync: updateOrderStatuses, isPending: isUpdatingOrderStatus }
    = useBatchUpdateWorkshopOrderStatuses()
  const [selectedJobDetail, setSelectedJobDetail]
    = useState<SelectedJobDetail | null>(null)
  const [selectedTransferDetail, setSelectedTransferDetail]
    = useState<SelectedTransferDetail | null>(null)
  const [selectedPrecisionCuttingDetail, setSelectedPrecisionCuttingDetail]
    = useState<SelectedPrecisionCuttingDetail | null>(null)
  const [selectedExtrusionDetail, setSelectedExtrusionDetail]
    = useState<SelectedExtrusionDetail | null>(null)
  const [columnWidths, setColumnWidths] = useState<ColumnWidthMap>({})
  const [tableView, setTableView] = useState<DashboardTableView>(EMPTY_TABLE_VIEW)
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
  const [searchValues, setSearchValues]
    = useState<SearchValues>(searchParamValues)
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
  const { data, isLoading, isPlaceholderData, error, refetch }
    = useOrderStatusDashboard({
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
          `确定将订单 ${orderLabel} 标记为已结案吗？`
          + '结案后新增生产工单时将无法再关联该订单。',
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
          }
          catch (error) {
            message.error(
              error instanceof Error
                ? error.message
                : '订单结案失败，请稍后重试',
            )
          }
          finally {
            setClosingOrderId(null)
          }
        },
      })
    },
    [message, modal, queryClient, updateOrderStatuses],
  )

  const columns = useMemo(
    () =>
      applyDashboardTableView(createOrderStatusDashboardColumns({
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
      }), tableView),
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
      tableView,
    ],
  )

  const tableWidth = getTableColumnWidth(columns)
  const visibleRows = useMemo(() => getVisibleDashboardRows(rows, columns), [rows, columns])
  const {
    handleExportCurrentPage,
    isExporting,
    preloadOrderStatusDashboardExcel,
  } = useOrderStatusDashboardExport({
    rows: visibleRows,
    jobColumns,
    startIndex: (page - 1) * pageSize,
  })

  useEffect(() => {
    setSearchValues(searchParamValues)
  }, [searchParamValues])

  function updateSearchParamValue<TKey extends keyof SearchValues>(
    key: TKey,
    value: SearchValues[TKey],
  ) {
    setSearchValues(current => ({ ...current, [key]: value }))
  }

  function setOrDeleteParam(
    params: URLSearchParams,
    key: keyof SearchValues,
    value: string,
  ) {
    const normalizedValue = value.trim()

    if (normalizedValue) {
      params.set(key, normalizedValue)
    }
    else {
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
    setTableView(EMPTY_TABLE_VIEW)
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
    sorter,
    extra,
  ) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter
    setTableView({
      filters: tableFilters,
      sortColumnKey: activeSorter.columnKey === undefined ? null : String(activeSorter.columnKey),
      sortOrder: activeSorter.order ?? null,
    })
    if (extra.action !== 'filter') {
      return
    }

    const selectedModels = (tableFilters.product_model ?? [])
      .map(String)
      .filter(Boolean)
    const next = new URLSearchParams(searchParams)
    const modelValue = selectedModels.join(',')

    if (modelValue === modelFilterValues.join(',')) {
      return
    }

    setOrDeleteParam(next, 'model', modelValue)
    next.set('page', '1')
    setSearchValues(current => ({ ...current, model: modelValue }))
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
    }
    else {
      next.set('status', normalizedStatus)
    }

    next.set('page', '1')
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedPrecisionCuttingDetail(null)
    setSelectedTransferDetail(null)
    setSelectedExtrusionDetail(null)
  }

  const tabContent = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <OrderStatusDashboardSearchBar
        isSearching={isUserFetching && !isLoading}
        onReset={handleResetSearch}
        onSearch={handleSearch}
        onUpdateValue={updateSearchParamValue}
        searchValues={searchValues}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-text-secondary tabular-nums">
        <span>岗位 {jobColumns.length}</span>
        {canManageStatus && (
          <span>
            本页 {visibleRows.filter(record => canCloseDashboardOrder({ canManageStatus, record })).length} 个订单可结案
          </span>
        )}
      </div>

      <div className="[container-type:size] min-h-0 flex-1 overflow-auto">
        <TableState loading={isLoading && !data} error={error} onRetry={handleRefetch}>
          <Table<OrderStatusDashboardItem>
            rowKey="id"
            bordered
            size="small"
            components={DENSE_TABLE_COMPONENTS}
            loading={{ spinning: isDataLoading, description: '数据加载中...' }}
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{
              x: tableWidth,
              y: '100%',
              scrollToFirstRowOnChange: true,
            }}
            onChange={handleTableChange}
            sticky={{ offsetHeader: 0 }}
            summary={pageData =>
              renderOrderStatusSummary({ columns, jobColumns, rows: pageData })}
            locale={{ emptyText: <TableEmpty title="暂无订单现状数据" description="请调整筛选条件后查询" /> }}
            rowClassName={(record, index) =>
              record.productionStatus === '延期'
                ? 'bg-error/5 dark:bg-error/10'
                : record.productionStatus === '预警'
                  ? 'bg-warning/5 dark:bg-warning/10'
                  : zebraRowClassName(record, index)}
            classNames={{ body: { row: 'h-6' } }}
            styles={{ section: TABLE_SECTION_STYLE }}
          />
        </TableState>
      </div>

      <div className="flex shrink-0 justify-end">
        <AppPagination
          total={data?.total ?? 0}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          pageSizeOptions={['10', '20', '50', '100', '500']}
        />
      </div>
    </div>
  )

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <Tabs
        className="h-full"
        classNames={{ body: 'h-full', content: 'h-full' }}
        activeKey={activeStatus}
        items={STATUS_TABS.map(tab => ({
          ...tab,
          children: tab.key === activeStatus ? tabContent : undefined,
        }))}
        onChange={handleStatusTabChange}
        styles={{ header: { marginBottom: 12 } }}
        tabBarExtraContent={(
          <OrderStatusDashboardHeader
            canExportCurrentPage={canExportCurrentPage}
            exportDisabled={isDataLoading || visibleRows.length === 0}
            isExporting={isExporting}
            isRefreshing={isUserFetching && !isLoading}
            onExport={handleExportCurrentPage}
            onPreloadExport={preloadOrderStatusDashboardExcel}
            onRefetch={handleRefetch}
          />
        )}
      />

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
