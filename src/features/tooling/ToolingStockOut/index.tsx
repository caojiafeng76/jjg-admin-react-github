import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/16/solid'
import { App, Button, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { exportToolingStockOutToExcel } from '@/utils/toolingStockOutExport'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import type {
  ToolingStockOut,
  ToolingStockOutFormValues,
  ToolingStockOutImportRow,
} from '@/services/apiToolingStockOut'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import PrintButton from '@/ui/PrintButton'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'
import ToolingStockOutExcelImport from './ToolingStockOutExcelImport'
import ToolingStockOutForm from './ToolingStockOutForm'
import ToolingStockOutSearch from './ToolingStockOutSearch'
import ToolingStockOutTable from './ToolingStockOutTable'
import { usePrintToolingStockOut } from './usePrintToolingStockOut'
import { usePrintToolingStockOutPublicQrPoster } from './usePrintToolingStockOutPublicQrPoster'
import {
  useBatchUpdateToolingStockOutStatus,
  useCreateToolingStockOut,
  useDeleteToolingStockOut,
  useImportToolingStockOut,
  useToolingDataOptions,
  useToolingStockOutList,
  useUpdateToolingStockOut,
} from './useToolingStockOut'

export default function ToolingStockOutPage() {
  const { message, modal } = App.useApp()
  const canManageTooling = usePermission(TOOLING_MANAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: TOOLING_MANAGE_PERMISSION_KEY,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建刀具出库')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<ToolingStockOut | null>(
    null,
  )
  const [formRef, setFormRef] = useState<FormInstance | null>(null)

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

  const { data, isLoading } = useToolingStockOutList({
    page,
    pageSize,
    searchParams,
  })
  const { data: toolingOptions = [] } = useToolingDataOptions()
  const { data: machineOptions = [], isLoading: isMachineOptionsLoading } =
    useMachineEquipmentOptions()

  const createMutation = useCreateToolingStockOut()
  const updateMutation = useUpdateToolingStockOut()
  const batchStatusMutation = useBatchUpdateToolingStockOutStatus()
  const importMutation = useImportToolingStockOut()
  const deleteMutation = useDeleteToolingStockOut()
  const { printSelected, isPrinting } = usePrintToolingStockOut()
  const {
    printPoster: printPublicQrPoster,
    isPrinting: isPrintingPublicQrPoster,
  } = usePrintToolingStockOutPublicQrPoster()

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

  const handlePrint = useCallback(() => {
    if (!canManageTooling) {
      message.warning('无刀具模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    void printSelected(selectedRecords)
  }, [
    message,
    canManageTooling,
    printSelected,
    selectedRecords,
    viewerDenied,
    viewerOperationTip,
  ])

  const handlePrintPublicQrPoster = useCallback(() => {
    if (!canManageTooling) {
      message.warning('无刀具模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    void printPublicQrPoster()
  }, [
    canManageTooling,
    message,
    printPublicQrPoster,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleExportExcel = useCallback(() => {
    if (!canManageTooling) {
      message.warning('无刀具模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRecords.length === 0) {
      message.warning('请选择要导出的出库数据')
      return
    }

    try {
      exportToolingStockOutToExcel(selectedRecords)
      message.success(`已导出 ${selectedRecords.length} 条刀具出库`)
    } catch (error) {
      console.error('导出刀具出库失败:', error)
      message.error('导出失败，请稍后重试')
    }
  }, [
    canManageTooling,
    message,
    selectedRecords,
    viewerDenied,
    viewerOperationTip,
  ])

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
    setModalTitle('新建刀具出库')
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
    setModalTitle(
      record.status === '已审核' ? '编辑刀具出库备注' : '编辑刀具出库',
    )
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    if (hasAuditedSelection) {
      message.warning('已审核的刀具出库不允许删除')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('刀具出库删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除刀具出库失败，请稍后重试')
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
          `请选择要${status === '已审核' ? '审核' : '反审'}的刀具出库`,
        )
        return
      }

      modal.confirm({
        title: `批量${status === '已审核' ? '审核' : '反审'}刀具出库`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条刀具出库标记为${status}吗？`,
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

  const handleImport = useCallback(
    async (rows: ToolingStockOutImportRow[]) => {
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
        message.success(`刀具出库导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入刀具出库失败，请稍后重试')
        }
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
    async (values: ToolingStockOutFormValues) => {
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
          message.success('刀具出库更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('刀具出库创建成功')
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
          title="编辑刀具出库"
          handleEdit={handleEdit}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
        <PrintButton
          handlePrint={handlePrint}
          loading={isPrinting}
          count={selectedRowKeys.length}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        >
          打印选中项
        </PrintButton>
        <PrintButton
          handlePrint={handlePrintPublicQrPoster}
          loading={isPrintingPublicQrPoster}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        >
          打印二维码
        </PrintButton>
        <Button
          type="text"
          icon={<ArrowDownTrayIcon className="size-4 text-blue-500/80!" />}
          onClick={handleExportExcel}
          disabled={
            viewerDenied || !canManageTooling || selectedRowKeys.length === 0
          }
        >
          导出Excel
          {selectedRowKeys.length > 0 && (
            <span className="ml-1 text-xs">({selectedRowKeys.length})</span>
          )}
        </Button>
        <ToolingStockOutExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除刀具出库"
          itemName="刀具出库"
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <ToolingStockOutSearch
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
          <ToolingStockOutTable
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
        <ToolingStockOutForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          toolingOptions={toolingOptions}
          machineOptions={machineOptions}
          isMachineOptionsLoading={isMachineOptionsLoading}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
          isAuditLocked={editingRecord?.status === '已审核'}
        />
      </Modal>
    </div>
  )
}
