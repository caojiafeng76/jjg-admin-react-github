import type { Key, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TableSelectionProvider from '../TableSelectionProvider'
import { usePo } from './usePo'

const getSyneyPoMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiSyneyPos', () => ({
  default: getSyneyPoMock,
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')

  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({ message: { error: vi.fn() } }),
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
      expect(getSyneyPoMock).not.toHaveBeenCalled()
    })
  })
})
