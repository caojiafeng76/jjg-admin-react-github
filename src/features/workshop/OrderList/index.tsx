import type { FormInstance, TableProps } from 'antd'
import type { WorkshopOrderStatus } from './orderStatus'
import type { WorkshopOrder } from './types'
import { App, Modal, Splitter } from 'antd'
import dayjs from 'dayjs'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import AppPagination from '@/ui/AppPagination'
import { normalizeSearchKeywords } from '@/utils/searchKeywords'
import { useExportWorkshopOrdersAsExcel } from './useExportWorkshopOrdersAsExcel'
import { usePrintWorkshopOrders } from './usePrintWorkshopOrders'
import { useWorkshopOrderDelete } from './useWorkshopOrderDelete'
import {
  useCreateWorkshopOrder,
  useCreateWorkshopOrdersBatch,
  useUpdateWorkshopOrder,
  useWorkshopOrderLengths,
  useWorkshopOrderModels,
  useWorkshopOrderProjectNos,
  useWorkshopOrdersList,
} from './useWorkshopOrders'
import { useWorkshopOrderStatusActions } from './useWorkshopOrderStatusActions'
import WorkshopOrderForm from './WorkshopOrderForm'
import WorkshopOrderProductionStats from './WorkshopOrderProductionStats'
import WorkshopOrderSearchPanel from './WorkshopOrderSearchPanel'
import WorkshopOrderStatusTabs from './WorkshopOrderStatusTabs'
import WorkshopOrderTable from './WorkshopOrderTable'
import WorkshopOrderToolbar from './WorkshopOrderToolbar'

export type {
  WorkshopOrder,
  WorkshopOrderProcessSchedule,
  WorkshopOrderProcessScheduleStatus,
} from './types'

type WorkshopOrderTabKey = 'production' | 'closed'

const TAB_TO_STATUS: Record<WorkshopOrderTabKey, WorkshopOrderStatus> = {
  production: '生产中',
  closed: '已结案',
}

export default function WorkshopOrderList() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: [
      'feature:workshop-order.create',
      'feature:workshop-order.edit',
      'feature:workshop-order.delete',
      'feature:workshop-order.manage-status',
    ],
  })
  const canCreate = usePermission('feature:workshop-order.create')
  const canEdit = usePermission('feature:workshop-order.edit')
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
  const activeTab: WorkshopOrderTabKey
    = searchParamsURL.get('status') === 'closed' ? 'closed' : 'production'
  const fixedStatus: WorkshopOrderStatus = TAB_TO_STATUS[activeTab]
  const formRef = useRef<FormInstance<WorkshopOrder> | null>(null)
  const setFormRef = useCallback((form: FormInstance<WorkshopOrder>) => {
    formRef.current = form
  }, [])
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

  const batchCreateMutation = useCreateWorkshopOrdersBatch()

  const { generatePDF, isPrinting, preloadWorkshopOrderPdf }
    = usePrintWorkshopOrders()
  const { exportAsExcel, isExporting, preloadExportAsExcel }
    = useExportWorkshopOrdersAsExcel()

  // 动态计算表格高度（目标行数适应上半面板）
  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({
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
    const selectedOrders
      = data?.items.filter(item => selectedRowKeys.includes(item.id || ''))
        || []
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

    const selectedOrders
      = data?.items.filter(item => selectedRowKeys.includes(item.id || ''))
        || []
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
    formRef.current?.resetFields()
  }, [message, viewerDenied, viewerOperationTip])

  const [editingRecord, setEditingRecord] = useState<WorkshopOrder | null>(null)

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef.current?.resetFields()
  }, [])

  const handleEdit = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find(item => item.id === selectedRowKeys[0])
    if (!record)
      return

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

  const { handleDelete, isDeleting } = useWorkshopOrderDelete({
    selectedRowKeys,
    setSelectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  })

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
        }
        else {
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
      }
      else if (Array.isArray(values)) {
        // 新建模式：Excel 批量导入
        batchCreateMutation.mutate(values, {
          onSuccess: () => handleSuccess('订单批量导入成功'),
          onError: handleError,
        })
      }
      else {
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
      createMutation.isSuccess
      || updateMutation.isSuccess
      || batchCreateMutation.isSuccess
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
        }
        else {
          delete next.project_no_search
        }

        if (selectedModels.length) {
          next.model_search = selectedModels
        }
        else {
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

    const latestOrder = data.items.find(item => item.id === activeOrder.id)
    if (!latestOrder) {
      setActiveOrder(null)
      return
    }

    if (latestOrder !== activeOrder) {
      setActiveOrder(latestOrder)
    }
  }, [activeOrder, data?.items])

  const { handleStatusChange, handleBatchStatusChange, isBatchUpdating }
    = useWorkshopOrderStatusActions({
      activeOrder,
      setActiveOrder,
      selectedRowKeys,
      setSelectedRowKeys,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    })

  function handleTabChange(key: string) {
    const next = new URLSearchParams(searchParamsURL)
    if (key === 'closed') {
      next.set('status', 'closed')
    }
    else {
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
      <WorkshopOrderStatusTabs
        activeTab={activeTab}
        productionTotal={data?.total}
        onChange={handleTabChange}
      />

      {/* 工具栏 - 工业风格卡片 */}
      <WorkshopOrderToolbar
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canManageStatus={canManageStatus}
        viewerDenied={viewerDenied}
        selectedCount={selectedRowKeys.length}
        isBatchUpdating={isBatchUpdating}
        isDeleting={isDeleting}
        isPrinting={isPrinting}
        isExporting={isExporting}
        handleCreate={handleCreate}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleBatchStatusChange={handleBatchStatusChange}
        handlePrint={handlePrint}
        handleExportExcel={handleExportExcel}
        preloadWorkshopOrderPdf={preloadWorkshopOrderPdf}
        preloadExportAsExcel={preloadExportAsExcel}
      />

      {/* 搜索栏 - 工业风格面板 */}
      <WorkshopOrderSearchPanel
        onSearch={handleSearch}
        onReset={handleResetSearch}
        lengthOptions={lengthOptions}
      />

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
        width={960}
        confirmLoading={
          createMutation.isPending
          || updateMutation.isPending
          || batchCreateMutation.isPending
        }
        destroyOnHidden
        onOk={() => formRef.current?.submit()}
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
