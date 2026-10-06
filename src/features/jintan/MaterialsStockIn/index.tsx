import { useCallback, useEffect, useState } from 'react'
import { App, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  JintanMaterialsStockIn,
  JintanMaterialsStockInFormValues,
} from '@/services/apiJintanMaterialsStockIn'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY } from '../permissions'
import JintanMaterialsStockInForm from './JintanMaterialsStockInForm'
import JintanMaterialsStockInSearch from './JintanMaterialsStockInSearch'
import JintanMaterialsStockInTable from './JintanMaterialsStockInTable'
import {
  useCreateJintanMaterialsStockIn,
  useDeleteJintanMaterialsStockIn,
  useJintanMaterialsStockInList,
  useUpdateJintanMaterialsStockInRemarks,
} from './useJintanMaterialsStockIn'

export default function JintanMaterialsStockInPage() {
  const { message } = App.useApp()
  const canManage = usePermission(JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [urlParams, setUrlParams] = useSearchParams()
  const page = Number(urlParams.get('page')) || 1
  const pageSize = Number(urlParams.get('pageSize')) || 10
  const keyword = urlParams.get('keyword') || undefined

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<JintanMaterialsStockIn | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef] =
    useState<FormInstance<JintanMaterialsStockInFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useJintanMaterialsStockInList({
    page,
    pageSize,
    keyword,
  })
  const createMutation = useCreateJintanMaterialsStockIn()
  const updateMutation = useUpdateJintanMaterialsStockInRemarks()
  const deleteMutation = useDeleteJintanMaterialsStockIn()
  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({ targetRowCount: 10 })

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
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    setEditingRecord(record)
    setFormError(null)
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: JintanMaterialsStockInFormValues) => {
      if (!canManage || viewerDenied) {
        message.warning(
          viewerDenied ? viewerOperationTip : '无素材入库操作权限',
        )
        return
      }
      try {
        if (editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            remarks: values.remarks ?? '',
          })
          message.success('入库备注已更新')
        } else {
          await createMutation.mutateAsync(values)
          message.success('素材入库成功，库存已更新')
        }
        closeModal()
      } catch (submitError) {
        setFormError(submitError)
      }
    },
    [
      canManage,
      closeModal,
      createMutation,
      editingRecord,
      message,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleDelete = useCallback(async () => {
    if (!canManage || viewerDenied) {
      message.warning(viewerDenied ? viewerOperationTip : '无素材入库操作权限')
      return
    }
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条入库记录进行删除')
      return
    }
    try {
      await deleteMutation.mutateAsync(selectedRowKeys[0] as string)
      message.success('入库记录已删除，库存已回退')
      setSelectedRowKeys([])
    } catch (deleteError) {
      message.error(
        deleteError instanceof Error
          ? deleteError.message
          : '删除素材入库记录失败',
      )
    }
  }, [
    canManage,
    deleteMutation,
    message,
    selectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleSearch = useCallback(
    (nextKeyword?: string) => {
      const next = new URLSearchParams(urlParams)
      next.set('page', '1')
      if (nextKeyword) next.set('keyword', nextKeyword)
      else next.delete('keyword')
      setSelectedRowKeys([])
      setUrlParams(next)
    },
    [setUrlParams, urlParams],
  )

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      const next = new URLSearchParams(urlParams)
      next.set('page', String(Math.max(page - 1, 1)))
      setUrlParams(next)
    }
  }, [data, page, setUrlParams, urlParams])

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton
          handleCreate={handleCreate}
          permissionKey={JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY}
          disabled={viewerDenied}
        />
        <EditButton
          title="编辑素材入库备注"
          handleEdit={handleEdit}
          permissionKey={JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY}
          disabled={viewerDenied}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          title="删除素材入库记录"
          itemName="素材入库记录"
          permissionKey={JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            筛选条件
          </span>
        </div>
        <JintanMaterialsStockInSearch
          keyword={keyword}
          onSearch={handleSearch}
          onReset={() => handleSearch()}
        />
      </div>

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
            <JintanMaterialsStockInTable
              data={data?.items || []}
              loading={isLoading}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
              emptyAction={
                <AddButton
                  handleCreate={handleCreate}
                  permissionKey={JINTAN_MATERIALS_STOCK_IN_PERMISSION_KEY}
                  disabled={viewerDenied}
                />
              }
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={editingRecord ? '编辑素材入库备注' : '新增素材入库'}
        open={isModalOpen}
        destroyOnHidden
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied || !canManage }}
        onOk={() => formRef?.submit()}
        onCancel={closeModal}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <JintanMaterialsStockInForm
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
