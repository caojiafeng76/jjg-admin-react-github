import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  StandardTime,
  StandardTimeFormValues,
} from '@/services/apiStandardTimes'
import {
  useStandardTimesList,
  useCreateStandardTime,
  useUpdateStandardTime,
  useDeleteStandardTimes,
} from './useStandardTimes'
import StandardTimeTable from './StandardTimeTable'
import StandardTimeForm from './StandardTimeForm'
import StandardTimeSearch from './StandardTimeSearch'

export default function StandardTimeList() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建标准工时')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] =
    useState<FormInstance<StandardTimeFormValues> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    operation?: string
    model?: string
  }>({})

  const { data, isLoading } = useStandardTimesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateStandardTime()
  const updateMutation = useUpdateStandardTime()
  const deleteMutation = useDeleteStandardTimes()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建标准工时')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<StandardTime | null>(null)

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑标准工时')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('标准工时删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除标准工时失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: StandardTimeFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          const standardSecondsChanged =
            editingRecord?.standard_seconds !== values.standard_seconds

          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success(
            standardSecondsChanged
              ? '标准工时更新成功，历史工单已同步修正'
              : '标准工时更新成功',
          )
        } else {
          await createMutation.mutateAsync(values)
          message.success('标准工时创建成功')
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
      selectedRowKeys,
      updateMutation,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除标准工时"
          itemName="标准工时"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <StandardTimeSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
        />
      </div>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <StandardTimeTable
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
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        onOk={() => formRef?.submit()}
        onCancel={() => {
          resetFormState()
        }}
      >
        <StandardTimeForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
