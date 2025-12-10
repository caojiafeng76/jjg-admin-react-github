import { getSerialNo } from '@/services/apiSyneySerialNo'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { useEffect } from 'react'
import { isAbortError, queryConfig } from '@/config/queryClient'

export function useSerialNo() {
  const {
    data: serialNo,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['serialNo'],
    queryFn: getSerialNo,
    // 序列号数据变化较少，使用静态数据配置
    ...queryConfig.static,
  })

  // 错误处理：忽略 AbortError
  useEffect(() => {
    if (error && !isAbortError(error)) {
      message.error('获取序列号失败，请稍后重试')
    }
  }, [error])

  return {
    serialNo,
    isLoading,
    error,
  }
}
