import { MutationObserver } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '@/utils/errorHandler'
import { createQueryClient, isNonRetryableError } from './queryClient'

describe('createQueryClient', () => {
  it('calls a failed mutation exactly once by default', async () => {
    const queryClient = createQueryClient()
    const mutationFn = vi.fn().mockRejectedValue(new Error('request failed'))
    const observer = new MutationObserver(queryClient, { mutationFn })

    await expect(observer.mutate(undefined)).rejects.toThrow('request failed')

    expect(mutationFn).toHaveBeenCalledTimes(1)
    queryClient.clear()
  })

  it('does not retry deterministic errors', () => {
    const queryClient = createQueryClient()
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean

    expect(retry(0, new AppError('denied', '42501'))).toBe(false)
    expect(retry(0, new AppError('bad', 'PGRST116'))).toBe(false)
    expect(retry(0, new AppError('forbidden', undefined, 403))).toBe(false)
    expect(retry(0, new Error('Failed to fetch'))).toBe(true)
    expect(retry(2, new Error('Failed to fetch'))).toBe(false)
  })

  it('retries network errors only once because the fetch layer already retried', () => {
    const queryClient = createQueryClient()
    const retry = queryClient.getDefaultOptions().queries?.retry as (
      failureCount: number,
      error: unknown,
    ) => boolean
    const networkError = new AppError(
      '查询失败: TypeError: Failed to fetch',
      '',
    )
    const serverError = new AppError('upstream timeout', undefined, 502)

    expect(retry(0, networkError)).toBe(true)
    expect(retry(1, networkError)).toBe(false)
    expect(retry(1, serverError)).toBe(true)
    expect(retry(2, serverError)).toBe(false)
  })

  it('only throws query errors to the boundary when there is no cached data', () => {
    const queryClient = createQueryClient()
    const throwOnError = queryClient.getDefaultOptions().queries?.throwOnError as (
      error: unknown,
      query: { state: { data: unknown } },
    ) => boolean
    const error = new Error('boom')

    expect(throwOnError(error, { state: { data: undefined } })).toBe(true)
    expect(throwOnError(error, { state: { data: [] } })).toBe(false)
    const abort = new Error('aborted')
    abort.name = 'AbortError'
    expect(throwOnError(abort, { state: { data: undefined } })).toBe(false)
  })
})

describe('isNonRetryableError', () => {
  it('treats 408/429 and network errors as retryable', () => {
    expect(isNonRetryableError({ status: 429 })).toBe(false)
    expect(isNonRetryableError({ statusCode: 408 })).toBe(false)
    expect(isNonRetryableError({ code: '08006' })).toBe(false)
    expect(isNonRetryableError({ code: '23505' })).toBe(true)
    // PGRST0xx 为连接/schema 缓存类临时错误（503/504），应重试
    expect(isNonRetryableError({ code: 'PGRST002' })).toBe(false)
    expect(isNonRetryableError({ code: 'PGRST003' })).toBe(false)
    expect(isNonRetryableError({ code: 'PGRST116' })).toBe(true)
  })
})
