import { useState, useCallback, useEffect } from 'react'
import { App, Modal } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { getProductionOrdersForExport } from '@/services/apiProductionOrders'
import { exportProductionOrdersToExcel } from '@/utils/productionOrderExcel'
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
import ProductionOrderMobileList from './ProductionOrderMobileList'
import ProductionOrderForm from './ProductionOrderForm'
import ProductionOrderDetail from './ProductionOrderDetail'
import ProductionOrderSearch from './ProductionOrderSearch'
import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'
import { useAuth } from '@/contexts/AuthContext'

export interface ProductionOrder {
  id: string
  order_date: string
  employee_id: string | null
  work_hours: number
  total_qualified_hours: number | null
  efficiency: number | null
  remark: string | null
  created_at: string
  updated_at: string
}

export default function ProductionOrderPage() {
  const { message } = App.useApp()
  const { role, employeeProfile } = useAuth()
  const isEmployeeView = role === 'employee'
  const fixedEmployee =
    isEmployeeView && employeeProfile?.id
      ? { id: employeeProfile.id, name: employeeProfile.name }
      : null

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建工单')
  const [isEdit, setIsEdit] = useState(false)
  const [isView, setIsView] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ProductionOrder | null>(
    null,
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [filters, setFilters] = useState<{
    startDate?: string
    endDate?: string
    employeeId?: string
  }>(() => ({
    employeeId:
      (role === 'employee' ? employeeProfile?.id : undefined) ||
      searchParamsURL.get('employeeId') ||
      undefined,
  }))

  const { data: orderData, isLoading } = useProductionOrders({
    page,
    pageSize,
    filters,
  })

  const { data: detailData, isLoading: isLoadingDetail } = useProductionOrder(
    editingRecord?.id,
  )

  const { data: allEmployees } = useAllEmployees()
  const employees = fixedEmployee ? [fixedEmployee] : allEmployees || []

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

  const handleEdit = useCallback(
    (record?: ProductionOrder) => {
      const targetRecord =
        record ||
        orderData?.items.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      setEditingRecord(targetRecord)
      setIsEdit(true)
      setIsView(false)
      setModalTitle('编辑工单')
      setIsModalOpen(true)
    },
    [message, orderData?.items, selectedRowKeys],
  )

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

  const handleExport = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的工单')
      return
    }

    try {
      setIsExporting(true)
      const exportOrders = await getProductionOrdersForExport(
        selectedRowKeys.map((key) => String(key)),
      )

      const exportableOrders = exportOrders.filter(
        (order) => order.items && order.items.length > 0,
      )

      if (exportableOrders.length === 0) {
        message.warning('选中的工单没有可导出的工序明细')
        return
      }

      exportProductionOrdersToExcel(exportableOrders)
      message.success(`已导出 ${exportableOrders.length} 张工单的工序明细`)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('导出失败，请稍后重试')
      }
    } finally {
      setIsExporting(false)
    }
  }, [message, selectedRowKeys])

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
      setFilters(
        fixedEmployee?.id
          ? { ...params, employeeId: fixedEmployee.id }
          : params,
      )
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [fixedEmployee?.id, searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setFilters(fixedEmployee?.id ? { employeeId: fixedEmployee.id } : {})
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [fixedEmployee?.id, searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (fixedEmployee?.id) {
      setFilters((prev) => ({ ...prev, employeeId: fixedEmployee.id }))
    }
  }, [fixedEmployee?.id])

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
    <div
      className={
        isEmployeeView
          ? 'grid h-full grid-rows-[auto_auto_1fr] gap-3 p-3'
          : 'grid h-full grid-rows-[auto_auto_1fr] gap-4'
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑" handleEdit={() => handleEdit()} />
        {isEmployeeView ? null : (
          <>
            <ExportButton
              handleExport={handleExport}
              loading={isExporting}
              count={selectedRowKeys.length}
            >
              导出工单
            </ExportButton>
            <DeleteButton
              onConfirm={handleDelete}
              isDeleting={deleteMutation.isPending}
              count={selectedRowKeys.length}
              itemName="工单"
            />
          </>
        )}
      </div>

      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : 'flex items-center gap-2'
        }
      >
        {isEmployeeView ? (
          <div className="mb-3">
            <div className="text-xs tracking-[0.24em] text-slate-400 uppercase">
              Filter
            </div>
            <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
              筛选我的工单
            </div>
          </div>
        ) : (
          <span className="whitespace-nowrap text-gray-600">搜索：</span>
        )}
        <ProductionOrderSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          employees={employees}
          initialValues={filters}
          fixedEmployee={fixedEmployee}
          mobile={isEmployeeView}
        />
      </div>

      <div
        ref={tableContainerRef}
        className={
          isEmployeeView
            ? 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden'
            : 'flex min-h-0 flex-1 flex-col gap-4 overflow-hidden'
        }
      >
        <div
          className={
            isEmployeeView
              ? 'no-scrollbar min-h-0 flex-1 overflow-y-auto'
              : 'min-h-0 flex-1 overflow-x-auto'
          }
        >
          {isEmployeeView ? (
            <ProductionOrderMobileList
              loading={isLoading}
              data={orderData?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              onView={handleView}
            />
          ) : (
            <ProductionOrderList
              loading={isLoading}
              data={orderData?.items || []}
              page={page}
              pageSize={pageSize}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              onView={handleView}
              scrollY={scrollY}
            />
          )}
        </div>

        <div
          ref={paginationRef}
          className={
            isEmployeeView
              ? 'flex shrink-0 justify-center pb-1'
              : 'flex shrink-0 justify-end'
          }
        >
          <AppPagination total={orderData?.total || 0} />
        </div>
      </div>

      <ProductionOrderForm
        open={isModalOpen && !isView}
        onCancel={resetFormState}
        onSubmit={handleFinish}
        initialValues={detailData || editingRecord || undefined}
        employees={employees}
        fixedEmployee={fixedEmployee}
        loading={isLoadingDetail && !!editingRecord?.id}
        compact={isEmployeeView}
      />

      <Modal
        title={modalTitle}
        open={isModalOpen && isView}
        onCancel={resetFormState}
        footer={[]}
        width={isEmployeeView ? 'calc(100vw - 20px)' : 900}
        style={isEmployeeView ? { top: 12, maxWidth: 560 } : undefined}
        destroyOnClose
      >
        {detailOrder ? (
          <ProductionOrderDetail
            order={detailOrder}
            compact={isEmployeeView}
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
