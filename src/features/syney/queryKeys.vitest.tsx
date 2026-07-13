import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppStore } from '@/store'
import { useDetail } from './PoDetail/useDetail'
import { usePo } from './PoList/usePo'
import { usePos } from './PoList/usePos'
import { syneyPoKeys } from './queryKeys'

const { getSyneyPoDetailMock, getSyneyPoMock, getSyneyPosMock } = vi.hoisted(
  () => ({
    getSyneyPoDetailMock: vi.fn(),
    getSyneyPoMock: vi.fn(),
    getSyneyPosMock: vi.fn(),
  }),
)

vi.mock('@/services/apiSyneyPo', () => ({
  getSyneyPoDetail: getSyneyPoDetailMock,
}))

vi.mock('@/services/apiSyneyPos', () => ({
  default: getSyneyPoMock,
  getSyneyPos: getSyneyPosMock,
}))

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')

  return {
    ...actual,
    useParams: () => ({ PoId: '759' }),
    useSearchParams: () => [
      new URLSearchParams(
        'page=2&pageSize=20&Status=%20pending%20&startDate=%202026-07-01%20&endDate=%202026-07-31%20&SONo=%20SO-1%20',
      ),
    ],
  }
})

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
    },
  }
})

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

describe('Syney PO query keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.getState().setTableSelectedKeys([])
    getSyneyPoMock.mockResolvedValue({ id: 759 })
    getSyneyPoDetailMock.mockResolvedValue({
      id: 759,
      items: [{ id: 101, PartNo: 'XN2808EB' }],
    })
    getSyneyPosMock.mockResolvedValue({ syneyPos: [], count: 0 })
  })

  it('shares the complete detail contract between both detail hooks', async () => {
    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient)
    useAppStore.getState().setTableSelectedKeys([759])

    const listDetail = renderHook(() => usePo([759]), { wrapper })

    await waitFor(() => {
      expect(listDetail.result.current.data?.items).toEqual([
        { id: 101, PartNo: 'XN2808EB' },
      ])
    })

    expect(getSyneyPoMock).not.toHaveBeenCalled()
    expect(getSyneyPoDetailMock).toHaveBeenCalledOnce()
    expect(getSyneyPoDetailMock).toHaveBeenCalledWith(
      '759',
      expect.any(AbortSignal),
    )

    const routeDetail = renderHook(() => useDetail(), { wrapper })

    expect(routeDetail.result.current.items).toEqual([
      { id: 101, PartNo: 'XN2808EB' },
    ])
    expect(getSyneyPoDetailMock).toHaveBeenCalledOnce()

    expect(
      queryClient
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey),
    ).toEqual([syneyPoKeys.detail(759)])
  })

  it('forwards the cancellation signal from the detail route', async () => {
    renderHook(() => useDetail(), {
      wrapper: createWrapper(createQueryClient()),
    })

    await waitFor(() => {
      expect(getSyneyPoDetailMock).toHaveBeenCalledWith(
        '759',
        expect.any(AbortSignal),
      )
    })
  })

  it('normalizes list filters and request parameters consistently', async () => {
    const base = syneyPoKeys.list({
      page: 2,
      pageSize: 20,
      status: ' pending ',
      startDate: ' 2026-07-01 ',
      endDate: ' 2026-07-31 ',
      keyword: ' SO-1 ',
    })

    expect(base).toEqual(
      syneyPoKeys.list({
        page: 2,
        pageSize: 20,
        status: 'pending',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        keyword: 'SO-1',
      }),
    )
    expect(base).not.toEqual(
      syneyPoKeys.list({
        page: 3,
        pageSize: 20,
        status: 'pending',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        keyword: 'SO-1',
      }),
    )

    const queryClient = createQueryClient()
    renderHook(() => usePos(), { wrapper: createWrapper(queryClient) })

    expect(
      queryClient.getQueryCache().find({ queryKey: base, exact: true }),
    ).toBeDefined()
    await waitFor(() => {
      expect(getSyneyPosMock).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 20,
          Status: 'pending',
          startDate: '2026-07-01',
          endDate: '2026-07-31',
          SONo: 'SO-1',
          signal: expect.any(AbortSignal),
        }),
      )
    })
  })

  it('stabilizes selected keys regardless of numeric id order', () => {
    expect(syneyPoKeys.selected([10, '2', 1])).toEqual(
      syneyPoKeys.selected(['1', 10, '2']),
    )
  })

  it('invalidates list, detail, and selected caches from the root key', async () => {
    const queryClient = createQueryClient()
    const keys = [
      syneyPoKeys.list({ page: 1, pageSize: 10 }),
      syneyPoKeys.detail(759),
      syneyPoKeys.selected([759, 760]),
    ] as const

    keys.forEach((queryKey) => queryClient.setQueryData(queryKey, 'cached'))
    await queryClient.invalidateQueries({ queryKey: syneyPoKeys.all })

    keys.forEach((queryKey) => {
      expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true)
    })
  })
})
