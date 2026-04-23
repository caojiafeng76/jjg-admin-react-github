import { useCallback, useRef, useState } from 'react'
import { App, FormInstance, Modal, Select } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermissionContext } from '@/contexts/PermissionContext'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  VillaLiftCuttingBatchFormValues,
  VillaLiftCuttingRecordFormValues,
  VillaLiftCuttingRecordWithOrder,
} from '@/services/apiVillaLiftCutting'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import {
  useCreateCuttingBatch,
  useCuttingRecords,
  useDeleteCuttingRecord,
  useUpdateCuttingRecord,
  useVillaLiftOrdersForSelect,
} from './useCuttingProcess'
import CuttingProcessForm from './CuttingProcessForm'
import CuttingProcessTable from './CuttingProcessTable'
import CuttingRecordEditModal from './CuttingRecordEditModal'

export default function CuttingProcessPage() {
  const { message } = App.useApp()
  const { can } = usePermissionContext()
  const canEdit = can('page:villa-lift-cutting-process')
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
  const deleteMutation = useDeleteCuttingRecord()

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
      message.success('切割记录创建成功')
      setCreateModalOpen(false)
      formRef.current.resetFields()
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [createMutation, message])

  const handleEdit = useCallback((record: VillaLiftCuttingRecordWithOrder) => {
    setEditingRecord(record)
    setEditModalOpen(true)
  }, [])

  const handleEditOk = useCallback(
    async (values: VillaLiftCuttingRecordFormValues) => {
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
          <CuttingProcessTable
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
        title="新建切割记录"
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
        <CuttingProcessForm
          orders={ordersData}
          onFinish={async (values) => {
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
