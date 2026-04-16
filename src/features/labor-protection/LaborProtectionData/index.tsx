import { useCallback, useEffect, useState } from 'react'
import { App, FormInstance, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  LaborProtectionData,
  LaborProtectionDataFormValues,
} from '@/services/apiLaborProtectionData'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import LaborProtectionDataExcelImport from './LaborProtectionDataExcelImport'
import LaborProtectionDataForm from './LaborProtectionDataForm'
import LaborProtectionDataSearch from './LaborProtectionDataSearch'
import LaborProtectionDataTable from './LaborProtectionDataTable'
import {
  useCreateLaborProtectionData,
  useDeleteLaborProtectionData,
  useImportLaborProtectionData,
  useLaborProtectionDataList,
  useUpdateLaborProtectionData,
} from './useLaborProtectionData'

export default function LaborProtectionDataPage() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建劳保资料')
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] =
    useState<LaborProtectionData | null>(null)
  const [formRef, setFormRef] =
    useState<FormInstance<LaborProtectionDataFormValues> | null>(null)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<{ keyword?: string }>({
    keyword: searchParamsURL.get('keyword') || undefined,
  })

  const { data, isLoading } = useLaborProtectionDataList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateLaborProtectionData()
  const updateMutation = useUpdateLaborProtectionData()
  const importMutation = useImportLaborProtectionData()
  const deleteMutation = useDeleteLaborProtectionData()

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
    setModalTitle('新建劳保资料')
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
    setModalTitle('编辑劳保资料')
    setIsModalOpen(true)
  }, [data?.items, message, selectedRowKeys])

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('劳保资料删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除劳保资料失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleImport = useCallback(
    async (rows: LaborProtectionDataFormValues[]) => {
      try {
        await importMutation.mutateAsync(rows)
        message.success(`劳保资料导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('导入劳保资料失败，请稍后重试')
        }
      }
    },
    [importMutation, message],
  )

  const handleFinish = useCallback(
    async (values: LaborProtectionDataFormValues) => {
      try {
        if (isEdit && selectedRowKeys[0]) {
          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values,
          })
          message.success('劳保资料更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('劳保资料创建成功')
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
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑劳保资料" handleEdit={handleEdit} />
        <LaborProtectionDataExcelImport
          onImport={handleImport}
          isImporting={importMutation.isPending}
        />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除劳保资料"
          itemName="劳保资料"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <LaborProtectionDataSearch
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
          <LaborProtectionDataTable
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
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <LaborProtectionDataForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
        />
      </Modal>
    </div>
  )
}
