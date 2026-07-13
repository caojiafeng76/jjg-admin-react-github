import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { syneyPoKeys } from '../queryKeys'
import { useDeletePo } from './useDeletePo'

const useMutationWithMessageMock = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useMutationWithMessage', () => ({
  useMutationWithMessage: useMutationWithMessageMock,
}))

describe('useDeletePo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMutationWithMessageMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      contextHolder: null,
    })
  })

  it('removes only the deleted detail cache entry', () => {
    const queryClient = new QueryClient()
    const removeQueries = vi.spyOn(queryClient, 'removeQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    renderHook(() => useDeletePo(), { wrapper })

    const config = useMutationWithMessageMock.mock.calls[0][0]
    config.onSuccess({ deletedIds: [759], deletedCount: 1 })

    expect(config.invalidateQueries).toEqual([syneyPoKeys.all])
    expect(removeQueries).toHaveBeenCalledWith({
      queryKey: syneyPoKeys.detail(759),
      exact: true,
    })
  })
})
