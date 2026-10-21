import type {
  QueryKey,
  UseMutationOptions,
} from '@tanstack/react-query'

import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { App } from 'antd'

// Type for the Ant Design message API instance returned by App.useApp()
type MessageApi = ReturnType<typeof App.useApp>['message']

/**
 * 带消息提示和查询失效功能的 Mutation Hook 配置
 */
export interface MutationWithMessageOptions<TData, TError, TVariables> {
  /**
   * Mutation 函数
   */
  mutationFn: (variables: TVariables) => Promise<TData>

  /**
   * 成功时需要失效的查询键数组
   */
  invalidateQueries?: QueryKey[]

  /**
   * 成功消息（如果提供，会自动显示成功提示）
   */
  successMessage?: string | ((data: TData, variables: TVariables) => string)

  /**
   * 错误消息（如果提供，会自动显示错误提示）
   * 如果不提供，会使用错误对象的 message 属性
   */
  errorMessage?: string | ((error: TError, variables: TVariables) => string)

  /**
   * 外部提供的 Message API 实例（可选）
   * 如果不提供，会使用 App.useApp() 的全局 message（无需渲染 contextHolder）
   */
  messageApi?: MessageApi

  /**
   * 是否在失败时显示错误消息（默认 true）
   * 传 false 可抑制错误弹窗（例如静默失效场景）
   */
  showErrorMessage?: boolean

  /**
   * 成功时的回调
   */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>

  /**
   * 失败时的回调
   */
  onError?: (error: TError, variables: TVariables) => void

  /**
   * 其他 useMutation 选项
   */
  mutationOptions?: Omit<
    UseMutationOptions<TData, TError, TVariables>,
    'mutationFn' | 'onSuccess' | 'onError'
  >
}

/**
 * 带消息提示和查询失效功能的 Mutation Hook
 *
 * 自动在成功时失效指定的查询缓存并显示成功消息
 * 自动在失败时显示错误消息
 *
 * @example
 * ```typescript
 * const { mutate, isPending } = useMutationWithMessage({
 *   mutationFn: createItem,
 *   invalidateQueries: [['items']],
 *   successMessage: '创建成功',
 *   errorMessage: '创建失败',
 * })
 * ```
 */
export function useMutationWithMessage<TData, TError, TVariables>({
  mutationFn,
  invalidateQueries = [],
  successMessage,
  errorMessage,
  messageApi: externalMessageApi,
  showErrorMessage = true,
  onSuccess,
  onError,
  mutationOptions,
}: MutationWithMessageOptions<TData, TError, TVariables>) {
  const queryClient = useQueryClient()
  const { message: appMessageApi } = App.useApp()

  // 优先使用外部提供的 messageApi；否则使用 <AntdApp> 提供的全局实例
  const messageApi = externalMessageApi || appMessageApi

  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn,
    ...mutationOptions,
    onSuccess: async (data, variables) => {
      await Promise.all(
        invalidateQueries.map(queryKey =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      )

      await onSuccess?.(data, variables)

      if (successMessage) {
        const msg
          = typeof successMessage === 'function'
            ? successMessage(data, variables)
            : successMessage
        messageApi.success(msg)
      }
    },
    onError: (error, variables) => {
      // 显示错误消息
      if (showErrorMessage) {
        const msg
          = typeof errorMessage === 'function'
            ? errorMessage(error, variables)
            : errorMessage
              || (error instanceof Error ? error.message : '操作失败，请稍后重试')
        messageApi.error(msg)
      }

      // 调用用户自定义的错误回调
      onError?.(error, variables)
    },
  })

  return {
    ...mutation,
    /**
     * @deprecated 消息已通过 App.useApp() 全局渲染，无需再挂载 contextHolder；
     * 保留字段仅为兼容旧调用方，恒为 null
     */
    contextHolder: null,
  }
}
