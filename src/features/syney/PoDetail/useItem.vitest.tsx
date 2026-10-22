import type { Key, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TableSelectionProvider from '../TableSelectionProvider'
import { useItem } from './useItem'

const getItemByIdMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiSyneyPo', () => ({
  getItemById: getItemByIdMock,
}))

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

describe('useItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores a selected id that is not in the current detail rows', async () => {
    renderHook(() => useItem([101]), {
      wrapper: createWrapper([760]),
    })

    await waitFor(() => {
      expect(getItemByIdMock).not.toHaveBeenCalled()
    })
  })
})
