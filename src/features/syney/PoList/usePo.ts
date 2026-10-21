import { useQuery } from '@tanstack/react-query'
import { App } from 'antd'
import { useEffect } from 'react'
import { isAbortError, queryConfig } from '@/config/queryClient'
import { getSyneyPoDetail } from '@/services/apiSyneyPo'
import { useAppStore } from '@/store'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { syneyPoKeys } from '../queryKeys'

export function usePo(validPoIds?: number[]) {
  const { message } = App.useApp()
  const tableSelectedKeys = useAppStore(state => state.tableSelectedKeys)

  const id = tableSelectedKeys[0] || ''
  const numericId = Number(id)
  const isSelectedPoInCurrentList
    = validPoIds === undefined || validPoIds.includes(numericId)

  const { data, error, isLoading } = useQuery({
    queryKey: syneyPoKeys.detail(String(id)),
    enabled: !!id && isSelectedPoInCurrentList,
    queryFn: ({ signal }) => getSyneyPoDetail(id.toString(), signal),
    ...queryConfig.detail,
    // 选中订单详情仅用于工具栏操作，失败时 toast 提示即可，不切换整页错误
    throwOnError: false,
  })

  // 错误处理：忽略 AbortError
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error(getUserErrorMessage(error, '订单详情获取失败，请稍后重试'))
    }
  }, [error, message])

  return { data, isLoading }
}
