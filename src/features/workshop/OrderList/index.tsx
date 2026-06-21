import { useState, useCallback, useEffect, useMemo } from 'react'
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/16/solid'
import { DownloadOutlined } from '@ant-design/icons'
import type { FormInstance, TableProps } from 'antd'
import { App, Button, Modal, Splitter, Tabs, Badge } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import PrintButton from '@/ui/PrintButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { getWorkshopOrderDeleteBlockers } from '@/services/apiWorkshopOrders'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import {
  useWorkshopOrdersList,
  useWorkshopOrderLengths,
  useWorkshopOrderProjectNos,
  useWorkshopOrderModels,
  useCreateWorkshopOrder,
  useUpdateWorkshopOrder,
  useBatchUpdateWorkshopOrderStatuses,
  useCreateWorkshopOrdersBatch,
  useDeleteWorkshopOrders,
} from './useWorkshopOrders'
import WorkshopOrderTable from './WorkshopOrderTable'
import WorkshopOrderForm from './WorkshopOrderForm'
import WorkshopOrderSearch from './WorkshopOrderSearch'
import WorkshopOrderProductionStats from './WorkshopOrderProductionStats'
import { usePrintWorkshopOrders } from './usePrintWorkshopOrders'
import { useExportWorkshopOrdersAsExcel } from './useExportWorkshopOrdersAsExcel'
import type { WorkshopOrderStatus } from './orderStatus'

export interface WorkshopOrder {
  id?: string
  order_date?: string | null
  product_delivery_date: string | null
  planned_start_date?: string | null
  planned_finish_date?: string | null
  closed_at?: string | null
  delivery_review_result?: string | null
  status?: WorkshopOrderStatus | null
  total_outbound_quantity?: number | null
  project_no: string | null
  product_model: string | null
  length_mm: number | null
  length_tolerance?: string | null
  process_flow?: string | null
  process_requirement?: string | null
  tooling_status?: string | null
  capacity_per_day?: number | null
  bottleneck_processes?: string | null
  material_status?: string | null
  order_category?: string | null
  delivery_priority?: string | null
  responsible_person?: string | null
  progress_status?: string | null
  progress_percent?: number | null
  scheduling_remark?: string | null
  process_schedules?: WorkshopOrderProcessSchedule[] | null
  customer: string | null
  customer_model: string | null
  order_quantity: number | null
  weight_per_meter_kg: number | null
  color_name: string | null
  package_name: string | null
  product_category: string | null
  material_name: string | null
  material_code: string | null
  row_remark?: string | null
  sketch_file_path?: string | null
  sketch_file?: {
    fileName: string
    extension: string
    mimeType: string
    data: ArrayBuffer
  } | null
}

export type WorkshopOrderProcessScheduleStatus = '待排' | '已排' | '余排'

export interface WorkshopOrderProcessSchedule {
  id: string
  process_code: string
  process_name: string
  status: WorkshopOrderProcessScheduleStatus
  operator_id?: string | null
  operator_name?: string | null
  required_production_date: string | null
  scheduled_date: string | null
  last_scheduled_date: string | null
  scheduled_quantity: number | null
  remark?: string | null
}

type WorkshopOrderTabKey = 'production' | 'closed'

const TAB_TO_STATUS: Record<WorkshopOrderTabKey, WorkshopOrderStatus> = {
  production: '生产中',
  closed: '已结案',
}

