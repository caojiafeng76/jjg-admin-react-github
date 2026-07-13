import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMutationWithInvalidation } from './useMutationWithInvalidation'
import { useMutationWithMessage } from './useMutationWithMessage'

const internalMessageApi = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('antd', () => ({
  message: {
    useMessage: () => [internalMessageApi, null],
  },
}))

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('shared mutation invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('invalidates keys in parallel and waits before resolving', async () => {
    const queryClient = new QueryClient()
    const first = deferred()
    const second = deferred()
    const onSuccess = vi.fn()
    let call = 0

    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(() => {
      call += 1
      return call === 1 ? first.promise : second.promise
    })

    const { result } = renderHook(
      () =>
        useMutationWithInvalidation({
          mutationFn: async (value: string) => value,
          invalidateQueries: [['first'], ['second']],
          onSuccess,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let mutationPromise!: Promise<string>
    act(() => {
      mutationPromise = result.current.mutateAsync('done')
    })

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(2)
    })
    expect(result.current.isPending).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()

    await act(async () => {
      first.resolve()
      await Promise.resolve()
    })
    expect(result.current.isPending).toBe(true)
    expect(onSuccess).not.toHaveBeenCalled()

    await act(async () => {
      second.resolve()
      await mutationPromise
    })

    expect(onSuccess).toHaveBeenCalledWith('done', 'done')
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('waits for async success callbacks before showing a success message', async () => {
    const queryClient = new QueryClient()
    const invalidation = deferred()
    const callback = deferred()
    const events: string[] = []
    const messageApi = {
      error: vi.fn(),
      success: vi.fn(() => {
        events.push('message')
      }),
    }

    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(
      () => invalidation.promise,
    )

    const { result } = renderHook(
      () =>
        useMutationWithMessage({
          mutationFn: async () => 'created',
          invalidateQueries: [['items']],
          onSuccess: async () => {
            events.push('callback')
            await callback.promise
            events.push('callback-complete')
          },
          successMessage: '创建成功',
          messageApi: messageApi as never,
        }),
      { wrapper: createWrapper(queryClient) },
    )

    let mutationPromise!: Promise<string>
    act(() => {
      mutationPromise = result.current.mutateAsync(undefined)
    })

    await waitFor(() => {
      expect(queryClient.invalidateQueries).toHaveBeenCalledOnce()
    })
    expect(events).toEqual([])

    await act(async () => {
      invalidation.resolve()
      await Promise.resolve()
    })
    expect(events).toEqual(['callback'])
    expect(result.current.isPending).toBe(true)

    await act(async () => {
      callback.resolve()
      await mutationPromise
    })

    expect(events).toEqual(['callback', 'callback-complete', 'message'])
    expect(messageApi.success).toHaveBeenCalledWith('创建成功')
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})
