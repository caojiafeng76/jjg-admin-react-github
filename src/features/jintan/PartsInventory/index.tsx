import { useCallback, useEffect, useState } from 'react'
import { App, FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import {
  getJintanPartsInventoryForExport,
  type JintanPartsInventory,
  type JintanPartsInventoryFormValues,
  type JintanPartsInventoryImportRow,
} from '@/services/apiJintanPartsInventory'
import AppPagination from '@/ui/AppPagination'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { JINTAN_PARTS_INVENTORY_PERMISSION_KEY } from '../permissions'
import JintanPartsInventoryExcelImport from './JintanPartsInventoryExcelImport'
import JintanPartsInventoryForm from './JintanPartsInventoryForm'
import JintanPartsInventorySearch from './JintanPartsInventorySearch'
import JintanPartsInventoryTable from './JintanPartsInventoryTable'
import {
  useImportJintanPartsInventory,
  useJintanPartsInventoryList,
  useUpdateJintanPartsInventory,
} from './useJintanPartsInventory'

const loadJintanPartsInventoryExcel = () =>
  import('@/utils/jintanPartsInventoryExcel')

function preloadJintanPartsInventoryExcel() {
  void loadJintanPartsInventoryExcel()
}

export default function JintanPartsInventoryPage() {
  const { message } = App.useApp()
  const canManageInventory = usePermission(
    JINTAN_PARTS_INVENTORY_PERMISSION_KEY,
  )
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<JintanPartsInventory | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<JintanPartsInventoryFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading, error, refetch } = useJintanPartsInventoryList({
    page,
    pageSize,
    searchParams,
  })

  const updateMutation = useUpdateJintanPartsInventory()
  const importMutation = useImportJintanPartsInventory()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
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
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleExport = useCallback(async () => {
    if (!canManageInventory) {
      message.warning('无金檀木业模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setIsExporting(true)
    try {
      const [exportRows, { exportJintanPartsInventoryToExcel }] =
        await Promise.all([
          getJintanPartsInventoryForExport(searchParams.keyword),
          loadJintanPartsInventoryExcel(),
        ])

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的配件库存')
        return
      }

      exportJintanPartsInventoryToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条配件库存`)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '导出配件库存失败，请稍后重试',
      )
    } finally {
      setIsExporting(false)
    }
  }, [
    canManageInventory,
    message,
    searchParams.keyword,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleImport = useCallback(
    async (rows: JintanPartsInventoryImportRow[]) => {
      if (!canManageInventory) {
        message.warning('无金檀木业模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await importMutation.mutateAsync(rows)
        message.success(`配件库存导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入配件库存失败，请稍后重试')
        }
      }
    },
    [
      canManageInventory,
      importMutation,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleFinish = useCallback(
    async (values: JintanPartsInventoryFormValues) => {
      if (!canManageInventory) {
        message.warning('无金檀木业模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (!editingRecord) {
        return
      }

      try {
        await updateMutation.mutateAsync({ id: editingRecord.id, values })
        message.success('配件库存更新成功')
        resetFormState()
      } catch (error) {
        setFormError(error)
      }
    },
    [
      canManageInventory,
      editingRecord,
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
        <EditButton
          title="编辑金檀木业配件库存"
          handleEdit={handleEdit}
          permissionKey={JINTAN_PARTS_INVENTORY_PERMISSION_KEY}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={JINTAN_PARTS_INVENTORY_PERMISSION_KEY}
          onPreload={preloadJintanPartsInventoryExcel}
        >
          导出 Excel
        </ExportButton>
        <JintanPartsInventoryExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={JINTAN_PARTS_INVENTORY_PERMISSION_KEY}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            筛选条件
          </span>
        </div>
        <JintanPartsInventorySearch
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
          <TableState
            loading={isLoading && !data}
            error={error}
            onRetry={refetch}
          >
            <JintanPartsInventoryTable
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
        title="编辑金檀木业配件库存"
        open={isModalOpen}
        destroyOnHidden
        confirmLoading={updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied || !canManageInventory }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <JintanPartsInventoryForm
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={updateMutation.isPending}
            initialValues={editingRecord ?? undefined}
          />
        </div>
      </Modal>
    </div>
  )
}
