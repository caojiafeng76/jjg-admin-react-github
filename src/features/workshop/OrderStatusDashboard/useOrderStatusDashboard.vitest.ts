import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    keepPreviousData: actual.keepPreviousData,
    useQuery: vi.fn(),
  }
})

vi.mock('@/services/apiOrderStatusDashboard', () => ({
  getAllProcessStandardJobRows: vi.fn(),
  getOrderStatusDashboard: vi.fn(),
  REWORK_REPAIR_STATUS_COLORS: {},
  REWORK_REPAIR_STATUS_LABELS: {},
}))

import { useQuery } from '@tanstack/react-query'
import {
  getAllProcessStandardJobRows,
  getOrderStatusDashboard,
} from '@/services/apiOrderStatusDashboard'
import {
  ORDER_STATUS_DASHBOARD_KEY,
  PROCESS_STANDARDS_KEY,
  PROCESS_STANDARD_JOB_ROWS_KEY,
  useOrderStatusDashboard,
  useProcessStandardJobRows,
} from './useOrderStatusDashboard'

const useQueryMock = vi.mocked(useQuery)
const getAllProcessStandardJobRowsMock = vi.mocked(getAllProcessStandardJobRows)
const getOrderStatusDashboardMock = vi.mocked(getOrderStatusDashboard)

describe('useProcessStandardJobRows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the process-standards prefix with the job-rows suffix', () => {
    useQueryMock.mockReturnValue({ data: [] } as never)
    useProcessStandardJobRows()

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [PROCESS_STANDARDS_KEY, PROCESS_STANDARD_JOB_ROWS_KEY],
      }),
    )
  })

  it('applies the static cache config (1 hour staleTime)', () => {
    useQueryMock.mockReturnValue({ data: [] } as never)
    useProcessStandardJobRows()

    const options = useQueryMock.mock.calls.at(-1)?.[0]
    expect(options?.staleTime).toBe(1000 * 60 * 60)
    expect(options?.gcTime).toBe(1000 * 60 * 60 * 24)
  })

  it('queries via getAllProcessStandardJobRows and honors AbortSignal', async () => {
    getAllProcessStandardJobRowsMock.mockResolvedValue([])
    useQueryMock.mockReturnValue({ data: [] } as never)
    useProcessStandardJobRows()

    const options = useQueryMock.mock.calls.at(-1)?.[0]
    const queryFn = options?.queryFn

    if (typeof queryFn !== 'function') {
      throw new Error('Expected the latest query to define a query function')
    }

    const signal = new AbortController().signal
    await queryFn({ signal } as never)

    expect(getAllProcessStandardJobRowsMock).toHaveBeenCalledWith(signal)
  })
})

describe('useOrderStatusDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes cached process rows into getOrderStatusDashboard', async () => {
    const processRows = [{ job_name: 'CNC', operation: 'CNC' }]
    useQueryMock
      .mockReturnValueOnce({ data: processRows } as never)
      .mockReturnValueOnce({ data: { items: [] } } as never)

    useOrderStatusDashboard({ page: 1, pageSize: 20 })

    // 手动执行 dashboard 查询的 queryFn（mock useQuery 不会自动执行）
    const options = useQueryMock.mock.calls.at(-1)?.[0]
    const queryFn = options?.queryFn

    if (typeof queryFn !== 'function') {
      throw new Error('Expected the latest query to define a query function')
    }

    await queryFn({ signal: new AbortController().signal } as never)

    expect(getOrderStatusDashboardMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        pageSize: 20,
        processRows,
      }),
    )
  })

  it('keeps the dashboard list cache config and key', () => {
    useQueryMock
      .mockReturnValueOnce({ data: [] } as never)
      .mockReturnValueOnce({ data: { items: [] } } as never)

    useOrderStatusDashboard({ page: 2, pageSize: 50 })

    const options = useQueryMock.mock.calls.at(-1)?.[0]
    expect(options?.queryKey[0]).toBe(ORDER_STATUS_DASHBOARD_KEY)
    expect(options?.queryKey[1]).toEqual({ page: 2, pageSize: 50 })
    expect(options?.staleTime).toBe(1000 * 30)
  })

  it('is disabled until process rows are available', () => {
    useQueryMock
      .mockReturnValueOnce({ data: undefined } as never)
      .mockReturnValueOnce({ data: undefined } as never)

    useOrderStatusDashboard({ page: 1, pageSize: 20 })

    const options = useQueryMock.mock.calls.at(-1)?.[0]
    expect(options?.enabled).toBe(false)
  })
})
