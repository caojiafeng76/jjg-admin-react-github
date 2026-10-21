import { useQuery } from '@tanstack/react-query'
import { App } from 'antd'
import { useEffect } from 'react'
import { isAbortError, queryConfig } from '@/config/queryClient'
import { getSerialNo } from '@/services/apiSyneySerialNo'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { syneyPoKeys } from '../queryKeys'

export function useSerialNo() {
  const { message } = App.useApp()
  const {
    data: serialNo,
    isLoading,
    error,
  } = useQuery({
    queryKey: syneyPoKeys.serialNumbers(),
    queryFn: getSerialNo,
    // 序列号数据变化较少，使用静态数据配置
    ...queryConfig.static,
    throwOnError: false,
  })

  // 错误处理：忽略 AbortError
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error(getUserErrorMessage(error, '序列号获取失败，请稍后重试'))
    }
  }, [error, message])

  return {
    serialNo,
    isLoading,
    error,
  }
}
