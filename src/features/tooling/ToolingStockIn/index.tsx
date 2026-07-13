import { useCallback, useEffect, useState } from 'react'
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/16/solid'
import { App, Button, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  ToolingStockIn,
  ToolingStockInFormValues,
} from '@/services/apiToolingStockIn'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'
import ToolingStockInForm from './ToolingStockInForm'
import ToolingStockInSearch from './ToolingStockInSearch'
import ToolingStockInTable from './ToolingStockInTable'
import {
  useBatchUpdateToolingStockInStatus,
  useCreateToolingStockIn,
  useDeleteToolingStockIn,
  useToolingDataOptions,
  useToolingStockInList,
  useUpdateToolingStockIn,
} from './useToolingStockIn'

export default function ToolingStockInPage() {
  const { message, modal } = App.useApp()
  const canManageTooling = usePermission(TOOLING_MANAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: TOOLING_MANAGE_PERMISSION_KEY,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建刀具入库')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<ToolingStockIn | null>(
    null,
  )
  const [formRef, setFormRef] =
    useState<FormInstance<ToolingStockInFormValues> | null>(null)
  const [toolingOptionsKeyword, setToolingOptionsKeyword] = useState('')

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{
    keyword?: string
    status?: '待审核' | '已审核'
  }>({
    keyword: searchParamsURL.get('keyword') || undefined,
    status:
      (searchParamsURL.get('status') as '待审核' | '已审核' | null) ||
      undefined,
  })

  const { data, isLoading } = useToolingStockInList({
    page,
    pageSize,
    searchParams,
  })
  const { data: toolingOptions = [], isFetching: isToolingOptionsLoading } =
    useToolingDataOptions(toolingOptionsKeyword)

  const createMutation = useCreateToolingStockIn()
  const updateMutation = useUpdateToolingStockIn()
  const batchStatusMutation = useBatchUpdateToolingStockInStatus()
  const deleteMutation = useDeleteToolingStockIn()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const selectedRecords = (data?.items || []).filter((item) =>
    selectedRowKeys.includes(item.id),
  )
  const hasAuditedSelection = selectedRecords.some(
    (item) => item.status === '已审核',
  )

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setToolingOptionsKeyword('')
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setToolingOptionsKeyword('')
    setModalTitle('新建刀具入库')
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
    setToolingOptionsKeyword('')
    setIsEdit(true)
    setModalTitle(
      record.status === '已审核' ? '编辑刀具入库备注' : '编辑刀具入库',
    )
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    if (hasAuditedSelection) {
      message.warning('已审核的刀具入库不允许删除')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('刀具入库删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除刀具入库失败，请稍后重试')
      }
    }
  }, [deleteMutation, hasAuditedSelection, message, selectedRowKeys])

  const handleBatchAudit = useCallback(
    (status: '待审核' | '已审核') => {
      if (!canManageTooling) {
        message.warning('无刀具模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning(
          `请选择要${status === '已审核' ? '审核' : '反审'}的刀具入库`,
        )
        return
      }

      modal.confirm({
        title: `批量${status === '已审核' ? '审核' : '反审'}刀具入库`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条刀具入库标记为${status}吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            await batchStatusMutation.mutateAsync({
              ids: selectedRowKeys as string[],
              status,
            })
            message.success(`批量${status === '已审核' ? '审核' : '反审'}成功`)
            setSelectedRowKeys([])
          } catch (error) {
            message.error(
              error instanceof Error
                ? error.message
                : `批量${status === '已审核' ? '审核' : '反审'}失败`,
            )
          }
        },
      })
    },
    [
      batchStatusMutation,
      canManageTooling,
      message,
      modal,
      selectedRowKeys,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleFinish = useCallback(
    async (values: ToolingStockInFormValues) => {
      if (!canManageTooling) {
        message.warning('无刀具模块操作权限')
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
          message.success('刀具入库更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('刀具入库创建成功')
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
      } else {
        nextSearchParamsURL.delete('keyword')
      }

      if (params.status) {
        nextSearchParamsURL.set('status', params.status)
      } else {
        nextSearchParamsURL.delete('status')
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
    nextSearchParamsURL.delete('status')
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
        <Button
          type="text"
          icon={<ShieldCheckIcon className="size-4 text-green-500/80!" />}
          onClick={() => handleBatchAudit('已审核')}
          loading={batchStatusMutation.isPending}
          disabled={viewerDenied || !canManageTooling}
        >
          批量审核
        </Button>
        <Button
          type="text"
          icon={<ArrowPathIcon className="size-4 text-amber-500/80!" />}
          onClick={() => handleBatchAudit('待审核')}
          loading={batchStatusMutation.isPending}
          disabled={viewerDenied || !canManageTooling}
        >
          批量反审核
        </Button>
        <EditButton
          title="编辑刀具入库"
          handleEdit={handleEdit}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除刀具入库"
          itemName="刀具入库"
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <ToolingStockInSearch
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
          <ToolingStockInTable
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
        confirmLoading={
          createMutation.isPending ||
          updateMutation.isPending ||
          batchStatusMutation.isPending
        }
        okButtonProps={{ disabled: viewerDenied || !canManageTooling }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <ToolingStockInForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          toolingOptions={toolingOptions}
          isToolingOptionsLoading={isToolingOptionsLoading}
          onToolingSearch={setToolingOptionsKeyword}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
          isAuditLocked={editingRecord?.status === '已审核'}
        />
      </Modal>
    </div>
  )
}
