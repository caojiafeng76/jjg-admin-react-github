import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCreatePackagingEmployee,
  useDeletePackagingEmployee,
  usePackagingEmployeeList,
  useUpdatePackagingEmployee,
} from './EmployeeList/useEmployees'
import { packagingProcessKeys } from './queryKeys'
import { usePackagingEmployeeOptions } from './WorkOrderList/useWorkOrders'

const {
  getPackagingEmployeeListMock,
  getPackagingEmployeeOptionsMock,
  useMutationWithInvalidationMock,
} = vi.hoisted(() => ({
  getPackagingEmployeeListMock: vi.fn(),
  getPackagingEmployeeOptionsMock: vi.fn(),
  useMutationWithInvalidationMock: vi.fn(),
}))

vi.mock('@/services/apiPackagingEmployees', () => ({
  createPackagingEmployee: vi.fn(),
  deletePackagingEmployee: vi.fn(),
  getPackagingEmployeeList: getPackagingEmployeeListMock,
  getPackagingEmployeeOptions: getPackagingEmployeeOptionsMock,
  updatePackagingEmployee: vi.fn(),
}))

vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: useMutationWithInvalidationMock,
}))

vi.mock('@/services/apiPackagingWorkOrders', () => ({
  createPackagingWorkOrder: vi.fn(),
  deletePackagingWorkOrder: vi.fn(),
  getPackagingWorkOrderList: vi.fn(),
  updatePackagingWorkOrder: vi.fn(),
}))

vi.mock('@/services/apiProcessStandards', () => ({
  getSalesOrdersProjectNos: vi.fn(),
}))

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('packaging employee query keys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getPackagingEmployeeListMock.mockResolvedValue({ items: [], total: 0 })
    getPackagingEmployeeOptionsMock.mockResolvedValue({ items: [] })
    useMutationWithInvalidationMock.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  it('uses the employee list factory key and forwards the cancellation signal', async () => {
    const queryClient = createQueryClient()
    const queryKey = packagingProcessKeys.employees.list({
      page: 2,
      pageSize: 20,
      keyword: ' 张三 ',
    })

    renderHook(
      () =>
        usePackagingEmployeeList({
          page: 2,
          pageSize: 20,
          searchParams: { keyword: ' 张三 ' },
        }),
      { wrapper: createWrapper(queryClient) },
    )

    expect(
      queryClient.getQueryCache().find({ queryKey, exact: true }),
    ).toBeDefined()
    await waitFor(() => {
      expect(getPackagingEmployeeListMock).toHaveBeenCalledWith({
        page: 2,
        pageSize: 20,
        keyword: ' 张三 ',
        signal: expect.any(AbortSignal),
      })
    })
  })

  it('keys work-order employee options by normalized server keyword', async () => {
    const queryClient = createQueryClient()
    const queryKey = packagingProcessKeys.employees.options(' 张三 ')

    renderHook(() => usePackagingEmployeeOptions(' 张三 '), {
      wrapper: createWrapper(queryClient),
    })

    expect(
      queryClient.getQueryCache().find({ queryKey, exact: true }),
    ).toBeDefined()
    await waitFor(() => {
      expect(getPackagingEmployeeOptionsMock).toHaveBeenCalledWith({
        keyword: ' 张三 ',
        signal: expect.any(AbortSignal),
      })
    })
    expect(getPackagingEmployeeListMock).not.toHaveBeenCalled()
  })

  it('invalidates the employee root after every employee mutation', () => {
    renderHook(() => useCreatePackagingEmployee())
    renderHook(() => useUpdatePackagingEmployee())
    renderHook(() => useDeletePackagingEmployee())

    expect(useMutationWithInvalidationMock).toHaveBeenCalledTimes(3)
    useMutationWithInvalidationMock.mock.calls.forEach(([config]) => {
      expect(config.invalidateQueries).toEqual([
        packagingProcessKeys.employees.all,
      ])
    })
  })

  it('invalidates both employee lists and options from the shared root', async () => {
    const queryClient = createQueryClient()
    const listKey = packagingProcessKeys.employees.list({
      page: 1,
      pageSize: 10,
    })
    const optionsKey = packagingProcessKeys.employees.options()

    queryClient.setQueryData(listKey, 'list')
    queryClient.setQueryData(optionsKey, 'options')
    await queryClient.invalidateQueries({
      queryKey: packagingProcessKeys.employees.all,
    })

    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(optionsKey)?.isInvalidated).toBe(true)
  })
})
