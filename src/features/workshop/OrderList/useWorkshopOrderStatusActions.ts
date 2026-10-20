import type { Dispatch, Key, SetStateAction } from 'react'
import type { WorkshopOrderStatus } from './orderStatus'
import type { WorkshopOrder } from './types'

import type { useUpdateWorkshopOrder } from './useWorkshopOrders'
import { App } from 'antd'
import { useCallback } from 'react'
import {
  useBatchUpdateWorkshopOrderStatuses,

} from './useWorkshopOrders'

interface UseWorkshopOrderStatusActionsOptions {
  activeOrder: WorkshopOrder | null
  setActiveOrder: Dispatch<SetStateAction<WorkshopOrder | null>>
  selectedRowKeys: Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<Key[]>>
  updateMutation: ReturnType<typeof useUpdateWorkshopOrder>
  viewerDenied: boolean
  viewerOperationTip: string
}

export function useWorkshopOrderStatusActions({
  activeOrder,
  setActiveOrder,
  selectedRowKeys,
  setSelectedRowKeys,
  updateMutation,
  viewerDenied,
  viewerOperationTip,
}: UseWorkshopOrderStatusActionsOptions) {
  const { message, modal } = App.useApp()
  const batchStatusMutation = useBatchUpdateWorkshopOrderStatuses()

  const handleStatusChange = useCallback(
    async (nextStatus: WorkshopOrderStatus) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (!activeOrder?.id) {
        return
      }

      const applyUpdate = async () => {
        const closedAt
          = nextStatus === '已结案' ? new Date().toISOString() : null

        await updateMutation.mutateAsync({
          id: activeOrder.id!,
          values: {
            ...activeOrder,
            status: nextStatus,
            closed_at: closedAt,
          },
        })
        setActiveOrder(current =>
          current
            ? { ...current, status: nextStatus, closed_at: closedAt }
            : current,
        )
        message.success(
          nextStatus === '已结案' ? '订单已结案' : '订单状态已改为生产中',
        )
      }

      if (nextStatus === '已结案') {
        modal.confirm({
          title: '确认结案',
          content: `确定将订单 ${activeOrder.project_no || ''} 标记为已结案吗？结案后新增生产工单时将无法再关联该订单。`,
          okText: '确认结案',
          cancelText: '取消',
          onOk: applyUpdate,
        })
        return
      }

      await applyUpdate()
    },
    [
      activeOrder,
      message,
      modal,
      setActiveOrder,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleBatchStatusChange = useCallback(
    (nextStatus: WorkshopOrderStatus) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要改为${nextStatus}的订单`)
        return
      }

      const applyUpdate = async () => {
        const closedAt
          = nextStatus === '已结案' ? new Date().toISOString() : null

        await batchStatusMutation.mutateAsync({
          ids: selectedRowKeys as string[],
          status: nextStatus,
          closed_at: closedAt,
        })

        if (activeOrder?.id && selectedRowKeys.includes(activeOrder.id)) {
          setActiveOrder(current =>
            current
              ? { ...current, status: nextStatus, closed_at: closedAt }
              : current,
          )
        }

        message.success(
          nextStatus === '已结案' ? '批量结案成功' : '批量改为生产中成功',
        )
        setSelectedRowKeys([])
      }

      modal.confirm({
        title: nextStatus === '已结案' ? '批量结案订单' : '批量改为生产中',
        content:
          nextStatus === '已结案'
            ? `确定将选中的 ${selectedRowKeys.length} 个订单标记为已结案吗？结案后新增生产工单时将无法再关联这些订单。`
            : `确定将选中的 ${selectedRowKeys.length} 个订单标记为生产中吗？`,
        okText: '确定',
        cancelText: '取消',
        okButtonProps:
          nextStatus === '已结案'
            ? { danger: true, disabled: viewerDenied }
            : { disabled: viewerDenied },
        onOk: async () => {
          try {
            await applyUpdate()
          }
          catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            }
            else {
              message.error(
                nextStatus === '已结案'
                  ? '批量结案失败，请稍后重试'
                  : '批量改为生产中失败，请稍后重试',
              )
            }
          }
        },
      })
    },
    [
      activeOrder,
      batchStatusMutation,
      message,
      modal,
      selectedRowKeys,
      setActiveOrder,
      setSelectedRowKeys,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  return {
    handleStatusChange,
    handleBatchStatusChange,
    isBatchUpdating: batchStatusMutation.isPending,
  }
}
