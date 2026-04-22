import { useCallback, useEffect, useState } from 'react'
import { App, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import type { YoumaiRawMaterialStockOutFormValues } from '@/services/apiYoumaiRawMaterialStockOut'
import type { YoumaiRawMaterialStockOut } from '@/services/apiYoumaiRawMaterialStockOut'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import YoumaiRawMaterialStockOutForm from './YoumaiRawMaterialStockOutForm'
import YoumaiRawMaterialStockOutSearch from './YoumaiRawMaterialStockOutSearch'
import YoumaiRawMaterialStockOutTable from './YoumaiRawMaterialStockOutTable'
import {
  useCreateYoumaiRawMaterialStockOut,
  useDeleteYoumaiRawMaterialStockOut,
  useUpdateYoumaiRawMaterialStockOut,
  useYoumaiRawMaterialInventoryOptionsForStockOut,
  useYoumaiRawMaterialStockOutList,
} from './useYoumaiRawMaterialStockOut'

export default function YoumaiRawMaterialStockOutPage() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建原料出库')
  const [editingRecord, setEditingRecord] =
    useState<YoumaiRawMaterialStockOut | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef] =
    useState<FormInstance<YoumaiRawMaterialStockOutFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading } = useYoumaiRawMaterialStockOutList({
    page,
    pageSize,
    searchParams,
  })

  const { data: inventoryOptions = [] } =
    useYoumaiRawMaterialInventoryOptionsForStockOut()

  const createMutation = useCreateYoumaiRawMaterialStockOut()
  const updateMutation = useUpdateYoumaiRawMaterialStockOut()
  const deleteMutation = useDeleteYoumaiRawMaterialStockOut()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({ targetRowCount: 10 })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setModalTitle('新建原料出库')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.rawMaterialStockOut.find(
      (item) => item.id === selectedRowKeys[0],
    )
    if (!record) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑原料出库')
    setIsModalOpen(true)
  }, [data?.rawMaterialStockOut, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    try {
      for (const id of selectedRowKeys as string[]) {
        await deleteMutation.mutateAsync(id)
      }
      message.success('原料出库记录删除成功（库存已自动恢复）')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: YoumaiRawMaterialStockOutFormValues) => {
      try {
        if (isEdit && editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            remarks: values.remarks,
          })
          message.success('原料出库备注已更新')
        } else {
          await createMutation.mutateAsync(values)
          message.success('原料出库成功，库存已更新')
        }
        resetFormState()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
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
      resetFormState,
      updateMutation,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      const next = new URLSearchParams(searchParamsURL)
      next.set('page', '1')
      if (params.keyword) {
        next.set('keyword', params.keyword)
      } else {
        next.delete('keyword')
      }
      setSearchParamsURL(next)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])
    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    next.delete('keyword')
    setSearchParamsURL(next)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.rawMaterialStockOut.length === 0) {
      const next = new URLSearchParams(searchParamsURL)
      next.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(next)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑原料出库" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除原料出库记录"
          itemName="原料出库记录"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <YoumaiRawMaterialStockOutSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          initialValues={searchParams}
        />
      </div>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <YoumaiRawMaterialStockOutTable
            loading={isLoading}
            data={data?.rawMaterialStockOut || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
            rowHeight={rowHeight}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        destroyOnHidden
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <YoumaiRawMaterialStockOutForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          inventoryOptions={inventoryOptions}
          isEdit={isEdit}
          editingRecord={editingRecord}
        />
      </Modal>
    </div>
  )
}
