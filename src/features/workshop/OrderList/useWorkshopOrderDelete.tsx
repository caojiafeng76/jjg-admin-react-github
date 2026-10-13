import { useCallback } from 'react'
import type { Dispatch, Key, SetStateAction } from 'react'
import { App } from 'antd'

import { getWorkshopOrderDeleteBlockers } from '@/services/apiWorkshopOrders'
import { useDeleteWorkshopOrders } from './useWorkshopOrders'

interface UseWorkshopOrderDeleteOptions {
  selectedRowKeys: Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<Key[]>>
  viewerDenied: boolean
  viewerOperationTip: string
}

export function useWorkshopOrderDelete({
  selectedRowKeys,
  setSelectedRowKeys,
  viewerDenied,
  viewerOperationTip,
}: UseWorkshopOrderDeleteOptions) {
  const { message, modal } = App.useApp()
  const deleteMutation = useDeleteWorkshopOrders()

  const handleDelete = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    const ids = selectedRowKeys as string[]

    try {
      const blockers = await getWorkshopOrderDeleteBlockers(ids)

      if (blockers.length > 0) {
        modal.warning({
          title: '无法删除订单',
          okText: '知道了',
          width: 620,
          content: (
            <div className="space-y-3">
              <p>以下订单已被生产记录引用，请先处理关联数据：</p>
              <ul className="list-disc space-y-2 pl-5">
                {blockers.map((item) => (
                  <li key={item.orderId}>
                    <div className="font-medium text-slate-800">
                      {item.projectNo?.trim() || '未填写项目号'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {item.productionItemCount > 0 &&
                        `已关联 ${item.productionItemCount} 条生产工单明细`}
                      {item.productionItemCount > 0 &&
                        item.extrusionProductionItemCount > 0 &&
                        '，'}
                      {item.extrusionProductionItemCount > 0 &&
                        `已关联 ${item.extrusionProductionItemCount} 条挤压明细`}
                      {(item.productionItemCount > 0 ||
                        item.extrusionProductionItemCount > 0) &&
                      item.orderDates.length > 0
                        ? `，工单日期：${item.orderDates.slice(0, 3).join('、')}`
                        : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ),
        })
        return
      }

      modal.confirm({
        title: '删除订单',
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        content: (
          <div>
            <p>
              确定删除选中的 <strong>{ids.length}</strong> 个订单吗？
            </p>
            <p className="mt-2 text-xs text-red-500">
              此操作不可撤销，将同时删除订单及其所有明细。
            </p>
          </div>
        ),
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync(ids)
            message.success('删除成功')
            setSelectedRowKeys([])
          } catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error('删除失败，请稍后重试')
            }

            throw error
          }
        },
      })
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除失败，请稍后重试')
      }
    }
  }, [
    deleteMutation,
    message,
    modal,
    selectedRowKeys,
    setSelectedRowKeys,
    viewerDenied,
    viewerOperationTip,
  ])

  return { handleDelete, isDeleting: deleteMutation.isPending }
}
