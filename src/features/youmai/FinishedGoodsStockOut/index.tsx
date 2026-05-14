import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/16/solid'
import { App, Button, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { exportYoumaiFinishedGoodsStockOutToExcel } from '@/utils/youmaiFinishedGoodsStockOutExport'

import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  YoumaiFinishedGoodsStockOut,
  YoumaiFinishedGoodsStockOutFormValues,
  YoumaiFinishedGoodsStockOutImportRow,
} from '@/services/apiYoumaiFinishedGoodsStockOut'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import PrintButton from '@/ui/PrintButton'
import YoumaiFinishedGoodsStockOutExcelImport from './YoumaiFinishedGoodsStockOutExcelImport'
import YoumaiFinishedGoodsStockOutForm from './YoumaiFinishedGoodsStockOutForm'
import YoumaiFinishedGoodsStockOutSearch from './YoumaiFinishedGoodsStockOutSearch'
import YoumaiFinishedGoodsStockOutTable from './YoumaiFinishedGoodsStockOutTable'
import { usePrintYoumaiFinishedGoodsStockOut } from './usePrintYoumaiFinishedGoodsStockOut'
import { usePrintYoumaiLabel } from './usePrintYoumaiLabel'
import {
  useBatchUpdateYoumaiFinishedGoodsStockOutStatus,
  useCreateYoumaiFinishedGoodsStockOut,
  useDeleteYoumaiFinishedGoodsStockOut,
  useImportYoumaiFinishedGoodsStockOut,
  useUpdateYoumaiFinishedGoodsStockOut,
  useYoumaiFinishedGoodsStockOutList,
  useYoumaiProductDataOptions,
} from './useYoumaiFinishedGoodsStockOut'

export default function YoumaiFinishedGoodsStockOutPage() {
  const { message, modal } = App.useApp()
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建优迈成品出库')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<YoumaiFinishedGoodsStockOut | null>(null)
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

  const { data, isLoading } = useYoumaiFinishedGoodsStockOutList({
    page,
    pageSize,
    searchParams,
  })
  const { data: productOptions = [] } = useYoumaiProductDataOptions()

  const createMutation = useCreateYoumaiFinishedGoodsStockOut()
  const updateMutation = useUpdateYoumaiFinishedGoodsStockOut()
  const batchStatusMutation = useBatchUpdateYoumaiFinishedGoodsStockOutStatus()
  const importMutation = useImportYoumaiFinishedGoodsStockOut()
  const deleteMutation = useDeleteYoumaiFinishedGoodsStockOut()
  const { printSelected, isPrinting } = usePrintYoumaiFinishedGoodsStockOut()
  const { printLabels, isPrinting: isLabelPrinting } = usePrintYoumaiLabel()

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
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    void printSelected(selectedRecords)
  }, [
    message,
    printSelected,
    selectedRecords,
    viewerDenied,
    viewerOperationTip,
  ])

  const handlePrintLabel = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRecords.length === 0) {
      message.warning('请选择要打印标签的数据')
      return
    }

    try {
      await printLabels(selectedRecords)
    } catch (error) {
      console.error('打印优迈标签失败:', error)
      message.error(
        error instanceof Error ? error.message : '打印标签失败',
      )
    }
  }, [
    message,
    printLabels,
    selectedRecords,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleExportExcel = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRecords.length === 0) {
      message.warning('请选择要导出的出库数据')
      return
    }

    try {
      exportYoumaiFinishedGoodsStockOutToExcel(selectedRecords)
      message.success(`已导出 ${selectedRecords.length} 条优迈成品出库`)
    } catch (error) {
      console.error('导出优迈成品出库失败:', error)
      message.error('导出失败，请稍后重试')
    }
  }, [message, selectedRecords, viewerDenied, viewerOperationTip])

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
    setModalTitle('新建优迈成品出库')
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
      record.status === '已审核' ? '编辑优迈成品出库备注' : '编辑优迈成品出库',
    )
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    if (hasAuditedSelection) {
      message.warning('已审核的优迈成品出库不允许删除')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('优迈成品出库删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除优迈成品出库失败，请稍后重试')
      }
    }
  }, [deleteMutation, hasAuditedSelection, message, selectedRowKeys])

  const handleBatchAudit = useCallback(
    (status: '待审核' | '已审核') => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning(
          `请选择要${status === '已审核' ? '审核' : '反审'}的优迈成品出库`,
        )
        return
      }

      modal.confirm({
        title: `批量${status === '已审核' ? '审核' : '反审'}优迈成品出库`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条优迈成品出库标记为${status}吗？`,
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
      message,
      modal,
      selectedRowKeys,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleImport = useCallback(
    async (rows: YoumaiFinishedGoodsStockOutImportRow[]) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await importMutation.mutateAsync(rows)
        message.success(`优迈成品出库导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入优迈成品出库失败，请稍后重试')
        }
      }
    },
    [importMutation, message, viewerDenied, viewerOperationTip],
  )

  const handleFinish = useCallback(
    async (values: YoumaiFinishedGoodsStockOutFormValues) => {
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
          message.success('优迈成品出库更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('优迈成品出库创建成功')
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
        <AddButton handleCreate={handleCreate} />
        <Button
          type="text"
          icon={<ShieldCheckIcon className="size-4 text-green-500/80!" />}
          onClick={() => handleBatchAudit('已审核')}
          loading={batchStatusMutation.isPending}
          disabled={viewerDenied}
        >
          批量审核
        </Button>
        <Button
          type="text"
          icon={<ArrowPathIcon className="size-4 text-amber-500/80!" />}
          onClick={() => handleBatchAudit('待审核')}
          loading={batchStatusMutation.isPending}
          disabled={viewerDenied}
        >
          批量反审核
        </Button>
        <EditButton title="编辑优迈成品出库" handleEdit={handleEdit} />
        <PrintButton
          handlePrint={handlePrint}
          loading={isPrinting}
          count={selectedRowKeys.length}
        >
          打印选中项
        </PrintButton>
        <PrintButton
          handlePrint={handlePrintLabel}
          loading={isLabelPrinting}
          count={selectedRowKeys.length}
        >
          打印标签
        </PrintButton>
        <Button
          type="text"
          icon={<ArrowDownTrayIcon className="size-4 text-blue-500/80!" />}
          onClick={handleExportExcel}
          disabled={viewerDenied || selectedRowKeys.length === 0}
        >
          导出Excel
          {selectedRowKeys.length > 0 && (
            <span className="ml-1 text-xs">({selectedRowKeys.length})</span>
          )}
        </Button>
        <YoumaiFinishedGoodsStockOutExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除优迈成品出库"
          itemName="优迈成品出库"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <YoumaiFinishedGoodsStockOutSearch
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
          <YoumaiFinishedGoodsStockOutTable
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
        okButtonProps={{ disabled: viewerDenied }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <YoumaiFinishedGoodsStockOutForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          productOptions={productOptions}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
          isAuditLocked={editingRecord?.status === '已审核'}
        />
      </Modal>
    </div>
  )
}
