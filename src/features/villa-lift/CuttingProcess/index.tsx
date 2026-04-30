import { useCallback, useRef, useState } from 'react'
import { App, Button, FormInstance, Modal, Popconfirm, Select } from 'antd'
import { TrashIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'

import { usePermissions } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  VillaLiftCuttingBatchFormValues,
  VillaLiftCuttingRecordFormValues,
  VillaLiftCuttingRecordWithOrder,
} from '@/services/apiVillaLiftCutting'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import {
  useBatchDeleteCuttingRecords,
  useCreateCuttingBatch,
  useCuttingRecords,
  useUpdateCuttingRecord,
  useVillaLiftOrdersForSelect,
} from './useCuttingProcess'
import CuttingProcessForm from './CuttingProcessForm'
import CuttingProcessTable from './CuttingProcessTable'
import CuttingRecordEditModal from './CuttingRecordEditModal'

export default function CuttingProcessPage() {
  const { message } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const perms = usePermissions([
    'feature:villa-lift-cutting.create',
    'feature:villa-lift-cutting.edit',
    'feature:villa-lift-cutting.delete',
  ])
  const canCreate = perms['feature:villa-lift-cutting.create']
  const canEdit = perms['feature:villa-lift-cutting.edit']
  const canDelete = perms['feature:villa-lift-cutting.delete']
  const [searchParams, setSearchParams] = useSearchParams()

  // 分页
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const filterOrderId = searchParams.get('orderId') ?? undefined

  // 弹窗状态
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<VillaLiftCuttingRecordWithOrder | null>(null)

  const formRef = useRef<FormInstance<VillaLiftCuttingBatchFormValues> | null>(
    null,
  )

  // 数据
  const { data: ordersData = [] } = useVillaLiftOrdersForSelect()
  const { data, isLoading } = useCuttingRecords({
    page,
    pageSize,
    orderId: filterOrderId,
  })
  const createMutation = useCreateCuttingBatch()
  const updateMutation = useUpdateCuttingRecord()
  const batchDeleteMutation = useBatchDeleteCuttingRecords()

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  // ---- handlers ----

  const handleCreate = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setCreateModalOpen(true)
  }, [message, viewerDenied, viewerOperationTip])

  const handleCreateOk = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (!formRef.current) return
    try {
      const values = await formRef.current.validateFields()
      await createMutation.mutateAsync(values)
      message.success('切割记录创建成功')
      setCreateModalOpen(false)
      formRef.current.resetFields()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [createMutation, message, viewerDenied, viewerOperationTip])

  const handleEdit = useCallback(
    (record: VillaLiftCuttingRecordWithOrder) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      setEditingRecord(record)
      setEditModalOpen(true)
    },
    [message, viewerDenied, viewerOperationTip],
  )

  const handleEditOk = useCallback(
    async (values: VillaLiftCuttingRecordFormValues) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (!editingRecord) return
      try {
        await updateMutation.mutateAsync({ id: editingRecord.id, values })
        message.success('更新成功')
        setEditModalOpen(false)
        setEditingRecord(null)
      } catch (err) {
        if (err instanceof Error) message.error(err.message)
      }
    },
    [editingRecord, message, updateMutation, viewerDenied, viewerOperationTip],
  )

  const handleBatchDelete = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchDeleteMutation.mutateAsync(selectedRowKeys)
      message.success(`已删除 ${selectedRowKeys.length} 条记录`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchDeleteMutation,
    message,
    selectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  function handleOrderFilter(value: string | undefined) {
    const next = new URLSearchParams(searchParams)
    next.set('page', '1')
    if (value) {
      next.set('orderId', value)
    } else {
      next.delete('orderId')
    }
    setSearchParams(next)
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        {canCreate && <AddButton handleCreate={handleCreate} />}
        {canDelete && selectedRowKeys.length > 0 && (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true, disabled: viewerDenied }}
            onConfirm={handleBatchDelete}
          >
            <Button
              type="text"
              danger
              icon={<TrashIcon className="size-4" />}
              loading={batchDeleteMutation.isPending}
              disabled={viewerDenied}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        )}
        <Select
          allowClear
          showSearch
          placeholder="按项目筛选"
          style={{ width: 240 }}
          value={filterOrderId}
          onChange={handleOrderFilter}
          optionFilterProp="search"
          options={ordersData.map((o) => ({
            value: o.id,
            label: `${o.project_name} · ${o.customer}`,
            search: `${o.project_name} ${o.customer}`,
          }))}
        />
      </div>

      {/* 表格区域 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <CuttingProcessTable
            loading={isLoading}
            data={data?.records ?? []}
            canEdit={!viewerDenied && canEdit}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={setSelectedRowKeys}
            onEdit={handleEdit}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef}>
          <AppPagination total={data?.count ?? 0} />
        </div>
      </div>

      {/* 新建弹窗 */}
      <Modal
        title="新建切割记录"
        open={createModalOpen}
        onOk={handleCreateOk}
        onCancel={() => {
          setCreateModalOpen(false)
          formRef.current?.resetFields()
        }}
        confirmLoading={createMutation.isPending}
        okButtonProps={{ disabled: viewerDenied }}
        width={800}
        destroyOnClose
      >
        <CuttingProcessForm
          orders={ordersData}
          onFinish={async (values) => {
            if (viewerDenied) {
              message.warning(viewerOperationTip)
              return
            }

            await createMutation.mutateAsync(values)
            message.success('切割记录创建成功')
            setCreateModalOpen(false)
          }}
          setFormRef={(f) => {
            formRef.current = f
          }}
        />
      </Modal>

      {/* 编辑弹窗 */}
      <CuttingRecordEditModal
        open={editModalOpen}
        initialValues={
          editingRecord
            ? {
                model: editingRecord.model,
                name: editingRecord.name,
                spec: editingRecord.spec,
                operator: editingRecord.operator,
                cut_quantity: editingRecord.cut_quantity,
                raw_scrap_quantity: editingRecord.raw_scrap_quantity,
                process_scrap_quantity: editingRecord.process_scrap_quantity,
                remarks: editingRecord.remarks,
              }
            : null
        }
        isSubmitting={updateMutation.isPending}
        onOk={handleEditOk}
        onCancel={() => {
          setEditModalOpen(false)
          setEditingRecord(null)
        }}
      />
    </div>
  )
}
