import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PageErrorBoundary from './PageErrorBoundary'

vi.mock('@/contexts', () => ({
  useAuth: () => ({ role: 'admin' }),
}))

vi.spyOn(console, 'error').mockImplementation(() => {})

afterEach(cleanup)

function renderWithProviders(queryFn: () => Promise<string>) {
  const queryClient = new QueryClient()

  function FailingQueryPage() {
    const { data } = useQuery({
      queryKey: ['page-error-boundary-test'],
      queryFn,
      retry: false,
      throwOnError: true,
    })

    return <div>{data ?? '加载中'}</div>
  }

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <div>侧边菜单</div>
        <PageErrorBoundary>
          <FailingQueryPage />
        </PageErrorBoundary>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('PageErrorBoundary', () => {
  it('shows the error inside the page and keeps siblings rendered', async () => {
    renderWithProviders(() => Promise.reject(new Error('订单列表获取失败')))

    expect(await screen.findByText('页面加载失败')).toBeTruthy()
    expect(screen.getByText('订单列表获取失败')).toBeTruthy()
    expect(screen.getByText('侧边菜单')).toBeTruthy()
  })

  it('retries the failed query and recovers', async () => {
    const queryFn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('订单列表获取失败'))
      .mockResolvedValueOnce('订单数据')

    renderWithProviders(queryFn)

    fireEvent.click(await screen.findByRole('button', { name: /重试/ }))

    expect(await screen.findByText('订单数据')).toBeTruthy()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })
})
