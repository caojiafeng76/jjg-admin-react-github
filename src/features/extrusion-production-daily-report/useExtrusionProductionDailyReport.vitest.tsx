import type { PropsWithChildren } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { queryConfig } from '@/config/queryClient'

const mocks = vi.hoisted(() => ({
  getDailyReport: vi.fn().mockResolvedValue({ rows: [], total: 0 }),
}))

vi.mock('@/services/apiExtrusionProductionDailyReport', () => ({
  getExtrusionProductionDailyReport: mocks.getDailyReport,
}))

import {
  EXTRUSION_PRODUCTION_DAILY_REPORT_KEY,
  useExtrusionProductionDailyReport,
} from './useExtrusionProductionDailyReport'

describe('useExtrusionProductionDailyReport', () => {
  it('keeps the prior page, applies list caching, and forwards the query signal', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const queryKey = [
      EXTRUSION_PRODUCTION_DAILY_REPORT_KEY,
      { page: 2, pageSize: 20, projectNo: 'SO-1' },
    ]

    renderHook(
      () =>
        useExtrusionProductionDailyReport({
          page: 2,
          pageSize: 20,
          filters: { projectNo: 'SO-1' },
        }),
      { wrapper },
    )

    await waitFor(() => expect(mocks.getDailyReport).toHaveBeenCalledOnce())
    expect(mocks.getDailyReport).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      filters: { projectNo: 'SO-1' },
      signal: expect.any(AbortSignal),
    })

    const query = queryClient.getQueryCache().find({ queryKey })
    const options = query?.options as {
      placeholderData?: unknown
      staleTime?: number
      gcTime?: number
    }
    expect(options.placeholderData).toBe(keepPreviousData)
    expect(options.staleTime).toBe(queryConfig.list.staleTime)
    expect(options.gcTime).toBe(queryConfig.list.gcTime)
    queryClient.clear()
  })
})
