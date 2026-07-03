import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppStore } from '@/store'
import { useItem } from './useItem'

const getItemByIdMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiSyneyPo', () => ({
  getItemById: getItemByIdMock,
}))

function createWrapper() {
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
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.getState().setTableSelectedKeys([])
  })

  it('ignores a selected id that is not in the current detail rows', async () => {
    useAppStore.getState().setTableSelectedKeys([760])

    renderHook(() => useItem([101]), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(getItemByIdMock).not.toHaveBeenCalled()
    })
  })
})
