import { useCallback, useEffect, useState } from 'react'
import { App, FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import { useTableHeight } from '@/hooks/useTableHeight'

import type { AttendanceDetailFormValues } from '@/services/apiAttendanceDetails'
import type { AttendanceDetail } from '@/services/apiAttendanceDetails'
import AttendanceDetailForm from './AttendanceDetailForm'
import AttendanceDetailSearch from './AttendanceDetailSearch'
import AttendanceDetailTable from './AttendanceDetailTable'
import AttendanceExcelImport from './AttendanceExcelImport'
import {
  useAttendanceDetailsList,
  useCreateAttendanceDetail,
  useCreateAttendanceDetailsBatch,
  useDeleteAttendanceDetails,
  useUpdateAttendanceDetail,
} from './useAttendanceDetails'

export default function AttendanceDetailPage() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建考勤明细')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<AttendanceDetail | null>(
    null,
  )
  const [formRef, setFormRef] =
    useState<FormInstance<AttendanceDetailFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{
    name?: string
    startDate?: string
    endDate?: string
  }>({
    name: searchParamsURL.get('name') || undefined,
    startDate: searchParamsURL.get('startDate') || undefined,
    endDate: searchParamsURL.get('endDate') || undefined,
  })

  const { data, isLoading } = useAttendanceDetailsList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateAttendanceDetail()
  const updateMutation = useUpdateAttendanceDetail()
  const deleteMutation = useDeleteAttendanceDetails()
  const batchCreateMutation = useCreateAttendanceDetailsBatch()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
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
    setModalTitle('新建考勤明细')
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
      message.warning('未找到对应记录')
      return
    }

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑考勤明细')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleBatchImport = async (rows: AttendanceDetailFormValues[]) => {
    try {
      await batchCreateMutation.mutateAsync(rows)
      message.success(`成功导入 ${rows.length} 条考勤记录`)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('批量导入失败，请稍后重试')
      }
      throw error
    }
  }

  const handleFinish = useCallback(
    async (values: AttendanceDetailFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            ...values,
          })
          message.success('更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('创建成功')
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
    ],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])

      const next = new URLSearchParams(searchParamsURL)
      next.set('page', '1')
      if (params.name) next.set('name', params.name)
      else next.delete('name')
      if (params.startDate) next.set('startDate', params.startDate)
      else next.delete('startDate')
      if (params.endDate) next.set('endDate', params.endDate)
      else next.delete('endDate')

      setSearchParamsURL(next)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])

    const next = new URLSearchParams(searchParamsURL)
    next.set('page', '1')
    next.delete('name')
    next.delete('startDate')
    next.delete('endDate')
    setSearchParamsURL(next)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      const next = new URLSearchParams(searchParamsURL)
      next.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(next)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑考勤明细" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除考勤明细"
          itemName="考勤记录"
        />
        <AttendanceExcelImport
          onImport={handleBatchImport}
          isImporting={batchCreateMutation.isPending}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <AttendanceDetailSearch
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
          <AttendanceDetailTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        destroyOnClose
        width={480}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <AttendanceDetailForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending || updateMutation.isPending}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
