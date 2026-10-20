import type { Dispatch, Key, SetStateAction } from 'react'
import { App } from 'antd'
import { useCallback } from 'react'

import { getEmployeeDeleteBlockers } from '@/services/apiEmployees'
import { useDeleteEmployees } from './useEmployees'

interface UseEmployeeDeleteOptions {
  selectedRowKeys: Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<Key[]>>
}

export function useEmployeeDelete({
  selectedRowKeys,
  setSelectedRowKeys,
}: UseEmployeeDeleteOptions) {
  const { message, modal } = App.useApp()
  const deleteMutation = useDeleteEmployees()

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    const ids = selectedRowKeys as string[]

    try {
      const blockers = await getEmployeeDeleteBlockers(ids)

      if (blockers.length > 0) {
        modal.warning({
          title: '无法删除员工',
          okText: '知道了',
          width: 560,
          content: (
            <div className="space-y-3">
              <p>以下员工已被生产工单引用，请先处理关联数据：</p>
              <ul className="list-disc space-y-2 pl-5">
                {blockers.map(item => (
                  <li key={item.employeeId}>
                    <div className="font-medium text-slate-800">
                      {item.employeeName}
                    </div>
                    <div className="text-sm text-slate-500">
                      已关联 {item.productionOrderCount} 张生产工单
                      {item.orderDates.length > 0
                        ? `，日期：${item.orderDates.slice(0, 3).join('、')}`
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
        title: '删除员工',
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        content: (
          <div>
            <p>
              确定删除选中的 <strong>{ids.length}</strong> 个员工吗？
            </p>
            <p className="mt-2 text-xs text-red-500">此操作不可撤销。</p>
          </div>
        ),
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync(ids)
            message.success('删除成功')
            setSelectedRowKeys([])
          }
          catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            }
            else {
              message.error('删除失败，请稍后重试')
            }

            throw error
          }
        },
      })
    }
    catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      else {
        message.error('删除失败，请稍后重试')
      }
    }
  }, [deleteMutation, message, modal, selectedRowKeys, setSelectedRowKeys])

  return { handleDelete, isDeleting: deleteMutation.isPending }
}
