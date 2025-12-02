import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import type { WorkshopDefectReason } from '@/services/apiWorkshopDefectReasons'
import {
  useWorkshopDefectReasonsList,
  useCreateWorkshopDefectReason,
  useUpdateWorkshopDefectReason,
  useDeleteWorkshopDefectReasons,
} from './useWorkshopDefectReasons'
import DefectReasonTable from './DefectReasonTable'
import DefectReasonForm from './DefectReasonForm'
import DefectReasonSearch from './DefectReasonSearch'

export default function DefectReasonList() {
  const { message } = App.useApp()


  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建不良原因')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<WorkshopDefectReason> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    defect_reason?: string
  }>({})

  const { data, isLoading } = useWorkshopDefectReasonsList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateWorkshopDefectReason()

  const updateMutation = useUpdateWorkshopDefectReason()

  const deleteMutation = useDeleteWorkshopDefectReasons()

  // 动态计算表格高度（目标10条数据撑满）
  const { tableContainerRef, paginationRef, scrollY, rowHeight } = useTableHeight({
    targetRowCount: 10,
  })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setModalTitle('创建不良原因')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const [editingRecord, setEditingRecord] = useState<WorkshopDefectReason | null>(null)

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) return

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑不良原因')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    deleteMutation.mutate(selectedRowKeys as string[])
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    (values: WorkshopDefectReason) => {
      if (isEdit && selectedRowKeys[0]) {
        updateMutation.mutate({
          id: selectedRowKeys[0] as string,
          values,
        })
      } else {
        createMutation.mutate(values)
      }
    },
    [createMutation, isEdit, selectedRowKeys, updateMutation],
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
          title="删除不良原因"
          itemName="不良原因"
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="text-gray-600 whitespace-nowrap">搜索：</span>
        <DefectReasonSearch onSearch={handleSearch} onReset={handleResetSearch} />
      </div>

      {/* 表格和分页 */}
      <div ref={tableContainerRef} className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-x-auto">
          <DefectReasonTable
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
        <div ref={paginationRef} className="flex justify-end flex-shrink-0">
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
        <DefectReasonForm
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



