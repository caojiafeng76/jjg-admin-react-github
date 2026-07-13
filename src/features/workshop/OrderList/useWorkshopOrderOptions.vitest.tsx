import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getWorkshopOrderOptionsMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiWorkshopOrders', () => ({
  getWorkshopOrderOptions: getWorkshopOrderOptionsMock,
}))

import {
  useWorkshopOrderLengths,
  useWorkshopOrderModels,
  useWorkshopOrderProjectNos,
} from './useWorkshopOrders'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('workshop order option hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getWorkshopOrderOptionsMock.mockResolvedValue({
      projectNos: ['P-1', 'P-2'],
      productModels: ['M-1'],
      lengths: [900, 1200],
    })
  })

  it('shares one RPC-backed cache entry across all three option hooks', async () => {
    const { result } = renderHook(
      () => ({
        projectNos: useWorkshopOrderProjectNos(),
        models: useWorkshopOrderModels(),
        lengths: useWorkshopOrderLengths(),
      }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.projectNos.data).toEqual(['P-1', 'P-2'])
      expect(result.current.models.data).toEqual(['M-1'])
      expect(result.current.lengths.data).toEqual([900, 1200])
    })

    expect(getWorkshopOrderOptionsMock).toHaveBeenCalledOnce()
    expect(getWorkshopOrderOptionsMock).toHaveBeenCalledWith(
      expect.any(AbortSignal),
    )
  })
})
