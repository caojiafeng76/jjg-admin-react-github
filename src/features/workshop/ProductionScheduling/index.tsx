import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode, TdHTMLAttributes } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TableProps } from 'antd'
import { App, ConfigProvider, Form, Pagination, Table } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'

import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { queryConfig } from '@/config/queryClient'
import { getErrorDisplayInfo } from '@/utils/errorHandler'
import type {
  ProductionSchedulingFilters,
  ProductionSchedulingOrder,
} from '@/services/apiProductionScheduling'
import { getAllEmployees } from '@/services/apiEmployees'
import {
  useProductionSchedulingLengthOptions,
  useProductionSchedulingOrders,
  useUpdateProductionSchedulingOrder,
} from './useProductionScheduling'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import ProductionSchedulingEditModal from './ProductionSchedulingEditModal'
import ProductionSchedulingHeader from './ProductionSchedulingHeader'
import ProductionSchedulingSearchBar from './ProductionSchedulingSearchBar'
import ProductionSchedulingSummaryBar from './ProductionSchedulingSummaryBar'
import { makeOrderColumns } from './productionSchedulingColumns'
import {
  DEFAULT_FILTERS,
  DEFAULT_PAGE_SIZE,
  formatSchedulingPayload,
  getOrderRowKey,
  getSummary,
  makeSchedulingInitialValues,
  type SchedulingFormValues,
  type SearchFormValues,
} from './productionSchedulingUtils'

const loadProductionSchedulingPlanExcel = () =>
  import('@/utils/productionSchedulingPlanExcel')

const preloadProductionSchedulingPlanExcel = () => {
  void loadProductionSchedulingPlanExcel()
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
    ...queryConfig.detail,
  })
  const { data: lengthOptions = [] } = useProductionSchedulingLengthOptions()
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
    isPending,
    isPlaceholderData,
    refetch,
  } = useProductionSchedulingOrders({ filters, page, pageSize })
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const updateMutation = useUpdateProductionSchedulingOrder()
  const orders = useMemo(
    () => schedulingResult?.orders ?? [],
    [schedulingResult?.orders],
  )
  const total = schedulingResult?.total ?? 0
  // 首屏/查询/筛选/翻页/手动刷新时立即遮罩反馈，满足操作反馈 <300ms；
  // 30 秒定时轮询（库存等动态更新）静默进行，不打断用户操作
  const tableLoading = isPending || isPlaceholderData || isManualRefreshing
  const handleRefresh = useCallback(() => {
    setIsManualRefreshing(true)
    void refetch().finally(() => setIsManualRefreshing(false))
  }, [refetch])
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

  // E3 排产表紧凑行高：固定区较高，压缩 cell 上下内边距到 2px，
  // 使行高约 31px，1366×768 下一屏完整显示 10 行（经 components 注入，
  // 避免在 index.css 全局覆盖 antd 私有 DOM 类而触发 appShellConfig 约定）
  const components = useMemo(
    () => ({
      body: {
        cell: (
          props: TdHTMLAttributes<HTMLTableCellElement> & {
            children?: ReactNode
          },
        ) => {
          const { children, ...restProps } = props
          return (
            <td
              {...restProps}
              style={{
                ...restProps.style,
                paddingTop: 2,
                paddingBottom: 2,
              }}
            >
              {children}
            </td>
          )
        },
      },
    }),
    [],
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
      lengthMm: values.lengthMm?.length ? values.lengthMm : undefined,
      materialCode: values.materialCode?.trim() || undefined,
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

  const handleProgressStatusChange = useCallback(
    (progressStatus: string | null) => {
      const nextProgress = progressStatus ?? undefined
      setPage(1)
      setFilters((prev) => ({
        ...prev,
        progressStatus: nextProgress,
      }))
      searchForm.setFieldsValue({
        progressStatus: progressStatus ?? undefined,
      })
    },
    [searchForm],
  )

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

  const handleCancelEdit = useCallback(() => {
    setModalOpen(false)
    setEditingOrder(null)
  }, [])

  const handleExport = useCallback(async () => {
    if (selectedOrders.length === 0) {
      message.warning(
        selectedRowKeys.length > 0
          ? '当前页已选条目已全部移出视图，请重新勾选'
          : '当前没有可导出的订单排产数据',
      )
      return
    }

    const { exportProductionScheduledPlanToExcel } =
      await loadProductionSchedulingPlanExcel()
    exportProductionScheduledPlanToExcel(selectedOrders)
  }, [message, selectedOrders, selectedRowKeys])

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 p-1 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* 标题区 + 进度快捷标签 */}
      <ProductionSchedulingHeader
        progressStatus={filters.progressStatus}
        onProgressStatusChange={handleProgressStatusChange}
      />

      {/* 搜索区 */}
      <ProductionSchedulingSearchBar
        form={searchForm}
        lengthOptions={lengthOptions}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* 操作条（含汇总统计） */}
      <ProductionSchedulingSummaryBar
        summary={summary}
        hasSelection={selectedRowKeys.length > 0}
        selectedCount={selectedOrders.length}
        isFetching={tableLoading}
        onExport={handleExport}
        onPreload={preloadProductionSchedulingPlanExcel}
        onRefresh={handleRefresh}
      />

      {/* 表格区 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
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
            components={components}
            rowClassName={(_record, index) =>
              index % 2 === 0 ? 'bg-slate-50/40 dark:bg-slate-700/30' : ''
            }
            classNames={{ root: 'font-medium' }}
          />
        </div>
        <div
          ref={paginationRef}
          className="flex shrink-0 justify-end border-t border-slate-100 px-3 py-2 dark:border-slate-700"
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

      <ProductionSchedulingEditModal
        open={modalOpen}
        form={schedulingForm}
        editingOrder={editingOrder}
        confirmLoading={updateMutation.isPending}
        employees={employees}
        machineSelectOptions={machineSelectOptions}
        onCancel={handleCancelEdit}
        onOk={handleSave}
      />
    </div>
  )
}
