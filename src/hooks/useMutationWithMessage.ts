import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { QueryKey } from '@tanstack/react-query'
import { message } from 'antd'
import { useMemo } from 'react'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

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
   * 如果不提供，会使用内部的 message.useMessage()
   */
  messageApi?: MessageApi
  
  /**
   * 成功时的回调
   */
  onSuccess?: (data: TData, variables: TVariables) => void
  
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
 * const { mutate, isPending, contextHolder } = useMutationWithMessage({
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
  onSuccess,
  onError,
  mutationOptions,
}: MutationWithMessageOptions<TData, TError, TVariables>) {
  const queryClient = useQueryClient()
  const [internalMessageApi, contextHolder] = message.useMessage()
  
  // 使用外部提供的 messageApi 或内部的
  const messageApi = useMemo(
    () => externalMessageApi || internalMessageApi,
    [externalMessageApi, internalMessageApi],
  )

  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables) => {
      // 失效指定的查询缓存
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey })
      })
      
      // 显示成功消息
      if (successMessage) {
        const msg =
          typeof successMessage === 'function'
            ? successMessage(data, variables)
            : successMessage
        messageApi.success(msg)
      }
      
      // 调用用户自定义的成功回调
      onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      // 显示错误消息
      const msg =
        typeof errorMessage === 'function'
          ? errorMessage(error, variables)
          : errorMessage ||
            (error instanceof Error ? error.message : '操作失败，请稍后重试')
      messageApi.error(msg)
      
      // 调用用户自定义的错误回调
      onError?.(error, variables)
    },
  })

  return {
    ...mutation,
    // 如果使用外部 messageApi，不需要返回 contextHolder
    contextHolder: externalMessageApi ? null : contextHolder,
  }
}

