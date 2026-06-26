import { useCallback, useEffect, useState } from 'react'
import { App, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  YoumaiFinishedGoodsInventory,
  YoumaiFinishedGoodsInventoryFormValues,
  YoumaiFinishedGoodsInventoryImportRow,
} from '@/services/apiYoumaiFinishedGoodsInventory'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import { YOUMAI_MANAGE_PERMISSION_KEY } from '../permissions'
import YoumaiFinishedGoodsInventoryExcelImport from './YoumaiFinishedGoodsInventoryExcelImport'
import YoumaiFinishedGoodsInventoryForm from './YoumaiFinishedGoodsInventoryForm'
import YoumaiFinishedGoodsInventorySearch from './YoumaiFinishedGoodsInventorySearch'
import YoumaiFinishedGoodsInventoryTable from './YoumaiFinishedGoodsInventoryTable'
import {
  useCreateYoumaiFinishedGoodsInventory,
  useDeleteYoumaiFinishedGoodsInventory,
  useImportYoumaiFinishedGoodsInventory,
  useUpdateYoumaiFinishedGoodsInventory,
  useYoumaiFinishedGoodsInventoryList,
  useYoumaiProductDataOptions,
} from './useYoumaiFinishedGoodsInventory'

export default function YoumaiFinishedGoodsInventoryPage() {
  const { message } = App.useApp()
  const canManageYoumai = usePermission(YOUMAI_MANAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: YOUMAI_MANAGE_PERMISSION_KEY,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建优迈成品库存')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<YoumaiFinishedGoodsInventory | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<YoumaiFinishedGoodsInventoryFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading } = useYoumaiFinishedGoodsInventoryList({
    page,
    pageSize,
    searchParams,
  })
  const { data: productOptions = [] } = useYoumaiProductDataOptions()

  const createMutation = useCreateYoumaiFinishedGoodsInventory()
  const updateMutation = useUpdateYoumaiFinishedGoodsInventory()
  const importMutation = useImportYoumaiFinishedGoodsInventory()
  const deleteMutation = useDeleteYoumaiFinishedGoodsInventory()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

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
    setModalTitle('新建优迈成品库存')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

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
    setIsEdit(true)
    setModalTitle('编辑优迈成品库存')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('优迈成品库存删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除优迈成品库存失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleImport = useCallback(
    async (rows: YoumaiFinishedGoodsInventoryImportRow[]) => {
      if (!canManageYoumai) {
        message.warning('无优迈模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await importMutation.mutateAsync(rows)
        message.success(`优迈成品库存导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入优迈成品库存失败，请稍后重试')
        }
      }
    },
    [
      canManageYoumai,
      importMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleFinish = useCallback(
    async (values: YoumaiFinishedGoodsInventoryFormValues) => {
      if (!canManageYoumai) {
        message.warning('无优迈模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('优迈成品库存更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('优迈成品库存创建成功')
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
      canManageYoumai,
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

      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('page', '1')

      if (params.keyword) {
        nextSearchParamsURL.set('keyword', params.keyword)
      } else {
        nextSearchParamsURL.delete('keyword')
      }

      setSearchParamsURL(nextSearchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])

    const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
    nextSearchParamsURL.set('page', '1')
    nextSearchParamsURL.delete('keyword')
    setSearchParamsURL(nextSearchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(nextSearchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton
          handleCreate={handleCreate}
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
        />
        <EditButton
          title="编辑优迈成品库存"
          handleEdit={handleEdit}
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除优迈成品库存"
          itemName="优迈成品库存"
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
        />
        <YoumaiFinishedGoodsInventoryExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            筛选条件
          </span>
        </div>
        <YoumaiFinishedGoodsInventorySearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          initialValues={searchParams}
        />
      </div>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <YoumaiFinishedGoodsInventoryTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
            rowHeight={rowHeight}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        destroyOnHidden
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied || !canManageYoumai }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <YoumaiFinishedGoodsInventoryForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          productOptions={productOptions}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
