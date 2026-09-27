import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  useQueryMock,
  useMutationWithInvalidationMock,
  getToolingDataListMock,
  getToolingInventoryListMock,
  getToolingInventoryByToolingDataIdMock,
  getInventoryToolingDataOptionsMock,
  getToolingStockInListMock,
  getStockInToolingDataOptionsMock,
  getToolingStockOutListMock,
  getStockOutToolingDataOptionsMock,
  getPublicToolingDataOptionsMock,
} = vi.hoisted(() => ({
  useQueryMock: vi.fn((options) => options),
  useMutationWithInvalidationMock: vi.fn((options) => options),
  getToolingDataListMock: vi.fn(),
  getToolingInventoryListMock: vi.fn(),
  getToolingInventoryByToolingDataIdMock: vi.fn(),
  getInventoryToolingDataOptionsMock: vi.fn(),
  getToolingStockInListMock: vi.fn(),
  getStockInToolingDataOptionsMock: vi.fn(),
  getToolingStockOutListMock: vi.fn(),
  getStockOutToolingDataOptionsMock: vi.fn(),
  getPublicToolingDataOptionsMock: vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  keepPreviousData: vi.fn(),
  useQuery: useQueryMock,
}))

vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: useMutationWithInvalidationMock,
}))

vi.mock('@/services/apiToolingData', () => ({
  createToolingData: vi.fn(),
  createToolingDataBatch: vi.fn(),
  deleteToolingData: vi.fn(),
  getToolingDataList: getToolingDataListMock,
  updateToolingData: vi.fn(),
}))

vi.mock('@/services/apiToolingInventory', () => ({
  createToolingInventory: vi.fn(),
  deleteToolingInventory: vi.fn(),
  getToolingDataOptions: getInventoryToolingDataOptionsMock,
  getToolingInventoryByToolingDataId: getToolingInventoryByToolingDataIdMock,
  getToolingInventoryList: getToolingInventoryListMock,
  importToolingInventory: vi.fn(),
  updateToolingInventory: vi.fn(),
}))

vi.mock('@/services/apiToolingStockIn', () => ({
  batchUpdateToolingStockInStatus: vi.fn(),
  createToolingStockIn: vi.fn(),
  deleteToolingStockIn: vi.fn(),
  getToolingDataOptions: getStockInToolingDataOptionsMock,
  getToolingStockInList: getToolingStockInListMock,
  updateToolingStockIn: vi.fn(),
}))

vi.mock('@/services/apiToolingStockOut', () => ({
  batchUpdateToolingStockOutStatus: vi.fn(),
  createPublicToolingStockOut: vi.fn(),
  createToolingStockOut: vi.fn(),
  deleteToolingStockOut: vi.fn(),
  getPublicToolingDataOptions: getPublicToolingDataOptionsMock,
  getToolingDataOptions: getStockOutToolingDataOptionsMock,
  getToolingStockOutList: getToolingStockOutListMock,
  importToolingStockOut: vi.fn(),
  updateToolingStockOut: vi.fn(),
}))

import {
  useToolingInventoryDetail,
  useToolingStockInRecords,
  useToolingStockOutRecords,
} from './ToolingData/useToolingDataDetail'
import {
  useCreateToolingData,
  useToolingDataList,
} from './ToolingData/useToolingData'
import {
  useCreateToolingInventory,
  useToolingDataOptions as useInventoryToolingDataOptions,
  useToolingInventoryList,
} from './ToolingInventory/useToolingInventory'
import {
  useCreateToolingStockIn,
  useToolingStockInList,
} from './ToolingStockIn/useToolingStockIn'
import {
  useCreateToolingStockOut,
  usePublicToolingDataOptions,
  useToolingDataOptions as useStockOutToolingDataOptions,
  useToolingStockOutList,
} from './ToolingStockOut/useToolingStockOut'
import { toolingKeys } from './queryKeys'

interface CapturedQueryOptions {
  queryKey: readonly unknown[]
  queryFn: (context: { signal: AbortSignal }) => Promise<unknown>
  enabled?: boolean
}

function lastQueryOptions(): CapturedQueryOptions {
  return useQueryMock.mock.calls.at(-1)?.[0] as CapturedQueryOptions
}

