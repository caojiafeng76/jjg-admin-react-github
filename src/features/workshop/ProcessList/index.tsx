import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import type { WorkshopProcess } from '@/services/apiWorkshopProcesses'
import {
  useWorkshopProcessesList,
  useCreateWorkshopProcess,
  useUpdateWorkshopProcess,
  useDeleteWorkshopProcesses,
} from './useWorkshopProcesses'
import ProcessTable from './ProcessTable'
import ProcessForm from './ProcessForm'
import ProcessSearch from './ProcessSearch'

export default function ProcessList() {
  const { message } = App.useApp()


  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建工序')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<WorkshopProcess> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    process_name?: string
  }>({})

  const { data, isLoading } = useWorkshopProcessesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateWorkshopProcess()

  const updateMutation = useUpdateWorkshopProcess()

  const deleteMutation = useDeleteWorkshopProcesses()

  // 动态计算表格高度（目标10条数据撑满）
  const { tableContainerRef, paginationRef, scrollY, rowHeight } = useTableHeight({
    targetRowCount: 10,
  })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建工序')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<WorkshopProcess | null>(null)

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑工序')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    deleteMutation.mutate(selectedRowKeys as string[])
  }, [deleteMutation, message, selectedRowKeys])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleFinish = useCallback(
    (values: WorkshopProcess) => {
      if (isEdit && selectedRowKeys[0]) {
        updateMutation.mutate(
          { id: selectedRowKeys[0] as string, values },
          { onSuccess: handleCloseModal },
        )
      } else {
        createMutation.mutate(values, { onSuccess: handleCloseModal })
      }
    },
    [createMutation, handleCloseModal, isEdit, selectedRowKeys, updateMutation],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
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
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除工序"
          itemName="工序"
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 whitespace-nowrap">搜索：</span>
        <ProcessSearch onSearch={handleSearch} onReset={handleResetSearch} />
      </div>

      {/* 表格和分页 */}
      <div ref={tableContainerRef} className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-x-auto">
          <ProcessTable
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
        <div ref={paginationRef} className="flex justify-end shrink-0">
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
          setIsModalOpen(false)
          setIsEdit(false)
          setEditingRecord(null)
        }}
      >
        <ProcessForm
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

