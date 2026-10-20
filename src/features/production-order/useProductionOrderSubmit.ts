import type {
  useProductionOrder,
} from './useProductionOrders'
import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
  ProductionOrderItemInsert,
} from '@/services/apiProductionOrderItems'
import type { ProductionOrder } from '@/services/apiProductionOrders'
import { useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { useCallback } from 'react'
import {
  checkEmployeeOrderExistsOnDate,

} from '@/services/apiProductionOrders'
import { isAuditedRecord } from './productionOrderPageUtils'
import {
  useAddProductionOrderItem,
  useDeleteProductionOrderItems,
  useUpdateProductionOrderItem,
} from './useProductionOrderItems'
import {
  useCreateProductionOrder,
  useUpdateProductionOrder,
} from './useProductionOrders'

async function syncOrderItemsSequentially({
  items,
  orderId,
  addItem,
  updateItem,
}: {
  items: {
    id?: string
    project_no: string
    product_model: string | null
    length_mm: number | null
    customer_model: string | null
    data_category?: ProductionOrderDataCategory
    operation: string
    standard_seconds: number
    incoming_qualified_quantity: number
    qualified_quantity: number
    defect_reason_1: string | null
    defect_quantity_1: number
    defect_reason_2: string | null
    defect_quantity_2: number
    outsource_defect_quantity: number
    outsource_defect_reason: string | null
    outsource_unit: string | null
    setup_defect_quantity: number
    setup_responsible: string | null
  }[]
  orderId: string
  addItem: (item: ProductionOrderItemInsert) => Promise<unknown>
  updateItem: (params: {
    id: string
    values: Partial<ProductionOrderItem>
  }) => Promise<unknown>
}) {
  for (const item of items) {
    if (item.id) {
      await updateItem({
        id: item.id,
        values: {
          project_no: item.project_no,
          product_model: item.product_model,
          length_mm: item.length_mm,
          customer_model: item.customer_model,
          data_category: item.data_category || 'A',
          operation: item.operation,
          standard_seconds: item.standard_seconds,
          incoming_qualified_quantity: item.incoming_qualified_quantity,
          qualified_quantity: item.qualified_quantity,
          defect_reason_1: item.defect_reason_1,
          defect_quantity_1: item.defect_quantity_1,
          defect_reason_2: item.defect_reason_2,
          defect_quantity_2: item.defect_quantity_2,
          outsource_defect_quantity: item.outsource_defect_quantity,
          outsource_defect_reason: item.outsource_defect_reason,
          outsource_unit: item.outsource_unit,
          setup_defect_quantity: item.setup_defect_quantity,
          setup_responsible: item.setup_responsible,
        },
      })
      continue
    }

    await addItem({
      ...item,
      data_category: item.data_category || 'A',
      order_id: orderId,
    })
  }
}
export function useProductionOrderSubmit({
  detailData,
  editingRecord,
  fixedEmployeeId,
  isEdit,
  isEmployeeView,
  resetFormState,
}: {
  detailData: ReturnType<typeof useProductionOrder>['data']
  editingRecord: ProductionOrder | null
  fixedEmployeeId?: string
  isEdit: boolean
  isEmployeeView: boolean
  resetFormState: () => void
}) {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const createMutation = useCreateProductionOrder()
  const updateMutation = useUpdateProductionOrder()
  const addItemMutation = useAddProductionOrderItem()
  const updateItemMutation = useUpdateProductionOrderItem()
  const deleteItemMutation = useDeleteProductionOrderItems()
  const handleFinish = useCallback(
    async (values: {
      order: Partial<ProductionOrder>
      items: {
        id?: string
        project_no: string
        product_model: string | null
        length_mm: number | null
        customer_model: string | null
        data_category?: ProductionOrderDataCategory
        operation: string
        standard_seconds: number
        incoming_qualified_quantity: number
        qualified_quantity: number
        defect_reason_1: string | null
        defect_quantity_1: number
        defect_reason_2: string | null
        defect_quantity_2: number
        outsource_defect_quantity: number
        outsource_defect_reason: string | null
        outsource_unit: string | null
        setup_defect_quantity: number
        setup_responsible: string | null
      }[]
    }) => {
      try {
        let orderId: string

        if (
          isEmployeeView
          && isAuditedRecord(detailData || editingRecord || undefined)
        ) {
          message.warning('已审核工单员工无法编辑')
          return
        }

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
              .map(item => item.id)
              .filter((id): id is string => Boolean(id)),
          )
          const deletedIds = existingItems
            .filter(item => !currentItemIds.has(item.id))
            .map(item => item.id)

          if (deletedIds.length > 0) {
            await deleteItemMutation.mutateAsync(deletedIds)
          }

          await syncOrderItemsSequentially({
            items: currentItems,
            orderId,
            addItem: addItemMutation.mutateAsync,
            updateItem: updateItemMutation.mutateAsync,
          })
          message.success('工单更新成功')
        }
        else {
          if (isEmployeeView) {
            const orderDate = values.order.order_date as string
            const employeeId
              = (values.order.employee_id as string) || fixedEmployeeId
            if (employeeId && orderDate) {
              const exists = await checkEmployeeOrderExistsOnDate(
                employeeId,
                orderDate,
              )
              if (exists) {
                message.error('该员工当天已有工单，同一天只能创建一张工单')
                return
              }
            }
          }

          const newOrder = await createMutation.mutateAsync(
            values.order as Parameters<typeof createMutation.mutateAsync>[0],
          )
          orderId = newOrder.id

          if (values.items.length > 0) {
            await syncOrderItemsSequentially({
              items: values.items,
              orderId,
              addItem: addItemMutation.mutateAsync,
              updateItem: updateItemMutation.mutateAsync,
            })
          }

          message.success('工单创建成功')
          queryClient.invalidateQueries({
            queryKey: ['production-orders-today-check'],
          })
        }

        resetFormState()
      }
      catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        }
        else {
          message.error('操作失败，请稍后重试')
        }
      }
    },
    [
      createMutation,
      fixedEmployeeId,
      isEdit,
      editingRecord,
      isEmployeeView,
      message,
      queryClient,
      resetFormState,
      updateMutation,
      addItemMutation,
      updateItemMutation,
      deleteItemMutation,
      detailData,
    ],
  )
  return handleFinish
}