function lastMutationOptions(): {
  invalidateQueries?: readonly (readonly unknown[])[]
} {
  return useMutationWithInvalidationMock.mock.calls.at(-1)?.[0] as {
    invalidateQueries?: readonly (readonly unknown[])[]
  }
}

describe('tooling query key factories', () => {
  it('keeps every tooling list under its domain root and normalizes filters', () => {
    expect(
      toolingKeys.inventory.list({
        page: 2,
        pageSize: 20,
        keyword: '  T-01  ',
      }),
    ).toEqual([
      ...toolingKeys.inventory.lists(),
      { page: 2, pageSize: 20, keyword: 'T-01' },
    ])
    expect(
      toolingKeys.stockIn.list({
        page: 1,
        pageSize: 50,
        keyword: '  ',
        status: '已审核',
      }),
    ).toEqual([
      ...toolingKeys.stockIn.lists(),
      { page: 1, pageSize: 50, keyword: '', status: '已审核' },
    ])
    expect(
      toolingKeys.stockOut.list({
        page: 3,
        pageSize: 10,
        status: undefined,
      }),
    ).toEqual([
      ...toolingKeys.stockOut.lists(),
      { page: 3, pageSize: 10, keyword: '', status: '' },
    ])
    expect(toolingKeys.inventory.detail('tool-1')).toEqual([
      ...toolingKeys.inventory.all,
      'detail',
      'tool-1',
    ])
    expect(
      toolingKeys.stockIn.byTooling({
        toolingDataId: 'tool-1',
        page: 2,
        pageSize: 20,
      }),
    ).toEqual([
      ...toolingKeys.stockIn.all,
      'by-tooling',
      { toolingDataId: 'tool-1', page: 2, pageSize: 20 },
    ])
    expect(
      toolingKeys.stockOut.byTooling({
        toolingDataId: 'tool-2',
        page: 1,
        pageSize: 10,
      }),
    ).toEqual([
      ...toolingKeys.stockOut.all,
      'by-tooling',
      { toolingDataId: 'tool-2', page: 1, pageSize: 10 },
    ])
  })

  it('nests authenticated and public options under the tooling data root', () => {
    expect(toolingKeys.data.options('  cutter  ')).toEqual([
      ...toolingKeys.data.all,
      'options',
      { keyword: 'cutter' },
    ])
    expect(toolingKeys.data.publicOptions()).toEqual([
      ...toolingKeys.data.all,
      'public-options',
      { keyword: '' },
    ])
  })
})

