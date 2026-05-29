import { useCallback, useEffect, useState } from 'react'
import { App, DatePicker, FormInstance, Modal } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import {
  getToolingDataForExport,
  getToolingDataMonthlySummary,
} from '@/services/apiToolingData'
import type {
  ToolingData,
  ToolingDataFormValues,
} from '@/services/apiToolingData'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import {
  exportToolingDataMonthlySummaryToExcel,
  exportToolingDataToExcel,
} from '@/utils/toolingDataExcel'
import { TOOLING_MANAGE_PERMISSION_KEY } from '../permissions'
import ToolingDataExcelImport from './ToolingDataExcelImport'
import ToolingDataForm from './ToolingDataForm'
import ToolingDataSearch from './ToolingDataSearch'
import ToolingDataTable from './ToolingDataTable'
import {
  useCreateToolingData,
  useDeleteToolingData,
  useImportToolingData,
  useToolingDataList,
  useUpdateToolingData,
} from './useToolingData'

const DEFAULT_PAGE_SIZE = 20
const MIN_TABLE_ROW_HEIGHT = 28

export default function ToolingDataPage() {
  const { message } = App.useApp()
  const canManageTooling = usePermission(TOOLING_MANAGE_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: TOOLING_MANAGE_PERMISSION_KEY,
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建刀具资料')
  const [isEdit, setIsEdit] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isMonthlySummaryExporting, setIsMonthlySummaryExporting] =
    useState(false)
  const [monthlySummaryMonth, setMonthlySummaryMonth] = useState<Dayjs | null>(
    dayjs(),
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<ToolingData | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<ToolingDataFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || DEFAULT_PAGE_SIZE
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading } = useToolingDataList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateToolingData()
  const updateMutation = useUpdateToolingData()
  const importMutation = useImportToolingData()
  const deleteMutation = useDeleteToolingData()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: DEFAULT_PAGE_SIZE,
      minRowHeight: MIN_TABLE_ROW_HEIGHT,
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
    setModalTitle('新建刀具资料')
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
    setModalTitle('编辑刀具资料')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('刀具资料删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除刀具资料失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleImport = useCallback(
    async (rows: ToolingDataFormValues[]) => {
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
        message.success(`刀具资料导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入刀具资料失败，请稍后重试')
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

  const handleExport = useCallback(async () => {
    if (!canManageTooling) {
      message.warning('无刀具模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      setIsExporting(true)
      const exportRows = await getToolingDataForExport()

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的刀具资料')
        return
      }

      exportToolingDataToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条刀具资料`)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '导出刀具资料失败，请稍后重试',
      )
    } finally {
      setIsExporting(false)
    }
  }, [canManageTooling, message, viewerDenied, viewerOperationTip])

  const disableFutureSummaryMonth = useCallback((current: Dayjs) => {
    return current.startOf('month').isAfter(dayjs().startOf('month'))
  }, [])

  const handleExportMonthlySummary = useCallback(async () => {
    if (!canManageTooling) {
      message.warning('无刀具模块操作权限')
      return
    }

    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (!monthlySummaryMonth) {
      message.warning('请先选择汇总月份')
      return
    }

    const month = monthlySummaryMonth.format('YYYY-MM')

    try {
      setIsMonthlySummaryExporting(true)
      const exportRows = await getToolingDataMonthlySummary({ month })

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的刀具月度汇总')
        return
      }

      exportToolingDataMonthlySummaryToExcel(exportRows, month)
      message.success(
        `已导出 ${monthlySummaryMonth.format('M')} 月刀具汇总，共 ${exportRows.length} 条`,
      )
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : '导出刀具月度汇总失败，请稍后重试',
      )
    } finally {
      setIsMonthlySummaryExporting(false)
    }
  }, [
    canManageTooling,
    message,
    monthlySummaryMonth,
    viewerDenied,
    viewerOperationTip,
  ])

  const handleFinish = useCallback(
    async (values: ToolingDataFormValues) => {
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
          message.success('刀具资料更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('刀具资料创建成功')
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
          title="编辑刀具资料"
          handleEdit={handleEdit}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
        <ToolingDataExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        >
          导出资料
        </ExportButton>
        <DatePicker
          picker="month"
          value={monthlySummaryMonth}
          onChange={setMonthlySummaryMonth}
          disabledDate={disableFutureSummaryMonth}
          allowClear={false}
          disabled={viewerDenied || !canManageTooling}
          placeholder="选择月份"
          className="w-32"
        />
        <ExportButton
          handleExport={handleExportMonthlySummary}
          loading={isMonthlySummaryExporting}
          disabled={!monthlySummaryMonth}
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        >
          导出月度汇总
        </ExportButton>
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除刀具资料"
          itemName="刀具资料"
          permissionKey={TOOLING_MANAGE_PERMISSION_KEY}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <ToolingDataSearch
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
          <ToolingDataTable
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
          <AppPagination
            total={data?.total || 0}
            defaultPageSize={DEFAULT_PAGE_SIZE}
          />
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
        <ToolingDataForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
