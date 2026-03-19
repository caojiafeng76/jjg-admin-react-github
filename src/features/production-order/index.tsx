import { useState, useCallback, useEffect } from 'react'
import { App, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import DeleteButton from '@/ui/DeleteButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  useProductionOrders,
  useProductionOrder,
  useCreateProductionOrder,
  useUpdateProductionOrder,
  useDeleteProductionOrders,
} from './useProductionOrders'
import { useAllEmployees } from '../workshop/EmployeeList/useEmployees'
import ProductionOrderList from './ProductionOrderList'
import ProductionOrderForm from './ProductionOrderForm'
import ProductionOrderDetail from './ProductionOrderDetail'
import ProductionOrderSearch from './ProductionOrderSearch'
import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'

export interface ProductionOrder {
  id: string
  order_date: string
  employee_id: string | null
  work_hours: number
  total_qualified_hours: number | null
  efficiency: number | null
  status: string
  remark: string | null
  created_at: string
  updated_at: string
}

export default function ProductionOrderPage() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建工单')
  const [isEdit, setIsEdit] = useState(false)
  const [isView, setIsView] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProductionOrder | null>(
    null,
  )

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [filters, setFilters] = useState<{
    startDate?: string
    endDate?: string
    employeeId?: string
    status?: string
  }>({})

  const { data: orderData, isLoading } = useProductionOrders({
    page,
    pageSize,
    filters,
  })

  const { data: detailData } = useProductionOrder(editingRecord?.id)

  const { data: allEmployees } = useAllEmployees()
  const employees = allEmployees || []

  const createMutation = useCreateProductionOrder()
  const updateMutation = useUpdateProductionOrder()
  const deleteMutation = useDeleteProductionOrders()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setIsView(false)
    setEditingRecord(null)
  }, [])

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setIsView(false)
    setModalTitle('创建工单')
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((record: ProductionOrder) => {
    setEditingRecord(record)
    setIsEdit(true)
    setIsView(false)
    setModalTitle('编辑工单')
    setIsModalOpen(true)
  }, [])

  const handleView = useCallback((record: ProductionOrder) => {
    setEditingRecord(record)
    setIsView(true)
    setIsEdit(false)
    setModalTitle('工单详情')
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback(
    (ids: string[]) => {
      deleteMutation.mutate(ids, {
        onSuccess: () => {
          message.success('删除成功')
        },
        onError: (error) => {
          if (error instanceof Error) {
            message.error(error.message)
          } else {
            message.error('删除失败，请稍后重试')
          }
        },
      })
    },
    [deleteMutation, message],
  )

  const handleFinish = useCallback(
    async (values: Partial<ProductionOrder>) => {
      try {
        if (isEdit && editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values,
          })
          message.success('工单更新成功')
        } else {
          await createMutation.mutateAsync(
            values as Parameters<typeof createMutation.mutateAsync>[0],
          )
          message.success('工单创建成功')
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
      editingRecord,
      message,
      resetFormState,
      updateMutation,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof filters) => {
      setFilters(params)
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setFilters({})
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (createMutation.isSuccess || updateMutation.isSuccess) {
      resetFormState()
      createMutation.reset()
      updateMutation.reset()
    }
  }, [
    createMutation.isSuccess,
    updateMutation.isSuccess,
    resetFormState,
    createMutation,
    updateMutation,
  ])

  useEffect(() => {
    if (page > 1 && orderData && orderData.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [orderData, page, searchParamsURL, setSearchParamsURL])

  const renderContent = () => {
    if (isView && editingRecord && detailData) {
      return (
        <ProductionOrderDetail
          order={
            detailData as ProductionOrder & {
              items?: ProductionOrderItem[]
              employee?: { name: string }
            }
          }
          onEdit={() => {
            setIsView(false)
            setIsEdit(true)
            setModalTitle('编辑工单')
          }}
        />
      )
    }

    return (
      <ProductionOrderForm
        open={isModalOpen}
        onCancel={resetFormState}
        onSubmit={handleFinish}
        initialValues={editingRecord || undefined}
        employees={employees}
      />
    )
  }

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <DeleteButton onConfirm={() => {}} isDeleting={false} />
      </div>

      <ProductionOrderSearch
        onSearch={handleSearch}
        onReset={handleResetSearch}
        employees={employees}
      />

      <div ref={tableContainerRef} className="min-h-0">
        <ProductionOrderList
          loading={isLoading}
          data={orderData?.items || []}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          scrollY={scrollY}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination total={orderData?.total || 0} />
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        onCancel={resetFormState}
        footer={isView ? [] : undefined}
        width={isView ? 900 : 500}
        destroyOnClose
      >
        {renderContent()}
      </Modal>
    </div>
  )
}