describe('tooling hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses factory list keys and forwards AbortSignal to every list service', async () => {
    const controller = new AbortController()

    useToolingDataList({
      page: 1,
      pageSize: 20,
      searchParams: { keyword: '  DATA  ' },
    })
    let options = lastQueryOptions()
    expect(options.queryKey).toEqual(
      toolingKeys.data.list({ page: 1, pageSize: 20, keyword: 'DATA' }),
    )
    await options.queryFn({ signal: controller.signal })
    expect(getToolingDataListMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      keyword: '  DATA  ',
      signal: controller.signal,
    })

    useToolingInventoryList({
      page: 2,
      pageSize: 30,
      searchParams: { keyword: 'INV' },
    })
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(
      toolingKeys.inventory.list({
        page: 2,
        pageSize: 30,
        keyword: 'INV',
      }),
    )
    await options.queryFn({ signal: controller.signal })
    expect(getToolingInventoryListMock).toHaveBeenCalledWith({
      page: 2,
      pageSize: 30,
      keyword: 'INV',
      signal: controller.signal,
    })

    useToolingStockInList({
      page: 3,
      pageSize: 40,
      searchParams: { keyword: 'IN', status: '待审核' },
    })
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(
      toolingKeys.stockIn.list({
        page: 3,
        pageSize: 40,
        keyword: 'IN',
        status: '待审核',
      }),
    )
    await options.queryFn({ signal: controller.signal })
    expect(getToolingStockInListMock).toHaveBeenCalledWith({
      page: 3,
      pageSize: 40,
      keyword: 'IN',
      status: '待审核',
      signal: controller.signal,
    })

    useToolingStockOutList({
      page: 4,
      pageSize: 50,
      searchParams: { keyword: 'OUT', status: '已审核' },
    })
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(
      toolingKeys.stockOut.list({
        page: 4,
        pageSize: 50,
        keyword: 'OUT',
        status: '已审核',
      }),
    )
    await options.queryFn({ signal: controller.signal })
    expect(getToolingStockOutListMock).toHaveBeenCalledWith({
      page: 4,
      pageSize: 50,
      keyword: 'OUT',
      status: '已审核',
      signal: controller.signal,
    })
  })

  it('nests row-detail queries under their domain roots and forwards tooling filters', async () => {
    const controller = new AbortController()

    useToolingInventoryDetail('tool-1')
    let options = lastQueryOptions()
    expect(options.queryKey).toEqual(toolingKeys.inventory.detail('tool-1'))
    expect(options.enabled).toBe(true)
    await options.queryFn({ signal: controller.signal })
    expect(getToolingInventoryByToolingDataIdMock).toHaveBeenCalledWith(
      'tool-1',
      controller.signal,
    )

    useToolingStockInRecords({
      toolingDataId: 'tool-1',
      page: 2,
      pageSize: 10,
    })
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(
      toolingKeys.stockIn.byTooling({
        toolingDataId: 'tool-1',
        page: 2,
        pageSize: 10,
      }),
    )
    await options.queryFn({ signal: controller.signal })
    expect(getToolingStockInListMock).toHaveBeenCalledWith({
      toolingDataId: 'tool-1',
      page: 2,
      pageSize: 10,
      signal: controller.signal,
    })

    useToolingStockOutRecords({
      toolingDataId: 'tool-1',
      page: 3,
      pageSize: 5,
    })
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(
      toolingKeys.stockOut.byTooling({
        toolingDataId: 'tool-1',
        page: 3,
        pageSize: 5,
      }),
    )
    await options.queryFn({ signal: controller.signal })
    expect(getToolingStockOutListMock).toHaveBeenCalledWith({
      toolingDataId: 'tool-1',
      page: 3,
      pageSize: 5,
      signal: controller.signal,
    })
  })

  it('disables row-detail queries without a tooling id', () => {
    useToolingInventoryDetail(undefined)
    expect(lastQueryOptions().enabled).toBe(false)

    useToolingStockInRecords({ toolingDataId: '', page: 1 })
    expect(lastQueryOptions().enabled).toBe(false)

    useToolingStockOutRecords({ toolingDataId: '', page: 1 })
    expect(lastQueryOptions().enabled).toBe(false)
  })

  it('shares option caches across authenticated hooks and forwards signals', async () => {
    const controller = new AbortController()

    useInventoryToolingDataOptions('  T-10  ')
    let options = lastQueryOptions()
    expect(options.queryKey).toEqual(toolingKeys.data.options('T-10'))
    await options.queryFn({ signal: controller.signal })
    expect(getInventoryToolingDataOptionsMock).toHaveBeenCalledWith(
      '  T-10  ',
      controller.signal,
    )

    useStockOutToolingDataOptions('  T-10  ')
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(toolingKeys.data.options('T-10'))
    await options.queryFn({ signal: controller.signal })
    expect(getStockOutToolingDataOptionsMock).toHaveBeenCalledWith(
      '  T-10  ',
      controller.signal,
    )

    usePublicToolingDataOptions(' public ')
    options = lastQueryOptions()
    expect(options.queryKey).toEqual(toolingKeys.data.publicOptions('public'))
    await options.queryFn({ signal: controller.signal })
    expect(getPublicToolingDataOptionsMock).toHaveBeenCalledWith(
      ' public ',
      controller.signal,
    )
  })

  it('invalidates the factory roots affected by each mutation', () => {
    useCreateToolingData()
    expect(lastMutationOptions().invalidateQueries).toEqual([
      toolingKeys.data.all,
    ])

    useCreateToolingInventory()
    expect(lastMutationOptions().invalidateQueries).toEqual([
      toolingKeys.inventory.all,
    ])

    useCreateToolingStockIn()
    expect(lastMutationOptions().invalidateQueries).toEqual([
      toolingKeys.stockIn.all,
      toolingKeys.inventory.all,
    ])

    useCreateToolingStockOut()
    expect(lastMutationOptions().invalidateQueries).toEqual([
      toolingKeys.stockOut.all,
      toolingKeys.inventory.all,
    ])
  })
})
