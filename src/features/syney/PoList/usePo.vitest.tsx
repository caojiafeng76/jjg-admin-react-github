import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppStore } from '@/store'
import { usePo } from './usePo'

const getSyneyPoMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/apiSyneyPos', () => ({
  default: getSyneyPoMock,
}))

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

describe('usePo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppStore.getState().setTableSelectedKeys([])
  })

  it('ignores a selected id that is not in the current order rows', async () => {
    useAppStore.getState().setTableSelectedKeys([10255])

    renderHook(() => usePo([759]), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(getSyneyPoMock).not.toHaveBeenCalled()
    })
  })
})
