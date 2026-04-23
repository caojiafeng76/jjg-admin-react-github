import { useCallback, useRef, useState } from 'react'
import { App, FormInstance, Modal, Select } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermissionContext } from '@/contexts/PermissionContext'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  VillaLiftFinishingBatchFormValues,
  VillaLiftFinishingRecordFormValues,
  VillaLiftFinishingRecordWithOrder,
} from '@/services/apiVillaLiftFinishing'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import {
  useCreateFinishingBatch,
  useDeleteFinishingRecord,
  useFinishingRecords,
  useUpdateFinishingRecord,
  useVillaLiftOrdersForSelect,
} from './useFinishingProcess'
import FinishingProcessForm from './FinishingProcessForm'
import FinishingProcessTable from './FinishingProcessTable'
import FinishingRecordEditModal from './FinishingRecordEditModal'

export default function FinishingProcessPage() {
  const { message } = App.useApp()
  const { can } = usePermissionContext()
  const canEdit = can('page:villa-lift-processing')
  const [searchParams, setSearchParams] = useSearchParams()

  // 分页
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const filterOrderId = searchParams.get('orderId') ?? undefined

  // 弹窗状态
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<VillaLiftFinishingRecordWithOrder | null>(null)

  const formRef = useRef<FormInstance<VillaLiftFinishingBatchFormValues> | null>(
    null,
  )

  // 数据
  const { data: ordersData = [] } = useVillaLiftOrdersForSelect()
  const { data, isLoading } = useFinishingRecords({
    page,
    pageSize,
    orderId: filterOrderId,
  })
  const createMutation = useCreateFinishingBatch()
  const updateMutation = useUpdateFinishingRecord()
  const deleteMutation = useDeleteFinishingRecord()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  // ---- handlers ----

  const handleCreate = useCallback(() => {
    setCreateModalOpen(true)
  }, [])

  const handleCreateOk = useCallback(async () => {
    if (!formRef.current) return
    try {
      const values = await formRef.current.validateFields()
      await createMutation.mutateAsync(values)
      message.success('加工记录创建成功')
      setCreateModalOpen(false)
      formRef.current.resetFields()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [createMutation, message])

  const handleEdit = useCallback(
    (record: VillaLiftFinishingRecordWithOrder) => {
      setEditingRecord(record)
      setEditModalOpen(true)
    },
    [],
  )

  const handleEditOk = useCallback(
    async (values: VillaLiftFinishingRecordFormValues) => {
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
    [editingRecord, message, updateMutation],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id)
        message.success('删除成功')
      } catch (err) {
        if (err instanceof Error) message.error(err.message)
      }
    },
    [deleteMutation, message],
  )

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
        {canEdit && <AddButton handleCreate={handleCreate} />}
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
          <FinishingProcessTable
            loading={isLoading}
            data={data?.records ?? []}
            canEdit={canEdit}
            isDeleting={deleteMutation.isPending}
            onEdit={handleEdit}
            onDelete={handleDelete}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef}>
          <AppPagination total={data?.count ?? 0} />
        </div>
      </div>

      {/* 新建弹窗 */}
      <Modal
        title="新建加工记录"
        open={createModalOpen}
        onOk={handleCreateOk}
        onCancel={() => {
          setCreateModalOpen(false)
          formRef.current?.resetFields()
        }}
        confirmLoading={createMutation.isPending}
        width={800}
        destroyOnClose
      >
        <FinishingProcessForm
          orders={ordersData}
          onFinish={async (values) => {
            await createMutation.mutateAsync(values)
            message.success('加工记录创建成功')
            setCreateModalOpen(false)
          }}
          setFormRef={(f) => {
            formRef.current = f
          }}
        />
      </Modal>

      {/* 编辑弹窗 */}
      <FinishingRecordEditModal
        open={editModalOpen}
        initialValues={
          editingRecord
            ? {
                model: editingRecord.model,
                name: editingRecord.name,
                spec: editingRecord.spec,
                operation: editingRecord.operation,
                operator: editingRecord.operator,
                process_quantity: editingRecord.process_quantity,
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
