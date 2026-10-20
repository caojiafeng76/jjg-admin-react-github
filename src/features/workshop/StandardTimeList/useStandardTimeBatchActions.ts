import type { Dispatch, SetStateAction } from 'react'
import type { StandardTime } from '@/services/apiStandardTimes'
import { App } from 'antd'
import { useCallback } from 'react'

import {
  useDeleteStandardTimes,
  useUpdateStandardTimesLastProcess,
} from './useStandardTimes'

export interface UseStandardTimeBatchActionsOptions {
  isTeamLeaderMode: boolean
  selectedRowKeys: React.Key[]
  setSelectedRowKeys: Dispatch<SetStateAction<React.Key[]>>
  setActiveRecord: Dispatch<SetStateAction<StandardTime | null>>
}

/** 已选成本核算的批量删除与批量设/取消末道 */
export function useStandardTimeBatchActions({
  isTeamLeaderMode,
  selectedRowKeys,
  setSelectedRowKeys,
  setActiveRecord,
}: UseStandardTimeBatchActionsOptions) {
  const { message, modal } = App.useApp()
  const lastProcessMutation = useUpdateStandardTimesLastProcess()
  const deleteMutation = useDeleteStandardTimes()

  const handleDelete = useCallback(async () => {
    if (isTeamLeaderMode) {
      message.warning('班组长不能删除成本核算')
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('成本核算删除成功')
      setSelectedRowKeys([])
    }
    catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      }
      else {
        message.error('删除成本核算失败，请稍后重试')
      }
    }
  }, [deleteMutation, isTeamLeaderMode, message, selectedRowKeys, setSelectedRowKeys])

  const handleBatchLastProcess = useCallback(
    (isLastProcess: boolean) => {
      if (isTeamLeaderMode) {
        message.warning('班组长不能批量修改末道状态')
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning('请选择至少一条成本核算数据')
        return
      }

      const selectedIds = selectedRowKeys.map(String)
      const actionLabel = isLastProcess ? '设为末道' : '取消末道'

      modal.confirm({
        title: actionLabel,
        content: `确认将已选 ${selectedIds.length} 条成本核算${actionLabel}？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            await lastProcessMutation.mutateAsync({
              ids: selectedIds,
              isLastProcess,
            })
            message.success(`已${actionLabel} ${selectedIds.length} 条成本核算`)
            setActiveRecord(current =>
              current?.id && selectedIds.includes(current.id)
                ? { ...current, is_last_process: isLastProcess }
                : current,
            )
            setSelectedRowKeys([])
          }
          catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            }
            else {
              message.error('更新末道状态失败，请稍后重试')
            }
          }
        },
      })
    },
    [
      isTeamLeaderMode,
      lastProcessMutation,
      message,
      modal,
      selectedRowKeys,
      setActiveRecord,
      setSelectedRowKeys,
    ],
  )

  return {
    handleDelete,
    handleBatchLastProcess,
    isDeleting: deleteMutation.isPending,
    isUpdatingLastProcess: lastProcessMutation.isPending,
  }
}
