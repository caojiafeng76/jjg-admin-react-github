import { useCallback, useEffect, useState } from 'react'
import { App, FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import {
  getJintanPartsDataForExport,
  type JintanPartsData,
  type JintanPartsDataFormValues,
} from '@/services/apiJintanPartsData'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { JINTAN_PARTS_DATA_PERMISSION_KEY } from '../permissions'
import JintanPartsDataExcelImport from './JintanPartsDataExcelImport'
import JintanPartsDataForm from './JintanPartsDataForm'
import JintanPartsDataSearch from './JintanPartsDataSearch'
import JintanPartsDataTable from './JintanPartsDataTable'
import {
  useCreateJintanPartsData,
  useDeleteJintanPartsData,
  useImportJintanPartsData,
  useJintanPartsDataList,
  useUpdateJintanPartsData,
} from './useJintanPartsData'

const loadJintanPartsDataExcel = () => import('@/utils/jintanPartsDataExcel')

function preloadJintanPartsDataExcel() {
  void loadJintanPartsDataExcel()
}

export default function JintanPartsDataPage() {
  const { message } = App.useApp()
  const canManageParts = usePermission(JINTAN_PARTS_DATA_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建金檀木业配件资料')
  const [isEdit, setIsEdit] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<JintanPartsData | null>(
    null,
  )
  const [formRef, setFormRef] =
    useState<FormInstance<JintanPartsDataFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading, error, refetch } = useJintanPartsDataList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateJintanPartsData()
  const updateMutation = useUpdateJintanPartsData()
  const importMutation = useImportJintanPartsData()
  const deleteMutation = useDeleteJintanPartsData()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
    formRef?.resetFields()
  }, [formRef])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setModalTitle('新建金檀木业配件资料')
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
    setModalTitle('编辑金檀木业配件资料')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('配件资料删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除配件资料失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleImport = useCallback(
    async (rows: JintanPartsDataFormValues[]) => {
      if (!canManageParts) {
        message.warning('无金檀木业模块操作权限')
        return
      }

      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        await importMutation.mutateAsync(rows)
        message.success(`配件资料导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入配件资料失败，请稍后重试')
        }
      }
    },
    [canManageParts, importMutation, message, viewerDenied, viewerOperationTip],
  )

  const handleExport = useCallback(async () => {
    if (!canManageParts) {
      message.warning('无金檀木业模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    setIsExporting(true)
    try {
      const [exportRows, { exportJintanPartsDataToExcel }] = await Promise.all([
        getJintanPartsDataForExport(searchParams.keyword),
        loadJintanPartsDataExcel(),
      ])

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的配件资料')
        return
      }

      exportJintanPartsDataToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条配件资料`)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '导出配件资料失败，请稍后重试',
      )
    } finally {
      setIsExporting(false)
    }
  }, [
    canManageParts,
    message,
    searchParams.keyword,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleFinish = useCallback(
    async (values: JintanPartsDataFormValues) => {
      if (!canManageParts) {
        message.warning('无金檀木业模块操作权限')
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
          message.success('配件资料更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('配件资料创建成功')
        }

        resetFormState()
      } catch (error) {
        setFormError(error)
      }
    },
    [
      createMutation,
      canManageParts,
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
          permissionKey={JINTAN_PARTS_DATA_PERMISSION_KEY}
        />
        <EditButton
          title="编辑金檀木业配件资料"
          handleEdit={handleEdit}
          permissionKey={JINTAN_PARTS_DATA_PERMISSION_KEY}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={JINTAN_PARTS_DATA_PERMISSION_KEY}
          onPreload={preloadJintanPartsDataExcel}
        >
          导出 Excel
        </ExportButton>
        <JintanPartsDataExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={JINTAN_PARTS_DATA_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除金檀木业配件资料"
          itemName="配件资料"
          permissionKey={JINTAN_PARTS_DATA_PERMISSION_KEY}
        />
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            筛选条件
          </span>
        </div>
        <JintanPartsDataSearch
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
            <JintanPartsDataTable
              loading={isLoading}
              data={data?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
              emptyAction={
                <AddButton
                  handleCreate={handleCreate}
                  permissionKey={JINTAN_PARTS_DATA_PERMISSION_KEY}
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
        title={modalTitle}
        open={isModalOpen}
        destroyOnHidden
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied || !canManageParts }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <JintanPartsDataForm
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            initialValues={isEdit && editingRecord ? editingRecord : undefined}
          />
        </div>
      </Modal>
    </div>
  )
}
