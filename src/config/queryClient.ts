import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * 检查是否为 AbortError（请求被取消）
 */
export function isAbortError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    (('name' in error && error.name === 'AbortError') ||
      ('message' in error &&
        typeof (error as { message: unknown }).message === 'string' &&
        (error as { message: string }).message.includes('aborted')))
  )
}

/**
 * 默认查询选项
 */
const defaultQueryOptions: DefaultOptions['queries'] = {
  // 数据在 5 分钟内视为新鲜，不会重新获取
  staleTime: 1000 * 60 * 5,
  
  // 缓存时间：10 分钟（原 cacheTime，v5 中改为 gcTime）
  gcTime: 1000 * 60 * 10,
  
  // 重试策略
  retry: (failureCount, error) => {
    // 如果是 AbortError，不重试
    if (isAbortError(error)) {
      return false
    }
    // 最多重试 2 次
    return failureCount < 2
  },
  
  // 重试延迟：指数退避策略
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  // 窗口聚焦时不自动重新获取（避免用户切换标签页时触发不必要的请求）
  refetchOnWindowFocus: false,
  
  // 网络重连时不自动重新获取
  refetchOnReconnect: false,
  
  // 挂载时不自动重新获取（如果数据仍然新鲜）
  refetchOnMount: true,
  
  // 错误处理：忽略 AbortError
  throwOnError: (error) => !isAbortError(error),
}

/**
 * 默认变更选项
 */
const defaultMutationOptions: DefaultOptions['mutations'] = {
  // 变更失败时重试 1 次
  retry: 1,
  
  // 重试延迟
  retryDelay: 1000,
  
  // 不抛出错误，让错误通过 onError 回调处理
  // 这样可以避免未捕获的错误导致应用崩溃
  throwOnError: false,
}

/**
 * 创建并配置 QueryClient
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: defaultQueryOptions,
      mutations: defaultMutationOptions,
    },
  })
}

/**
 * 查询配置预设
 * 用于不同场景的查询配置
 * 注意：placeholderData 需要在 useQuery 中单独设置，使用 keepPreviousData
 */
export const queryConfig = {
  /**
   * 列表查询配置（分页数据）
   * - 较短的 staleTime，因为列表数据变化频繁
   * - 注意：需要在 useQuery 中添加 placeholderData: keepPreviousData
   */
  list: {
    staleTime: 1000 * 30, // 30 秒
    gcTime: 1000 * 60 * 5, // 5 分钟
  },
  
  /**
   * 详情查询配置（单个资源）
   * - 较长的 staleTime，因为详情数据变化较少
   */
  detail: {
    staleTime: 1000 * 60 * 10, // 10 分钟
    gcTime: 1000 * 60 * 30, // 30 分钟
  },
  
  /**
   * 实时数据查询配置（需要频繁更新）
   * - 很短的 staleTime
   */
  realtime: {
    staleTime: 0, // 总是重新获取
    gcTime: 1000 * 60, // 1 分钟
    refetchInterval: 1000 * 30, // 每 30 秒自动重新获取
  },
  
  /**
   * 静态数据查询配置（很少变化的数据）
   * - 很长的 staleTime
   */
  static: {
    staleTime: 1000 * 60 * 60, // 1 小时
    gcTime: 1000 * 60 * 60 * 24, // 24 小时
  },
} as const

