import { useCallback, useEffect, useState } from 'react'
import { App, type FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import {
  QUALITY_REWORK_REPAIR_CATEGORIES,
  type QualityReworkRepair,
  type QualityReworkRepairCategory,
  type QualityReworkRepairFormValues,
  type QualityReworkRepairSearchParams,
} from '@/services/apiQualityReworkRepair'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ReworkRepairForm, {
  type QualityReworkRepairFormFields,
} from './ReworkRepairForm'
import ReworkRepairSearch from './ReworkRepairSearch'
import ReworkRepairTable from './ReworkRepairTable'
import {
  useCreateQualityReworkRepair,
  useDeleteQualityReworkRepair,
  useQualityReworkRepairList,
  useUpdateQualityReworkRepair,
} from './useQualityReworkRepair'

function parseCategory(
  value: string | null,
): QualityReworkRepairCategory | undefined {
  if (
    QUALITY_REWORK_REPAIR_CATEGORIES.includes(
      value as QualityReworkRepairCategory,
    )
  ) {
    return value as QualityReworkRepairCategory
  }
  return undefined
}

export default function QualityReworkRepairPage() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建返工返修记录')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<QualityReworkRepair | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<QualityReworkRepairFormFields> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] =
    useState<QualityReworkRepairSearchParams>({
      keyword: searchParamsURL.get('keyword') || undefined,
      reworkCategory: parseCategory(searchParamsURL.get('reworkCategory')),
    })

  const { data, isLoading } = useQualityReworkRepairList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateQualityReworkRepair()
  const updateMutation = useUpdateQualityReworkRepair()
  const deleteMutation = useDeleteQualityReworkRepair()

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
    setModalTitle('新建返工返修记录')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条返工返修记录进行编辑')
      return
    }

    const record = data?.items.find((item) => item.id === selectedRowKeys[0])
    if (!record) {
      message.warning('请选择一条返工返修记录进行编辑')
      return
    }

    setEditingRecord(record)
    setIsEdit(true)
    setModalTitle('编辑返工返修记录')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条返工返修记录')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('返工返修记录删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除返工返修记录失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: QualityReworkRepairFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('返工返修记录更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('返工返修记录创建成功')
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
    (params: QualityReworkRepairSearchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])

      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)
      nextSearchParamsURL.set('page', '1')

      if (params.keyword) {
        nextSearchParamsURL.set('keyword', params.keyword)
      } else {
        nextSearchParamsURL.delete('keyword')
      }

      if (params.reworkCategory) {
        nextSearchParamsURL.set('reworkCategory', params.reworkCategory)
      } else {
        nextSearchParamsURL.delete('reworkCategory')
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
    nextSearchParamsURL.delete('reworkCategory')
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
        <EditButton title="编辑返工返修记录" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除返工返修记录"
          itemName="返工返修记录"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-slate-600">搜索：</span>
        <ReworkRepairSearch
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
          <ReworkRepairTable
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
        width={980}
        destroyOnHidden
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <ReworkRepairForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
