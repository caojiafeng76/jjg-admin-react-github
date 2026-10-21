import type { FormInstance } from 'antd'
import type {
  VillaLiftOrder,
  VillaLiftOrderFormValues,
  VillaLiftOrderStatus,
} from '@/services/apiVillaLiftOrders'
import { App, Modal, Tabs } from 'antd'
import { useCallback, useState } from 'react'

import { useSearchParams } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import AppPagination from '@/ui/AppPagination'
import { useExportVillaLiftOrdersAsExcel } from './useExportVillaLiftOrdersAsExcel'
import { useVillaLiftOrderBatchActions } from './useVillaLiftOrderBatchActions'
import {
  useCreateVillaLiftOrder,
  useUpdateVillaLiftOrder,
  useVillaLiftOrders,
} from './useVillaLiftOrders'
import { useVillaLiftOrderSearch } from './useVillaLiftOrderSearch'
import VillaLiftOrderForm from './VillaLiftOrderForm'
import VillaLiftOrderItemsModal from './VillaLiftOrderItemsModal'
import VillaLiftOrderTable from './VillaLiftOrderTable'
import VillaLiftOrderToolbar from './VillaLiftOrderToolbar'

// ----------------------------------------------------------------
// 主页面
// ----------------------------------------------------------------
export default function VillaLiftOrderListPage() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const perms = usePermissions([
    'feature:villa-lift-order.edit',
    'feature:villa-lift-order.edit-items',
    'feature:villa-lift-order.delete',
    'feature:villa-lift-order.close',
    'feature:villa-lift-order.reopen',
    'feature:villa-lift-order.mark-material',
    'feature:villa-lift-order.mark-painting',
    'feature:villa-lift-order.mark-film',
    'feature:villa-lift-order.mark-cutting',
    'feature:villa-lift-order.mark-processing',
    'feature:villa-lift-order.mark-cabin-processing',
    'feature:villa-lift-order.mark-middle-door-processing',
    'feature:villa-lift-order.mark-frame-processing',
  ])
  const canEdit = perms['feature:villa-lift-order.edit']
  const canEditItems = perms['feature:villa-lift-order.edit-items']
  const canDelete = perms['feature:villa-lift-order.delete']
  const canClose = perms['feature:villa-lift-order.close']
  const canReopen = perms['feature:villa-lift-order.reopen']
  const canMarkMaterial = perms['feature:villa-lift-order.mark-material']
  const canMarkPainting = perms['feature:villa-lift-order.mark-painting']
  const canMarkFilm = perms['feature:villa-lift-order.mark-film']
  const canMarkCutting = perms['feature:villa-lift-order.mark-cutting']
  const canMarkProcessing = perms['feature:villa-lift-order.mark-processing']
  const canMarkCabinProcessing
    = perms['feature:villa-lift-order.mark-cabin-processing']
  const canMarkMiddleDoorProcessing
    = perms['feature:villa-lift-order.mark-middle-door-processing']
  const canMarkFrameProcessing
    = perms['feature:villa-lift-order.mark-frame-processing']

  // URL 参数
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const activeStatus = (searchParamsURL.get('status')
    ?? 'open') as VillaLiftOrderStatus

  // 订单弹窗
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VillaLiftOrder | null>(
    null,
  )
  const [formRef, setFormRef]
    = useState<FormInstance<VillaLiftOrderFormValues> | null>(null)

  // 明细弹窗
  const [itemsModalOpen, setItemsModalOpen] = useState(false)
  const [itemsOrderId, setItemsOrderId] = useState<string | null>(null)

  // 批量操作选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const search = useVillaLiftOrderSearch({
    searchParamsURL,
    setSearchParamsURL,
    setSelectedRowKeys,
  })
  const {
    submittedCustomer,
    submittedProjectName,
    submittedProductName,
    deliveryDateFrom,
    deliveryDateTo,
    scheduleDateFrom,
    scheduleDateTo,
    processingRequiredDateFrom,
    processingRequiredDateTo,
    handleTabChange,
  } = search

  // 数据
  const { data, isLoading } = useVillaLiftOrders({
    page,
    pageSize,
    status: activeStatus,
    customer: submittedCustomer,
    projectName: submittedProjectName,
    productName: submittedProductName,
    deliveryDateFrom,
    deliveryDateTo,
    scheduleDateFrom,
    scheduleDateTo,
    processingRequiredDateFrom,
    processingRequiredDateTo,
  })
  const createMutation = useCreateVillaLiftOrder()
  const updateMutation = useUpdateVillaLiftOrder()
  const {
    handleBatchDelete,
    handleBatchClose,
    handleBatchReopen,
    handleBatchMarkDate,
    isBatchDeleting,
    isBatchUpdatingStatus,
    isBatchMarking,
  } = useVillaLiftOrderBatchActions({
    selectedRowKeys,
    setSelectedRowKeys,
    viewerDenied,
    viewerOperationTip,
    canMarkFilm,
  })

  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({
      headerHeight: 32,
      targetRowCount: Math.min(pageSize, 14),
      minRowHeight: 30,
    })

  // 重置弹窗状态
  const resetModalState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    formRef?.resetFields()
  }, [formRef])

  // 新建订单
  const handleCreate = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setIsEdit(false)
    setEditingRecord(null)
    setModalTitle('新建别墅梯订单')
    setIsModalOpen(true)
  }, [message, viewerDenied, viewerOperationTip])

  // 行内编辑订单
  const handleEdit = useCallback(
    (record: VillaLiftOrder) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setEditingRecord(record)
      setIsEdit(true)
      setModalTitle('编辑别墅梯订单')
      setIsModalOpen(true)
    },
    [message, viewerDenied, viewerOperationTip],
  )

  // 弹出明细编辑弹窗
  const handleEditItems = useCallback(
    (orderId: string) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setItemsOrderId(orderId)
      setItemsModalOpen(true)
    },
    [message, viewerDenied, viewerOperationTip],
  )

  // 提交订单表单
  const handleFinish = useCallback(
    async (values: VillaLiftOrderFormValues) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        if (isEdit && editingRecord) {
          const { items: _items, ...orderFields } = values
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: orderFields,
          })
          message.success('订单更新成功')
        }
        else {
          await createMutation.mutateAsync(values)
          message.success('订单创建成功')
        }
        resetModalState()
      }
      catch (err) {
        if (err instanceof Error) {
          message.error(err.message)
        }
        else {
          message.error('操作失败，请稍后重试')
        }
      }
    },
    [
      createMutation,
      editingRecord,
      isEdit,
      message,
      resetModalState,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  // 搜索
  const { exportAsExcel, isExporting, preloadExportAsExcel }
    = useExportVillaLiftOrdersAsExcel()

  async function handleExportExcel() {
    const success = await exportAsExcel(data?.orders ?? [])
    if (success) {
      message.success(`已导出 ${data?.orders?.length ?? 0} 条订单`)
    }
    else {
      message.warning('当前列表无数据可导出')
    }
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2">
      {/* 状态 Tab */}
      <div className="flex flex-col gap-2">
        <Tabs
          activeKey={activeStatus}
          onChange={handleTabChange}
          items={[
            { key: 'open', label: '未结案' },
            { key: 'closed', label: '已结案' },
          ]}
          className="mb-0!"
        />
        {/* 工具栏 */}
        <VillaLiftOrderToolbar
          permissions={{
            canDelete,
            canClose,
            canReopen,
            canMarkMaterial,
            canMarkPainting,
            canMarkFilm,
            canMarkCutting,
            canMarkProcessing,
            canMarkCabinProcessing,
            canMarkMiddleDoorProcessing,
            canMarkFrameProcessing,
          }}
          activeStatus={activeStatus}
          viewerDenied={viewerDenied}
          selectedCount={selectedRowKeys.length}
          isBatchDeleting={isBatchDeleting}
          isBatchUpdatingStatus={isBatchUpdatingStatus}
          isBatchMarking={isBatchMarking}
          isExporting={isExporting}
          search={search}
          handleCreate={handleCreate}
          handleBatchDelete={handleBatchDelete}
          handleBatchClose={handleBatchClose}
          handleBatchReopen={handleBatchReopen}
          handleBatchMarkDate={handleBatchMarkDate}
          handleExportExcel={handleExportExcel}
          preloadExportAsExcel={preloadExportAsExcel}
        />
      </div>

      {/* 表格区域 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <VillaLiftOrderTable
            loading={isLoading}
            data={data?.orders ?? []}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
            rowHeight={rowHeight}
            canEdit={!viewerDenied && canEdit}
            canEditItems={!viewerDenied && canEditItems}
            onEdit={handleEdit}
            onEditItems={handleEditItems}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.count ?? 0} />
        </div>
      </div>

      {/* 订单新建/编辑弹窗 */}
      <Modal
        title={modalTitle}
        open={isModalOpen}
        onOk={() => formRef?.submit()}
        onCancel={resetModalState}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied }}
        width={760}
        destroyOnHidden
      >
        <VillaLiftOrderForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          initialValues={editingRecord}
          orderOnly={isEdit}
        />
      </Modal>

      {/* 明细编辑弹窗 */}
      <VillaLiftOrderItemsModal
        open={itemsModalOpen}
        orderId={itemsOrderId}
        onClose={() => {
          setItemsModalOpen(false)
          setItemsOrderId(null)
        }}
      />
    </div>
  )
}
