import type { FormInstance } from 'antd'
import type {
  SyneyMaterialsStockDirection,
  SyneyMaterialsStockFormValues,
  SyneyMaterialsStockRecord,
} from '@/services/apiSyneyMaterialsStock'
import { App, Modal } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { SYNEY_MATERIALS_STOCK_PERMISSION_KEYS } from '../permissions'
import SyneyMaterialsSearch from '../SyneyMaterialsSearch'
import { useSyneyMaterialsListParams } from '../useSyneyMaterialsListParams'
import SyneyMaterialsStockForm from './SyneyMaterialsStockForm'
import SyneyMaterialsStockTable from './SyneyMaterialsStockTable'
import {
  useCreateSyneyMaterialsStock,
  useDeleteSyneyMaterialsStock,
  useSyneyMaterialsStockList,
  useUpdateSyneyMaterialsStockRemarks,
} from './useSyneyMaterialsStock'

export interface SyneyMaterialsStockPageProps {
  direction: SyneyMaterialsStockDirection
}

/** 材料入库 / 出库页：新增、只改备注、删除（数据库回退库存） */
export default function SyneyMaterialsStockPage({
  direction,
}: SyneyMaterialsStockPageProps) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  const entity = `材料${label}记录`
  const permissionKey = SYNEY_MATERIALS_STOCK_PERMISSION_KEYS[direction]

  const { message } = App.useApp()
  const canManage = usePermission(permissionKey)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const { page, pageSize, filters, setFilters, stepBackIfEmpty }
    = useSyneyMaterialsListParams()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord]
    = useState<SyneyMaterialsStockRecord | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef]
    = useState<FormInstance<SyneyMaterialsStockFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useSyneyMaterialsStockList(
    direction,
    { page, pageSize, filters },
  )
  const createMutation = useCreateSyneyMaterialsStock(direction)
  const updateMutation = useUpdateSyneyMaterialsStockRemarks(direction)
  const deleteMutation = useDeleteSyneyMaterialsStock(direction)
  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({ targetRowCount: 10 })

  useEffect(() => {
    stepBackIfEmpty(data?.items.length)
  }, [data, stepBackIfEmpty])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback(() => {
    const record = selectedRowKeys.length === 1
      ? data?.items.find(item => item.id === selectedRowKeys[0])
      : undefined
    if (!record) {
      message.warning(feedbackText.selectRequired('编辑'))
      return
    }
    setEditingRecord(record)
    setFormError(null)
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const guard = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return false
    }
    if (!canManage) {
      message.warning(`无材料${label}操作权限`)
      return false
    }
    return true
  }, [canManage, label, message, viewerDenied, viewerOperationTip])

  const handleFinish = useCallback(
    async (values: SyneyMaterialsStockFormValues) => {
      if (!guard())
        return
      try {
        if (editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            remarks: values.remarks ?? '',
          })
          message.success(feedbackText.updated(`${label}备注`))
        }
        else {
          await createMutation.mutateAsync(values)
          message.success(`${feedbackText.created(`材料${label}`)}，库存已更新`)
        }
        closeModal()
      }
      catch (submitError) {
        setFormError(submitError)
      }
    },
    [closeModal, createMutation, editingRecord, guard, label, message, updateMutation],
  )

  const handleDelete = useCallback(async () => {
    if (!guard())
      return
    if (selectedRowKeys.length !== 1) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }
    try {
      await deleteMutation.mutateAsync(selectedRowKeys[0] as string)
      message.success(`${feedbackText.deleted(entity)}，库存已回退`)
      setSelectedRowKeys([])
    }
    catch (deleteError) {
      message.error(
        getUserErrorMessage(deleteError, feedbackText.failed('删除', entity)),
      )
    }
  }, [deleteMutation, entity, guard, message, selectedRowKeys])

  const handleSearch = useCallback(
    (next?: Parameters<typeof setFilters>[0]) => {
      setSelectedRowKeys([])
      setFilters(next)
    },
    [setFilters],
  )

  const addButton = (
    <AddButton
      handleCreate={handleCreate}
      permissionKey={permissionKey}
      disabled={viewerDenied}
    />
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        {addButton}
        <EditButton
          title={`编辑材料${label}备注`}
          handleEdit={handleEdit}
          permissionKey={permissionKey}
          disabled={viewerDenied}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          title={`删除材料${label}记录`}
          itemName={entity}
          permissionKey={permissionKey}
        />
      </div>

      <SyneyMaterialsSearch
        values={filters}
        onSearch={handleSearch}
        onReset={() => handleSearch(undefined)}
      />

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <TableState
            loading={isLoading && !data}
            error={error}
            onRetry={refetch}
          >
            <SyneyMaterialsStockTable
              direction={direction}
              data={data?.items || []}
              loading={isLoading}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
              emptyAction={addButton}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={editingRecord ? `编辑材料${label}备注` : `新增材料${label}`}
        open={isModalOpen}
        destroyOnHidden
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied || !canManage }}
        onOk={() => formRef?.submit()}
        onCancel={closeModal}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <SyneyMaterialsStockForm
            direction={direction}
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            editingRecord={editingRecord}
          />
        </div>
      </Modal>
    </div>
  )
}
