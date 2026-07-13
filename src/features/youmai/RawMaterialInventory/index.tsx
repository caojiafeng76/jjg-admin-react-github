import { useCallback, useEffect, useState } from 'react'
import { App, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  YoumaiRawMaterialInventory,
  YoumaiRawMaterialInventoryFormValues,
} from '@/services/apiYoumaiRawMaterialInventory'
import { getYoumaiRawMaterialInventoryForExport } from '@/services/apiYoumaiRawMaterialInventory'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import { YOUMAI_MANAGE_PERMISSION_KEY } from '../permissions'
import YoumaiRawMaterialInventoryForm from './YoumaiRawMaterialInventoryForm'
import YoumaiRawMaterialInventorySearch from './YoumaiRawMaterialInventorySearch'
import YoumaiRawMaterialInventoryTable from './YoumaiRawMaterialInventoryTable'
import {
  useCreateYoumaiRawMaterialInventory,
  useDeleteYoumaiRawMaterialInventory,
  useUpdateYoumaiRawMaterialInventory,
  useYoumaiRawMaterialInventoryList,
} from './useYoumaiRawMaterialInventory'

const loadYoumaiRawMaterialInventoryExcel = () =>
  import('@/utils/youmaiRawMaterialInventoryExcel')

function preloadYoumaiRawMaterialInventoryExcel() {
  void loadYoumaiRawMaterialInventoryExcel()
}

export default function YoumaiRawMaterialInventoryPage() {
  const { message } = App.useApp()
  const canManageYoumai = usePermission(YOUMAI_MANAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: YOUMAI_MANAGE_PERMISSION_KEY,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建原料库存')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<YoumaiRawMaterialInventory | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<YoumaiRawMaterialInventoryFormValues> | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading } = useYoumaiRawMaterialInventoryList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateYoumaiRawMaterialInventory()
  const updateMutation = useUpdateYoumaiRawMaterialInventory()
  const deleteMutation = useDeleteYoumaiRawMaterialInventory()

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
    setModalTitle('新建原料库存')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.rawMaterialInventory.find(
      (item) => item.id === selectedRowKeys[0],
    )
    if (!record) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑原料库存')
    setIsModalOpen(true)
  }, [data?.rawMaterialInventory, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    try {
      for (const id of selectedRowKeys as string[]) {
        await deleteMutation.mutateAsync(id)
      }
      message.success('原料库存删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除原料库存失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: YoumaiRawMaterialInventoryFormValues) => {
      if (!canManageYoumai) {
        message.warning('无优迈模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        if (isEdit && editingRecord) {
          await updateMutation.mutateAsync({ id: editingRecord.id, values })
          message.success('原料库存更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('原料库存创建成功')
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
      editingRecord,
      isEdit,
      message,
      resetFormState,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
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

  const handleExport = useCallback(async () => {
    if (!canManageYoumai) {
      message.warning('无优迈模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      setIsExporting(true)
      const [records, { exportYoumaiRawMaterialInventoryToExcel }] =
        await Promise.all([
          getYoumaiRawMaterialInventoryForExport(searchParams.keyword),
          loadYoumaiRawMaterialInventoryExcel(),
        ])
      if (records.length === 0) {
        message.warning('当前没有可导出的原料库存数据')
        return
      }
      exportYoumaiRawMaterialInventoryToExcel(records)
      message.success(`已导出 ${records.length} 条原料库存数据`)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }, [
    canManageYoumai,
    message,
    searchParams.keyword,
    viewerDenied,
    viewerOperationTip,
  ])

  useEffect(() => {
    if (page > 1 && data && data.rawMaterialInventory.length === 0) {
      const next = new URLSearchParams(searchParamsURL)
      next.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(next)
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
          title="编辑原料库存"
          handleEdit={handleEdit}
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除原料库存"
          itemName="原料库存"
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          count={data?.count}
          permissionKey={YOUMAI_MANAGE_PERMISSION_KEY}
          onPreload={preloadYoumaiRawMaterialInventoryExcel}
        >
          导出库存
        </ExportButton>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            筛选条件
          </span>
        </div>
        <YoumaiRawMaterialInventorySearch
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
          <YoumaiRawMaterialInventoryTable
            loading={isLoading}
            data={data?.rawMaterialInventory || []}
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
        okButtonProps={{ disabled: viewerDenied || !canManageYoumai }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <YoumaiRawMaterialInventoryForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
