import { QueryKey, UseMutationOptions } from '@tanstack/react-query'

import { useMutationWithMessage } from './useMutationWithMessage'

/**
 * Mutation 配置选项
 */
export interface MutationWithInvalidationOptions<TData, TError, TVariables> {
  /**
   * Mutation 函数
   */
  mutationFn: (variables: TVariables) => Promise<TData>

  /**
   * 成功时需要失效的查询键数组
   */
  invalidateQueries?: QueryKey[]

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
 * 带查询失效功能的 Mutation Hook（静默版，不显示消息）
 *
 * 自动在成功时失效指定的查询缓存。实现复用 useMutationWithMessage，
 * 通过 showErrorMessage: false 抑制错误弹窗，保持无消息语义。
 *
 * @example
 * ```typescript
 * const { mutate, isPending } = useMutationWithInvalidation({
 *   mutationFn: createItem,
 *   invalidateQueries: [['items']],
 * })
 * ```
 */
export function useMutationWithInvalidation<TData, TError, TVariables>({
  mutationFn,
  invalidateQueries = [],
  onSuccess,
  onError,
  mutationOptions,
}: MutationWithInvalidationOptions<TData, TError, TVariables>) {
  return useMutationWithMessage<TData, TError, TVariables>({
    mutationFn,
    invalidateQueries,
    onSuccess,
    onError,
    mutationOptions,
    showErrorMessage: false,
  })
}
