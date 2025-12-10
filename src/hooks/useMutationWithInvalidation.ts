import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { QueryKey } from '@tanstack/react-query'

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
 * 带查询失效功能的 Mutation Hook
 * 
 * 自动在成功时失效指定的查询缓存
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
  const queryClient = useQueryClient()

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    ...mutationOptions,
    onSuccess: (data, variables) => {
      // 失效指定的查询缓存
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey })
      })
      
      // 调用用户自定义的成功回调
      onSuccess?.(data, variables)
    },
    onError: (error, variables) => {
      // 调用用户自定义的错误回调
      onError?.(error, variables)
    },
  })
}

