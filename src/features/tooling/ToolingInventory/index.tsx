import type { FormInstance } from 'antd'
import type {
  ToolingInventory,
  ToolingInventoryFormValues,
  ToolingInventoryImportRow,
} from '@/services/apiToolingInventory'
import { App, Modal } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { useSearchParams } from 'react-router-dom'
import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import FilterBar from '@/ui/FilterBar'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'
import ToolingInventoryExcelImport from './ToolingInventoryExcelImport'
import ToolingInventoryForm from './ToolingInventoryForm'
import ToolingInventorySearch from './ToolingInventorySearch'
import ToolingInventoryTable from './ToolingInventoryTable'
import {
  useCreateToolingInventory,
  useDeleteToolingInventory,
  useImportToolingInventory,
  useToolingDataOptions,
  useToolingInventoryList,
  useUpdateToolingInventory,
} from './useToolingInventory'

export default function ToolingInventoryPage() {
  const { message } = App.useApp()
  const canManageTooling = usePermission(TOOLING_MANAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: TOOLING_MANAGE_PERMISSION_KEY,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建刀具库存')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<ToolingInventory | null>(
    null,
  )
  const [formRef, setFormRef]
    = useState<FormInstance<ToolingInventoryFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)
  const [toolingOptionsKeyword, setToolingOptionsKeyword] = useState('')

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading, error, refetch } = useToolingInventoryList({
    page,
    pageSize,
    searchParams,
  })
  const { data: toolingOptions = [], isFetching: isToolingOptionsLoading }
    = useToolingDataOptions(toolingOptionsKeyword)

  const createMutation = useCreateToolingInventory()
  const updateMutation = useUpdateToolingInventory()
  const importMutation = useImportToolingInventory()
  const deleteMutation = useDeleteToolingInventory()

  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({
      targetRowCount: 10,
    })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setFormError(null)
    setSelectedRowKeys([])
    setToolingOptionsKeyword('')
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setFormError(null)
    setSelectedRowKeys([])
    setToolingOptionsKeyword('')
    setModalTitle('新建刀具库存')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }

    const record = data?.items.find(item => item.id === selectedRowKeys[0])
    if (!record) {
      message.warning('请选择一条数据进行编辑')
      return
    }

    setEditingRecord(record)
    setToolingOptionsKeyword('')
    setFormError(null)
    setIsEdit(true)
    setModalTitle('编辑刀具库存')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('刀具库存删除成功')
      setSelectedRowKeys([])
    }
    catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      else {
        message.error('删除刀具库存失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleImport = useCallback(
    async (rows: ToolingInventoryImportRow[]) => {
      if (!canManageTooling) {
        message.warning('无刀具模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await importMutation.mutateAsync(rows)
        message.success(`刀具库存导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      }
      catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        }
        else {
          message.error('导入刀具库存失败，请稍后重试')
        }
        throw error
      }
    },
    [
      canManageTooling,
      importMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleFinish = useCallback(
    async (values: ToolingInventoryFormValues) => {
      if (!canManageTooling) {
        message.warning('无刀具模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        setFormError(null)
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('刀具库存更新成功')
        }
        else {
          await createMutation.mutateAsync(values)
          message.success('刀具库存创建成功')
        }

        resetFormState()
      }
      catch (error) {
        setFormError(error)
      }
    },
    [
      createMutation,
      canManageTooling,
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
      }
      else {
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
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton
          handleCreate={handleCreate}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
        <EditButton
          title="编辑刀具库存"
          handleEdit={handleEdit}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
        <ToolingInventoryExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除刀具库存"
          itemName="刀具库存"
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
      </div>

      <FilterBar>
        <ToolingInventorySearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          initialValues={searchParams}
        />
      </FilterBar>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <TableState
            loading={isLoading && !data}
            error={error}
            onRetry={refetch}
          >
            <ToolingInventoryTable
              loading={isLoading}
              data={data?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
            />
          </TableState>
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
        okButtonProps={{ disabled: viewerDenied || !canManageTooling }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <ToolingInventoryForm
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            toolingOptions={toolingOptions}
            isToolingOptionsLoading={isToolingOptionsLoading}
            onToolingSearch={setToolingOptionsKeyword}
            initialValues={isEdit && editingRecord ? editingRecord : undefined}
          />
        </div>
      </Modal>
    </div>
  )
}