export default function WorkshopOrderList() {
  const { message, modal } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const canDelete = usePermission('feature:workshop-order.delete')
  const canManageStatus = usePermission('feature:workshop-order.manage-status')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [activeOrder, setActiveOrder] = useState<WorkshopOrder | null>(null)
  // 使用 URL 参数管理分页，与 AppPagination 保持一致
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const activeTab: WorkshopOrderTabKey =
    searchParamsURL.get('status') === 'closed' ? 'closed' : 'production'
  const fixedStatus: WorkshopOrderStatus = TAB_TO_STATUS[activeTab]
  const [formRef, setFormRef] = useState<FormInstance<WorkshopOrder> | null>(
    null,
  )
  const [searchParams, setSearchParams] = useState<{
    project_no?: string
    product_model?: string
    customer_model?: string
    project_no_search?: string | string[] // 多关键词搜索项目号
    model_search?: string | string[] // 多关键词搜索产品型号、客户型号
    length_mm?: number[]
    startDate?: string
    endDate?: string
  }>({})

  const mergedSearchParams = useMemo(
    () => ({
      ...searchParams,
      status: fixedStatus,
    }),
    [fixedStatus, searchParams],
  )

  const { data, isLoading } = useWorkshopOrdersList({
    page,
    pageSize,
    searchParams: mergedSearchParams,
  })
  const { data: lengthOptions = [] } = useWorkshopOrderLengths()
  const { data: projectNoOptions = [] } = useWorkshopOrderProjectNos()
  const { data: modelOptions = [] } = useWorkshopOrderModels()
  const projectNoFilterValues = useMemo(
    () => normalizeSearchKeywords(searchParams.project_no_search) ?? [],
    [searchParams.project_no_search],
  )
  const modelFilterValues = useMemo(
    () => normalizeSearchKeywords(searchParams.model_search) ?? [],
    [searchParams.model_search],
  )

  const createMutation = useCreateWorkshopOrder()

  const updateMutation = useUpdateWorkshopOrder()

  const batchStatusMutation = useBatchUpdateWorkshopOrderStatuses()

  const batchCreateMutation = useCreateWorkshopOrdersBatch()

  const deleteMutation = useDeleteWorkshopOrders()

  const { generatePDF, isPrinting } = usePrintWorkshopOrders()
  const { exportAsExcel, isExporting } = useExportWorkshopOrdersAsExcel()

  // 动态计算表格高度（目标行数适应上半面板）
  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      headerHeight: 30,
      minRowHeight: 30,
      reservePaginationHeight: false,
      targetRowCount: Math.min(pageSize, 14),
    })

  const handlePrint = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择要打印的订单')
      return
    }
    const selectedOrders =
      data?.items.filter((item) => selectedRowKeys.includes(item.id || '')) ||
      []
    const printed = await generatePDF(selectedOrders)
    if (printed) {
      setSelectedRowKeys([])
    }
  }, [
    selectedRowKeys,
    data?.items,
    generatePDF,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleExportExcel = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择要导出的订单')
      return
    }

    const selectedOrders =
      data?.items.filter((item) => selectedRowKeys.includes(item.id || '')) ||
      []
    const exported = await exportAsExcel(selectedOrders)
    if (exported) {
      setSelectedRowKeys([])
    }
  }, [
    data?.items,
    exportAsExcel,
    message,
    selectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleCreate = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setIsEdit(false)
    setModalTitle('创建订单')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef, message, viewerDenied, viewerOperationTip])

  const [editingRecord, setEditingRecord] = useState<WorkshopOrder | null>(null)

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    // 将日期字符串转换为 dayjs 对象用于表单显示
    const formValues: WorkshopOrder & {
      product_delivery_date: dayjs.Dayjs | undefined
    } = {
      ...record,
      product_delivery_date: record.product_delivery_date
        ? dayjs(record.product_delivery_date)
        : undefined,
    } as WorkshopOrder & { product_delivery_date: dayjs.Dayjs | undefined }
    setEditingRecord(formValues as unknown as WorkshopOrder)
    setIsEdit(true)
    setModalTitle('编辑订单')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys, viewerDenied, viewerOperationTip])

  const handleDelete = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    const ids = selectedRowKeys as string[]

    try {
      const blockers = await getWorkshopOrderDeleteBlockers(ids)

      if (blockers.length > 0) {
        modal.warning({
          title: '无法删除订单',
          okText: '知道了',
          width: 620,
          content: (
            <div className="space-y-3">
              <p>以下订单已被生产记录引用，请先处理关联数据：</p>
              <ul className="list-disc space-y-2 pl-5">
                {blockers.map((item) => (
                  <li key={item.orderId}>
                    <div className="font-medium text-slate-800">
                      {item.projectNo?.trim() || '未填写项目号'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {item.productionItemCount > 0 &&
                        `已关联 ${item.productionItemCount} 条生产工单明细`}
                      {item.productionItemCount > 0 &&
                        item.extrusionProductionItemCount > 0 &&
                        '，'}
                      {item.extrusionProductionItemCount > 0 &&
                        `已关联 ${item.extrusionProductionItemCount} 条挤压明细`}
                      {(item.productionItemCount > 0 ||
                        item.extrusionProductionItemCount > 0) &&
                      item.orderDates.length > 0
                        ? `，工单日期：${item.orderDates.slice(0, 3).join('、')}`
                        : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ),
        })
        return
      }

      modal.confirm({
        title: '删除订单',
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        content: (
          <div>
            <p>
              确定删除选中的 <strong>{ids.length}</strong> 个订单吗？
            </p>
            <p className="mt-2 text-xs text-red-500">
              此操作不可撤销，将同时删除订单及其所有明细。
            </p>
          </div>
        ),
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync(ids)
            message.success('删除成功')
            setSelectedRowKeys([])
          } catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error('删除失败，请稍后重试')
            }

            throw error
          }
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除失败，请稍后重试')
      }
    }
  }, [
    deleteMutation,
    message,
    modal,
    selectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleFinish = useCallback(
    (values: WorkshopOrder | WorkshopOrder[]) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      const handleSuccess = (successMessage: string) => {
        message.success(successMessage)
        resetFormState()
      }
      const handleError = (error: unknown) => {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('操作失败，请稍后重试')
        }
      }

      if (isEdit && selectedRowKeys[0]) {
        // 编辑模式：单条更新
        updateMutation.mutate(
          {
            id: selectedRowKeys[0] as string,
            values: values as WorkshopOrder,
          },
          {
            onSuccess: () => handleSuccess('订单更新成功'),
            onError: handleError,
          },
        )
      } else if (Array.isArray(values)) {
        // 新建模式：Excel 批量导入
        batchCreateMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单批量导入成功'),
          onError: handleError,
        })
      } else {
        // 新建模式：手动输入单条
        createMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单创建成功'),
          onError: handleError,
        })
      }
    },
    [
      batchCreateMutation,
      createMutation,
      isEdit,
      message,
      resetFormState,
      selectedRowKeys,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  /**
   * 防止 Excel 批量导入后成功提示出现但模态框仍保持打开状态。
   * 监听所有创建/更新类 mutation 成功态，统一做收尾并重置 mutation 状态。
   */
  useEffect(() => {
    if (
      createMutation.isSuccess ||
      updateMutation.isSuccess ||
      batchCreateMutation.isSuccess
    ) {
      resetFormState()
      createMutation.reset()
      updateMutation.reset()
      batchCreateMutation.reset()
    }
  }, [
    batchCreateMutation.isSuccess,
    createMutation.isSuccess,
    updateMutation.isSuccess,
    resetFormState,
    batchCreateMutation,
    createMutation,
    updateMutation,
  ])

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  const handleTableChange: TableProps<WorkshopOrder>['onChange'] = useCallback(
    (_pagination, tableFilters, _sorter, extra) => {
      if (extra.action !== 'filter') {
        return
      }

      const selectedProjectNos = (tableFilters.project_no ?? [])
        .map(String)
        .filter(Boolean)
      const selectedModels = (tableFilters.product_model ?? [])
        .map(String)
        .filter(Boolean)

      setSearchParams((current) => {
        const next = { ...current }

        if (selectedProjectNos.length) {
          next.project_no_search = selectedProjectNos
        } else {
          delete next.project_no_search
        }

        if (selectedModels.length) {
          next.model_search = selectedModels
        } else {
          delete next.model_search
        }

        return next
      })
      setSelectedRowKeys([])

      const nextURLParams = new URLSearchParams(searchParamsURL)
      nextURLParams.set('page', '1')
      setSearchParamsURL(nextURLParams)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    setSelectedRowKeys([])
    setActiveOrder(null)
  }, [fixedStatus])

  useEffect(() => {
    if (!activeOrder?.id || !data?.items) {
      return
    }

    const latestOrder = data.items.find((item) => item.id === activeOrder.id)
    if (!latestOrder) {
      setActiveOrder(null)
      return
    }

    if (latestOrder !== activeOrder) {
      setActiveOrder(latestOrder)
    }
  }, [activeOrder, data?.items])

  const handleStatusChange = useCallback(
    async (nextStatus: WorkshopOrderStatus) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (!activeOrder?.id) {
        return
      }

      const applyUpdate = async () => {
        const closedAt =
          nextStatus === '已结案' ? new Date().toISOString() : null

        await updateMutation.mutateAsync({
          id: activeOrder.id!,
          values: {
            ...activeOrder,
            status: nextStatus,
            closed_at: closedAt,
          },
        })
        setActiveOrder((current) =>
          current
            ? { ...current, status: nextStatus, closed_at: closedAt }
            : current,
        )
        message.success(
          nextStatus === '已结案' ? '订单已结案' : '订单状态已改为生产中',
        )
      }

      if (nextStatus === '已结案') {
        modal.confirm({
          title: '确认结案',
          content: `确定将订单 ${activeOrder.project_no || ''} 标记为已结案吗？结案后新增生产工单时将无法再关联该订单。`,
          okText: '确认结案',
          cancelText: '取消',
          onOk: applyUpdate,
        })
        return
      }

      await applyUpdate()
    },
    [
      activeOrder,
      message,
      modal,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleBatchStatusChange = useCallback(
    (nextStatus: WorkshopOrderStatus) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要改为${nextStatus}的订单`)
        return
      }

      const applyUpdate = async () => {
        const closedAt =
          nextStatus === '已结案' ? new Date().toISOString() : null

        await batchStatusMutation.mutateAsync({
          ids: selectedRowKeys as string[],
          status: nextStatus,
          closed_at: closedAt,
        })

        if (activeOrder?.id && selectedRowKeys.includes(activeOrder.id)) {
          setActiveOrder((current) =>
            current
              ? { ...current, status: nextStatus, closed_at: closedAt }
              : current,
          )
        }

        message.success(
          nextStatus === '已结案' ? '批量结案成功' : '批量改为生产中成功',
        )
        setSelectedRowKeys([])
      }

      modal.confirm({
        title: nextStatus === '已结案' ? '批量结案订单' : '批量改为生产中',
        content:
          nextStatus === '已结案'
            ? `确定将选中的 ${selectedRowKeys.length} 个订单标记为已结案吗？结案后新增生产工单时将无法再关联这些订单。`
            : `确定将选中的 ${selectedRowKeys.length} 个订单标记为生产中吗？`,
        okText: '确定',
        cancelText: '取消',
        okButtonProps:
          nextStatus === '已结案'
            ? { danger: true, disabled: viewerDenied }
            : { disabled: viewerDenied },
        onOk: async () => {
          try {
            await applyUpdate()
          } catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error(
                nextStatus === '已结案'
                  ? '批量结案失败，请稍后重试'
                  : '批量改为生产中失败，请稍后重试',
              )
            }
          }
        },
      })
    },
    [
      activeOrder,
      batchStatusMutation,
      message,
      modal,
      selectedRowKeys,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  function handleTabChange(key: string) {
    const next = new URLSearchParams(searchParamsURL)
    if (key === 'closed') {
      next.set('status', 'closed')
    } else {
      next.delete('status')
    }
    next.set('page', '1')
    setSearchParamsURL(next)
    setSearchParams({})
    setSelectedRowKeys([])
    setActiveOrder(null)
  }

  return (
    <div className="flex h-full flex-col gap-4 p-1">
      {/* 状态 Tab - 工业风格面板 */}
      <div className="rounded-lg border border-slate-200/60 bg-white/80 px-4 pt-3 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          size="large"
          items={[
            {
              key: 'production',
              label: (
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  生产中
                  {data && data.total > 0 && (
                    <Badge
                      count={data.total}
                      size="small"
                      style={{
                        backgroundColor: '#f59e0b',
                        boxShadow: '0 0 6px rgba(245, 158, 11, 0.4)',
                      }}
                    />
                  )}
                </span>
              ),
            },
            {
              key: 'closed',
              label: (
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-slate-400" />
                  已结案
                </span>
              ),
            },
          ]}
          className="[&_.ant-tabs-nav]::!mb-0"
        />
      </div>

      {/* 工具栏 - 工业风格卡片 */}
      <div className="rounded-lg border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          {/* 核心操作按钮组 */}
          <div className="flex items-center gap-2">
            <AddButton handleCreate={handleCreate} />
            <EditButton title="编辑" handleEdit={handleEdit} />
          </div>

          {/* 分隔线 */}
          <div className="h-6 w-px bg-linear-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />

          {/* 状态管理按钮组 */}
          {canManageStatus ? (
            <div className="flex items-center gap-1">
              <Button
                type="text"
                icon={<ArrowPathIcon className="size-4" />}
                onClick={() => handleBatchStatusChange('生产中')}
                loading={batchStatusMutation.isPending}
                disabled={viewerDenied}
                className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                批量改为生产中
              </Button>
              <Button
                type="text"
                icon={<CheckCircleIcon className="size-4" />}
                onClick={() => handleBatchStatusChange('已结案')}
                loading={batchStatusMutation.isPending}
                disabled={viewerDenied}
                className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                批量结案
              </Button>
            </div>
          ) : null}

          {/* 分隔线 */}
          <div className="h-6 w-px bg-linear-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />

          {/* 删除按钮 */}
          {canDelete ? (
            <DeleteButton
              onClick={handleDelete}
              isDeleting={deleteMutation.isPending}
              count={selectedRowKeys.length}
            />
          ) : null}

          {/* 分隔线 */}
          <div className="h-6 w-px bg-linear-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600" />

          {/* 输出按钮组 */}
          <div className="flex items-center gap-1">
            <PrintButton
              handlePrint={handlePrint}
              loading={isPrinting}
              count={selectedRowKeys.length}
            />
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
              loading={isExporting}
              disabled={viewerDenied || selectedRowKeys.length === 0}
              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              导出Excel
              {selectedRowKeys.length > 0 && (
                <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  {selectedRowKeys.length}
                </span>
              )}
            </Button>
          </div>

          {/* 统计信息 */}
          {selectedRowKeys.length > 0 && (
            <div className="ml-auto">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                已选 {selectedRowKeys.length} 项
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 搜索栏 - 工业风格面板 */}
      <div className="rounded-lg border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-linear-to-br from-slate-100 to-slate-200 shadow-sm dark:from-slate-700 dark:to-slate-800">
              <svg
                className="size-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              筛选条件
            </span>
          </div>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1">
            <WorkshopOrderSearch
              onSearch={handleSearch}
              onReset={handleResetSearch}
              lengthOptions={lengthOptions}
            />
          </div>
        </div>
      </div>

      {/* 上下分割布局 - 工业风格面板 */}
      <Splitter
        orientation="vertical"
        style={{ flex: 1, minHeight: 0 }}
        styles={{ panel: { overflow: 'hidden' } }}
      >
        {/* 上半部分：订单列表 */}
        <Splitter.Panel defaultSize="60%" min="30%">
          <div className="flex h-full flex-col gap-3 overflow-hidden rounded-lg border border-slate-200/60 bg-white/90 p-3 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/90">
            <div
              ref={tableContainerRef}
              className="min-h-0 flex-1 overflow-hidden"
            >
              <WorkshopOrderTable
                loading={isLoading}
                data={data?.items || []}
                projectNoOptions={projectNoOptions}
                modelOptions={modelOptions}
                projectNoFilterValues={projectNoFilterValues}
                modelFilterValues={modelFilterValues}
                selectedRowKeys={selectedRowKeys}
                onSelect={setSelectedRowKeys}
                onChange={handleTableChange}
                activeRowId={activeOrder?.id ?? null}
                onRowClick={setActiveOrder}
                scrollY={scrollY}
                rowHeight={rowHeight}
                page={page}
                pageSize={pageSize}
              />
            </div>
            <div ref={paginationRef} className="flex shrink-0 justify-end">
              <AppPagination total={data?.total || 0} />
            </div>
          </div>
        </Splitter.Panel>

        {/* 下半部分：生产工单统计 */}
        <Splitter.Panel min="20%">
          <div className="h-full overflow-hidden rounded-lg border border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:border-slate-700/50 dark:bg-slate-800/90">
            <WorkshopOrderProductionStats
              selectedOrder={activeOrder}
              canManageStatus={!viewerDenied && canManageStatus}
              onStatusChange={handleStatusChange}
              statusUpdating={updateMutation.isPending}
            />
          </div>
        </Splitter.Panel>
      </Splitter>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          batchCreateMutation.isPending
        }
        destroyOnHidden
        onOk={() => formRef?.submit()}
        okButtonProps={{ disabled: viewerDenied }}
        onCancel={() => {
          resetFormState()
        }}
      >
        <WorkshopOrderForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending || batchCreateMutation.isPending}
          isEdit={isEdit}
          canEditStatus={!viewerDenied && canManageStatus}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
