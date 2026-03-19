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
import {
  useAddProductionOrderItem,
  useUpdateProductionOrderItem,
  useDeleteProductionOrderItems,
} from './useProductionOrderItems'
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
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

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
  const addItemMutation = useAddProductionOrderItem()
  const updateItemMutation = useUpdateProductionOrderItem()
  const deleteItemMutation = useDeleteProductionOrderItems()

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
          if (error instanceof Error) {
            message.error(error.message)
          } else {
            message.error('删除失败，请稍后重试')
          }
        },
      })
    },
    [deleteMutation, message, selectedRowKeys],
  )

  const handleFinish = useCallback(
    async (values: {
      order: Partial<ProductionOrder>
      items: {
        id?: string
        project_no: string
        product_model: string | null
        length_mm: number | null
        customer_model: string | null
        operation: string
        standard_seconds: number
        qualified_quantity: number
        defect_reason_1: string | null
        defect_quantity_1: number
        defect_reason_2: string | null
        defect_quantity_2: number
        bonus_seconds: number
      }[]
    }) => {
      try {
        let orderId: string

        if (isEdit && editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: values.order,
          })
          orderId = editingRecord.id

          const existingItems = detailData?.items || []
          const currentItems = values.items
          const currentItemIds = new Set(
            currentItems
              .map((item) => item.id)
              .filter((id): id is string => Boolean(id)),
          )
          const deletedIds = existingItems
            .filter((item) => !currentItemIds.has(item.id))
            .map((item) => item.id)

          const updateTasks = currentItems
            .filter((item): item is typeof item & { id: string } =>
              Boolean(item.id),
            )
            .map((item) =>
              updateItemMutation.mutateAsync({
                id: item.id,
                values: {
                  project_no: item.project_no,
                  product_model: item.product_model,
                  length_mm: item.length_mm,
                  customer_model: item.customer_model,
                  operation: item.operation,
                  standard_seconds: item.standard_seconds,
                  qualified_quantity: item.qualified_quantity,
                  defect_reason_1: item.defect_reason_1,
                  defect_quantity_1: item.defect_quantity_1,
                  defect_reason_2: item.defect_reason_2,
                  defect_quantity_2: item.defect_quantity_2,
                  bonus_seconds: item.bonus_seconds,
                },
              }),
            )

          const addTasks = currentItems
            .filter((item) => !item.id)
            .map((item) =>
              addItemMutation.mutateAsync({
                ...item,
                order_id: orderId,
              }),
            )

          if (deletedIds.length > 0) {
            await deleteItemMutation.mutateAsync(deletedIds)
          }

          await Promise.all([...updateTasks, ...addTasks])
          message.success('工单更新成功')
        } else {
          const newOrder = await createMutation.mutateAsync(
            values.order as Parameters<typeof createMutation.mutateAsync>[0],
          )
          orderId = newOrder.id

          if (values.items.length > 0) {
            await Promise.all(
              values.items.map((item) =>
                addItemMutation.mutateAsync({
                  ...item,
                  order_id: orderId,
                }),
              ),
            )
          }

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
      addItemMutation,
      updateItemMutation,
      deleteItemMutation,
      detailData,
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
    if (page > 1 && orderData && orderData.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [orderData, page, searchParamsURL, setSearchParamsURL])

  const detailOrder = (detailData || editingRecord) as
    | (ProductionOrder & {
        items?: ProductionOrderItem[]
        employee?: { name: string }
      })
    | null

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          itemName="工单"
        />
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
          selectedRowKeys={selectedRowKeys}
          onSelect={setSelectedRowKeys}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          scrollY={scrollY}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination total={orderData?.total || 0} />
      </div>

      <ProductionOrderForm
        open={isModalOpen && !isView}
        onCancel={resetFormState}
        onSubmit={handleFinish}
        initialValues={detailData || editingRecord || undefined}
        employees={employees}
      />

      <Modal
        title={modalTitle}
        open={isModalOpen && isView}
        onCancel={resetFormState}
        footer={[]}
        width={900}
        destroyOnClose
      >
        {detailOrder ? (
          <ProductionOrderDetail
            order={detailOrder}
            onEdit={() => {
              setIsView(false)
              setIsEdit(true)
              setModalTitle('编辑工单')
            }}
          />
        ) : null}
      </Modal>
    </div>
  )
}
