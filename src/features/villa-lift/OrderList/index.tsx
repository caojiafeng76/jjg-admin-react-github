import { useCallback, useRef, useState } from 'react'
import { App, Button, FormInstance, Input, Modal, Popconfirm } from 'antd'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowUturnLeftIcon,
  CheckCircleIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'

import { usePermissionContext } from '@/contexts/PermissionContext'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  VillaLiftOrder,
  VillaLiftOrderFormValues,
  VillaLiftOrderItemFormValues,
} from '@/services/apiVillaLiftOrders'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import {
  useBatchDeleteVillaLiftOrders,
  useBatchUpdateVillaLiftOrdersStatus,
  useCreateVillaLiftOrder,
  useUpdateVillaLiftOrder,
  useUpsertVillaLiftOrderItems,
  useVillaLiftOrderItems,
  useVillaLiftOrders,
} from './useVillaLiftOrders'
import VillaLiftOrderForm from './VillaLiftOrderForm'
import VillaLiftOrderTable from './VillaLiftOrderTable'

// ----------------------------------------------------------------
// 明细编辑子弹窗
// ----------------------------------------------------------------
interface ItemsModalProps {
  open: boolean
  orderId: string | null
  onClose: () => void
}

function ItemsModal({ open, orderId, onClose }: ItemsModalProps) {
  const { message } = App.useApp()
  const { data: items = [], isLoading } = useVillaLiftOrderItems(
    open ? orderId : null,
  )
  const upsertMutation = useUpsertVillaLiftOrderItems()
  const formRef = useRef<FormInstance<{
    items: VillaLiftOrderItemFormValues[]
  }> | null>(null)

  async function handleOk() {
    if (!orderId || !formRef.current) return
    try {
      const values = await formRef.current.validateFields()
      await upsertMutation.mutateAsync({
        orderId,
        items: values.items ?? [],
      })
      message.success('明细保存成功')
      onClose()
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message)
      }
    }
  }

  return (
    <Modal
      title="编辑订单明细"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={upsertMutation.isPending}
      width={800}
      destroyOnClose
    >
      <VillaLiftOrderForm
        onFinish={() => {}}
        setFormRef={(f) => {
          formRef.current = f as unknown as FormInstance<{
            items: VillaLiftOrderItemFormValues[]
          }>
        }}
        isSubmitting={upsertMutation.isPending}
        initialValues={
          orderId
            ? ({
                id: orderId,
                schedule_date: null,
                delivery_date: null,
                customer: '',
                project_name: '',
                product_name: '',
                color: '',
                quantity: 0,
                remarks: '',
                created_at: '',
                updated_at: '',
                items: isLoading ? [] : items,
              } as VillaLiftOrder)
            : null
        }
        itemsOnly
      />
    </Modal>
  )
}

// ----------------------------------------------------------------
// 主页面
// ----------------------------------------------------------------
export default function VillaLiftOrderListPage() {
  const { message } = App.useApp()
  const { can } = usePermissionContext()
  const canEdit = can('page:villa-lift-order-list')

  // URL 参数
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const keyword = searchParamsURL.get('keyword') || undefined

  const [localKeyword, setLocalKeyword] = useState(keyword ?? '')

  // 订单弹窗
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VillaLiftOrder | null>(
    null,
  )
  const [formRef, setFormRef] =
    useState<FormInstance<VillaLiftOrderFormValues> | null>(null)

  // 明细弹窗
  const [itemsModalOpen, setItemsModalOpen] = useState(false)
  const [itemsOrderId, setItemsOrderId] = useState<string | null>(null)

  // 批量操作选中行
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  // 数据
  const { data, isLoading } = useVillaLiftOrders({ page, pageSize, keyword })
  const createMutation = useCreateVillaLiftOrder()
  const updateMutation = useUpdateVillaLiftOrder()
  const batchDeleteMutation = useBatchDeleteVillaLiftOrders()
  const batchStatusMutation = useBatchUpdateVillaLiftOrdersStatus()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
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
    setIsEdit(false)
    setEditingRecord(null)
    setModalTitle('新建别墅梯订单')
    setIsModalOpen(true)
  }, [])

  // 行内编辑订单
  const handleEdit = useCallback((record: VillaLiftOrder) => {
    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑别墅梯订单')
    setIsModalOpen(true)
  }, [])

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    try {
      await batchDeleteMutation.mutateAsync(selectedRowKeys)
      message.success(`已删除 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [batchDeleteMutation, selectedRowKeys, message])

  // 批量结案
  const handleBatchClose = useCallback(async () => {
    try {
      await batchStatusMutation.mutateAsync({
        ids: selectedRowKeys,
        status: 'closed',
      })
      message.success(`已结案 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [batchStatusMutation, selectedRowKeys, message])

  // 批量反结案
  const handleBatchReopen = useCallback(async () => {
    try {
      await batchStatusMutation.mutateAsync({
        ids: selectedRowKeys,
        status: 'open',
      })
      message.success(`已复开 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [batchStatusMutation, selectedRowKeys, message])

  // 弹出明细编辑弹窗
  const handleEditItems = useCallback((orderId: string) => {
    setItemsOrderId(orderId)
    setItemsModalOpen(true)
  }, [])

  // 提交订单表单
  const handleFinish = useCallback(
    async (values: VillaLiftOrderFormValues) => {
      try {
        if (isEdit && editingRecord) {
          const { items: _items, ...orderFields } = values
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: orderFields,
          })
          message.success('订单更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('订单创建成功')
        }
        resetModalState()
      } catch (err) {
        if (err instanceof Error) {
          message.error(err.message)
        } else {
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
    ],
  )

  // 搜索
  function handleSearch() {
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    if (localKeyword.trim()) {
      next.set('keyword', localKeyword.trim())
    } else {
      next.delete('keyword')
    }
    setSearchParamsURL(next)
  }

  function handleSearchReset() {
    setLocalKeyword('')
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    next.delete('keyword')
    setSearchParamsURL(next)
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && <AddButton handleCreate={handleCreate} />}
        {canEdit && selectedRowKeys.length > 0 && (
          <>
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 条订单？`}
              description="删除后不可恢复，同时删除所有明细。"
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
              onConfirm={handleBatchDelete}
            >
              <Button
                type="text"
                danger
                icon={<TrashIcon className="size-4" />}
                loading={batchDeleteMutation.isPending}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Button
              type="text"
              icon={<CheckCircleIcon className="size-4 text-green-500/80!" />}
              loading={batchStatusMutation.isPending}
              onClick={handleBatchClose}
            >
              批量结案 ({selectedRowKeys.length})
            </Button>
            <Button
              type="text"
              icon={<ArrowUturnLeftIcon className="size-4 text-blue-400/80!" />}
              loading={batchStatusMutation.isPending}
              onClick={handleBatchReopen}
            >
              批量反结案 ({selectedRowKeys.length})
            </Button>
          </>
        )}
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜索客户/项目/产品名称"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
            onClear={handleSearchReset}
            style={{ width: 240 }}
          />
        </div>
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
            canEdit={canEdit}
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
        width={760}
        destroyOnClose
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
      <ItemsModal
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
