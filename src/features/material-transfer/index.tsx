import { useCallback, useMemo, useState } from 'react'
import { App } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import {
  type MaterialTransferInsert,
  type MaterialTransferUpdate,
  type MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import {
  useCreateMaterialTransfer,
  useDeleteMaterialTransfers,
  useMaterialTransfers,
  useUpdateMaterialTransfer,
} from './useMaterialTransfers'
import MaterialTransferForm from './MaterialTransferForm'
import MaterialTransferSearch from './MaterialTransferSearch'
import MaterialTransferTable from './MaterialTransferTable'

export default function MaterialTransferPage() {
  const { message } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] = useState<{
    projectNo?: string
    employeeId?: string
    targetWorkshop?: string
    recipientName?: string
  }>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<MaterialTransferWithEmployee | null>(null)

  const { data: employeeOptions = [] } = useAllEmployees()
  const { data, isLoading } = useMaterialTransfers({
    page,
    pageSize,
    filters: searchFilters,
  })
  const createMutation = useCreateMaterialTransfer()
  const updateMutation = useUpdateMaterialTransfer()
  const deleteMutation = useDeleteMaterialTransfers()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const selectedCount = selectedRowKeys.length
  const records = useMemo(() => data?.items || [], [data?.items])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const initialFormValues = useMemo(() => editingRecord, [editingRecord])

  const openCreateModal = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (record?: MaterialTransferWithEmployee) => {
      const targetRecord =
        record || records.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      setEditingRecord(targetRecord)
      setIsModalOpen(true)
    },
    [message, records, selectedRowKeys],
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }, [])

  const handleSearch = useCallback(
    (filters: {
      projectNo?: string
      employeeId?: string
      targetWorkshop?: string
      recipientName?: string
    }) => {
      setSearchFilters(filters)
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchFilters({})
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  const handleDelete = useCallback(
    (ids?: string[]) => {
      const deleteIds = ids || selectedRowKeys

      if (deleteIds.length === 0) {
        message.warning('请选择至少一条数据')
        return
      }

      deleteMutation.mutate(deleteIds as string[], {
        onSuccess: () => {
          message.success('删除成功')
          setSelectedRowKeys([])
        },
        onError: (error) => {
          message.error(error instanceof Error ? error.message : '删除失败')
        },
      })
    },
    [deleteMutation, message, selectedRowKeys],
  )

  const handleSubmit = useCallback(
    async (values: MaterialTransferInsert | MaterialTransferUpdate) => {
      if (editingRecord) {
        await updateMutation.mutateAsync({
          id: editingRecord.id,
          values: values as MaterialTransferUpdate,
        })
        message.success('更新成功')
      } else {
        await createMutation.mutateAsync(values as MaterialTransferInsert)
        message.success('创建成功')
      }

      handleCloseModal()
      setSelectedRowKeys([])
    },
    [createMutation, editingRecord, handleCloseModal, message, updateMutation],
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={openCreateModal} />
        <EditButton title="编辑物料转移单" handleEdit={() => openEditModal()} />
        <DeleteButton
          onConfirm={() => handleDelete()}
          isDeleting={deleteMutation.isPending}
          count={selectedCount}
          title="删除物料转移单"
          itemName="转移单"
        />
      </div>

      <MaterialTransferSearch
        employees={employeeOptions}
        initialValues={searchFilters}
        onSearch={handleSearch}
        onReset={handleResetSearch}
      />

      <div ref={tableContainerRef} className="min-h-0 flex-1 overflow-hidden">
        <MaterialTransferTable
          loading={isLoading}
          data={records}
          page={page}
          pageSize={pageSize}
          selectedRowKeys={selectedRowKeys}
          onSelect={setSelectedRowKeys}
          onEdit={openEditModal}
          scrollY={scrollY}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination total={data?.total || 0} />
      </div>

      <MaterialTransferForm
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        initialValues={initialFormValues}
        employees={employeeOptions}
        loading={isSubmitting}
      />
    </div>
  )
}
