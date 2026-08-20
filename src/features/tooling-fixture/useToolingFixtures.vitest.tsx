import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getToolingFixtureListMock, useQueryMock } = vi.hoisted(() => ({
  getToolingFixtureListMock: vi.fn(),
  useQueryMock: vi.fn((options) => options),
}))

vi.mock('@tanstack/react-query', () => ({
  keepPreviousData: 'KEEP_PREVIOUS_DATA',
  useQuery: useQueryMock,
}))

vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: vi.fn((options) => options),
}))

vi.mock('@/services/apiToolingFixture', () => ({
  createToolingFixture: vi.fn(),
  createToolingFixturesBatch: vi.fn(),
  deleteToolingFixtures: vi.fn(),
  getToolingFixtureList: getToolingFixtureListMock,
  updateToolingFixture: vi.fn(),
}))

vi.mock('@/services/apiToolingFixturePublic', () => ({
  deleteToolingFixtureUsageRecords: vi.fn(),
  getPublicToolingFixture: vi.fn(),
  getToolingFixtureUsageRecords: vi.fn(),
  recordPublicToolingFixtureAction: vi.fn(),
}))

import { useToolingFixtureList } from './useToolingFixtures'
import { toolingFixtureKeys } from './queryKeys'

describe('useToolingFixtureList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns query errors for the page-level table state to render', async () => {
    const signal = new AbortController().signal
    getToolingFixtureListMock.mockResolvedValue({ items: [], total: 0 })

    useToolingFixtureList({
      page: 2,
      pageSize: 20,
      keyword: '夹具',
      status: '使用中',
    })

    const options = useQueryMock.mock.calls[0]?.[0] as {
      queryKey: readonly unknown[]
      queryFn: (context: { signal: AbortSignal }) => Promise<unknown>
      throwOnError?: boolean
    }

    expect(options.queryKey).toEqual(
      toolingFixtureKeys.list({
        page: 2,
        pageSize: 20,
        keyword: '夹具',
        status: '使用中',
      }),
    )
    expect(options.throwOnError).toBe(false)

    await options.queryFn({ signal })

    expect(getToolingFixtureListMock).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      keyword: '夹具',
      status: '使用中',
      signal,
    })
  })
})
