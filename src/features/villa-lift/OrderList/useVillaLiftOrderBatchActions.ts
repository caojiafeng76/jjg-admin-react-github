import { useCallback } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { App } from 'antd'
import dayjs from 'dayjs'

import type { VillaLiftMarkDateField } from '@/services/apiVillaLiftOrders'
import {
  useBatchDeleteVillaLiftOrders,
  useBatchMarkVillaLiftOrdersDate,
  useBatchUpdateVillaLiftOrdersStatus,
} from './useVillaLiftOrders'

interface UseVillaLiftOrderBatchActionsOptions {
  selectedRowKeys: string[]
  setSelectedRowKeys: Dispatch<SetStateAction<string[]>>
  viewerDenied: boolean
  viewerOperationTip: string
  canMarkFilm: boolean
}

export function useVillaLiftOrderBatchActions({
  selectedRowKeys,
  setSelectedRowKeys,
  viewerDenied,
  viewerOperationTip,
  canMarkFilm,
}: UseVillaLiftOrderBatchActionsOptions) {
  const { message } = App.useApp()
  const batchDeleteMutation = useBatchDeleteVillaLiftOrders()
  const batchStatusMutation = useBatchUpdateVillaLiftOrdersStatus()
  const batchMarkMutation = useBatchMarkVillaLiftOrdersDate()

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchDeleteMutation.mutateAsync(selectedRowKeys)
      message.success(`已删除 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchDeleteMutation,
    selectedRowKeys,
    setSelectedRowKeys,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  // 批量结案
  const handleBatchClose = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchStatusMutation.mutateAsync({
        ids: selectedRowKeys,
        status: 'closed',
      })
      message.success(`已结案 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchStatusMutation,
    selectedRowKeys,
    setSelectedRowKeys,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  // 批量反结案
  const handleBatchReopen = useCallback(async () => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return
    }

    try {
      await batchStatusMutation.mutateAsync({
        ids: selectedRowKeys,
        status: 'open',
      })
      message.success(`已复开 ${selectedRowKeys.length} 条订单`)
      setSelectedRowKeys([])
    } catch (err) {
      if (err instanceof Error) message.error(err.message)
    }
  }, [
    batchStatusMutation,
    selectedRowKeys,
    setSelectedRowKeys,
    message,
    viewerDenied,
    viewerOperationTip,
  ])

  // 标记完成日期（批量）
  const handleBatchMarkDate = useCallback(
    async (field: VillaLiftMarkDateField, label: string) => {
      const canBypassViewerGuard = field === 'film_date' && canMarkFilm

      if (viewerDenied && !canBypassViewerGuard) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) return
      try {
        await batchMarkMutation.mutateAsync({
          ids: selectedRowKeys,
          field,
          date: dayjs().format('YYYY-MM-DD'),
        })
        message.success(`已将 ${selectedRowKeys.length} 条订单标记为${label}`)
        setSelectedRowKeys([])
      } catch (err) {
        if (err instanceof Error) message.error(err.message)
      }
    },
    [
      batchMarkMutation,
      canMarkFilm,
      selectedRowKeys,
      setSelectedRowKeys,
      message,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  return {
    handleBatchDelete,
    handleBatchClose,
    handleBatchReopen,
    handleBatchMarkDate,
    isBatchDeleting: batchDeleteMutation.isPending,
    isBatchUpdatingStatus: batchStatusMutation.isPending,
    isBatchMarking: batchMarkMutation.isPending,
  }
}
