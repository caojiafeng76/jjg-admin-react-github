import type { Key, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TableSelectionProvider from '../TableSelectionProvider'
import { usePo } from './usePo'

const { getSyneyPoDetailMock, messageErrorMock } = vi.hoisted(() => ({
  getSyneyPoDetailMock: vi.fn(),
  messageErrorMock: vi.fn(),
}))

vi.mock('@/services/apiSyneyPos', () => ({
  getSyneyPoDetail: getSyneyPoDetailMock,
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({ message: { error: messageErrorMock } }),
    },
  }
})

function createWrapper(selectedKeys: Key[] = []) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TableSelectionProvider initialSelectedKeys={selectedKeys}>
          {children}
        </TableSelectionProvider>
      </QueryClientProvider>
    )
  }
}

describe('usePo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores a selected id that is not in the current order rows', async () => {
    renderHook(() => usePo([759]), {
      wrapper: createWrapper([10255]),
    })

    await waitFor(() => {
      expect(getSyneyPoDetailMock).not.toHaveBeenCalled()
    })
  })

  it('does not fetch when disabled even if selection belongs to current order rows', async () => {
    renderHook(() => usePo([759], false), {
      wrapper: createWrapper([759]),
    })

    await waitFor(() => {
      expect(getSyneyPoDetailMock).not.toHaveBeenCalled()
    })
  })

  it('fetches detail via getSyneyPoDetail with AbortSignal when selection matches current rows', async () => {
    const detail = { id: 759, No: 'P2026', items: [] }
    getSyneyPoDetailMock.mockResolvedValueOnce(detail)

    const { result } = renderHook(() => usePo([759, 760], true), {
      wrapper: createWrapper([759]),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual(detail)
    })
    expect(getSyneyPoDetailMock).toHaveBeenCalledOnce()
    expect(getSyneyPoDetailMock).toHaveBeenCalledWith(
      '759',
      expect.any(AbortSignal),
    )
  })

  it('shows toast on query error and stays silent on AbortError', async () => {
    getSyneyPoDetailMock.mockRejectedValueOnce(new Error('network error'))

    renderHook(() => usePo([759], true), {
      wrapper: createWrapper([759]),
    })

    await waitFor(() => {
      expect(messageErrorMock).toHaveBeenCalledTimes(1)
    })

    vi.clearAllMocks()
    getSyneyPoDetailMock.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))

    renderHook(() => usePo([759], true), {
      wrapper: createWrapper([759]),
    })

    await waitFor(() => {
      expect(getSyneyPoDetailMock).toHaveBeenCalledOnce()
    })
    expect(messageErrorMock).not.toHaveBeenCalled()
  })
})
