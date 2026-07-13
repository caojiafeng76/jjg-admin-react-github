import { useCallback, useEffect, useState } from 'react'
import { App, Modal, type FormInstance } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import type {
  PackagingWorkOrderBatch,
  PackagingWorkOrderFormValues,
} from '@/services/apiPackagingWorkOrders'
import WorkOrderForm from './WorkOrderForm'
import WorkOrderSearch, {
  type WorkOrderSearchValues,
} from './WorkOrderSearch'
import WorkOrderTable from './WorkOrderTable'
import {
  useCreatePackagingWorkOrder,
  useDeletePackagingWorkOrder,
  usePackagingWorkOrderList,
  useUpdatePackagingWorkOrder,
} from './useWorkOrders'
import { useExportWorkOrdersAsExcel } from './useExportWorkOrdersAsExcel'

const CREATE_PERMISSION_KEY =
  'feature:packaging-process-work-order-list.create'
const EDIT_PERMISSION_KEY = 'feature:packaging-process-work-order-list.edit'
const DELETE_PERMISSION_KEY =
  'feature:packaging-process-work-order-list.delete'
const EXPORT_PERMISSION_KEY =
  'feature:packaging-process-work-order-list.export'

export default function WorkOrderListPage() {
  const { message } = App.useApp()
  const canCreate = usePermission(CREATE_PERMISSION_KEY)
  const canEdit = usePermission(EDIT_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: [
      CREATE_PERMISSION_KEY,
      EDIT_PERMISSION_KEY,
      DELETE_PERMISSION_KEY,
      EXPORT_PERMISSION_KEY,
    ],
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建生产工单')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<PackagingWorkOrderBatch | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<PackagingWorkOrderFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<WorkOrderSearchValues>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading } = usePackagingWorkOrderList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreatePackagingWorkOrder()
  const updateMutation = useUpdatePackagingWorkOrder()
  const deleteMutation = useDeletePackagingWorkOrder()
  const { exportAsExcel, isExporting, preloadExportAsExcel } =
    useExportWorkOrdersAsExcel()

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
    setModalTitle('新建生产工单')
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
    setModalTitle('编辑生产工单')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      const selectedRecords = data?.items.filter((item) =>
        selectedRowKeys.includes(item.id),
      )
      await deleteMutation.mutateAsync({
        batchIds:
          selectedRecords
            ?.filter((item) => !item.is_historical_inconsistent)
            .map((item) => item.input_batch_id) || [],
        legacyDetailIds:
          selectedRecords
            ?.filter((item) => item.is_historical_inconsistent)
            .map((item) => item.id) || [],
      })
      message.success('生产工单删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除生产工单失败，请稍后重试')
      }
    }
  }, [data, deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (rawValues: PackagingWorkOrderFormValues) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      const values: PackagingWorkOrderFormValues = {
        ...rawValues,
        work_date: dayjs.isDayjs(rawValues.work_date)
          ? rawValues.work_date.format('YYYY-MM-DD')
          : String(rawValues.work_date || dayjs().format('YYYY-MM-DD')),
      }

      try {
        if (isEdit && editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values,
            isHistoricalInconsistent:
              editingRecord.is_historical_inconsistent,
          })
          message.success('生产工单更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('生产工单创建成功')
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
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleSearch = useCallback(
    (params: WorkOrderSearchValues) => {
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

  const handleExport = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      const exported = await exportAsExcel({
        searchParams,
      })
      if (exported) {
        setSelectedRowKeys([])
      }
    } catch {
      // hook already handled error message
    }
  }, [exportAsExcel, message, searchParams, viewerDenied, viewerOperationTip])

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
          permissionKey={CREATE_PERMISSION_KEY}
        />
        <EditButton
          title="编辑生产工单"
          handleEdit={handleEdit}
          permissionKey={EDIT_PERMISSION_KEY}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除生产工单"
          itemName="生产工单"
          permissionKey={DELETE_PERMISSION_KEY}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          onPreload={preloadExportAsExcel}
          count={data?.total || 0}
          permissionKey={EXPORT_PERMISSION_KEY}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <WorkOrderSearch
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
          <WorkOrderTable
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
        width={760}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        okButtonProps={{
          disabled: viewerDenied || (isEdit ? !canEdit : !canCreate),
        }}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <WorkOrderForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
          isHistoricalInconsistent={
            isEdit && editingRecord?.is_historical_inconsistent
          }
        />
      </Modal>
    </div>
  )
}
