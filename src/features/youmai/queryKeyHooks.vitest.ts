import { useQuery } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { getYoumaiProductDataOptions as getInventoryProductOptions } from '@/services/apiYoumaiFinishedGoodsInventory'
import { getYoumaiProductDataOptions as getStockInProductOptions } from '@/services/apiYoumaiFinishedGoodsStockIn'
import { getYoumaiProductDataOptions as getStockOutProductOptions } from '@/services/apiYoumaiFinishedGoodsStockOut'
import {
  getYoumaiRawMaterialInventoryOptionById,
  getYoumaiRawMaterialInventoryOptions,
} from '@/services/apiYoumaiRawMaterialInventory'

import {
  useCreateYoumaiProductData,
  useDeleteYoumaiProductData,
  useImportYoumaiProductData,
  useUpdateYoumaiProductData,
  useYoumaiProductDataList,
} from './ProductData/useYoumaiProductData'
import {
  useCreateYoumaiRawMaterialInventory,
  useDeleteYoumaiRawMaterialInventory,
  useUpdateYoumaiRawMaterialInventory,
  useYoumaiRawMaterialInventoryOption,
  useYoumaiRawMaterialInventoryList,
} from './RawMaterialInventory/useYoumaiRawMaterialInventory'
import {
  useCreateYoumaiRawMaterialStockIn,
  useDeleteYoumaiRawMaterialStockIn,
  useYoumaiRawMaterialInventoryOptions,
} from './RawMaterialStockIn/useYoumaiRawMaterialStockIn'
import {
  useCreateYoumaiRawMaterialStockOut,
  useDeleteYoumaiRawMaterialStockOut,
  useYoumaiRawMaterialInventoryOptionsForStockOut,
} from './RawMaterialStockOut/useYoumaiRawMaterialStockOut'
import { useYoumaiProductDataOptions as useInventoryProductOptions } from './FinishedGoodsInventory/useYoumaiFinishedGoodsInventory'
import { useYoumaiProductDataOptions as useStockInProductOptions } from './FinishedGoodsStockIn/useYoumaiFinishedGoodsStockIn'
import { useYoumaiProductDataOptions as useStockOutProductOptions } from './FinishedGoodsStockOut/useYoumaiFinishedGoodsStockOut'
import { youmaiKeys } from './queryKeys'

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()

  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

vi.mock('@/hooks/useMutationWithInvalidation', () => ({
  useMutationWithInvalidation: vi.fn(),
}))

vi.mock('@/services/apiYoumaiProductData')
vi.mock('@/services/apiYoumaiRawMaterialInventory')
vi.mock('@/services/apiYoumaiFinishedGoodsInventory')
vi.mock('@/services/apiYoumaiFinishedGoodsStockIn')
vi.mock('@/services/apiYoumaiFinishedGoodsStockOut')
vi.mock('@/services/apiYoumaiRawMaterialStockIn')
vi.mock('@/services/apiYoumaiRawMaterialStockOut')

vi.mock('./queryKeys', () => {
  const createKeys = (root: string) => ({
    all: [`factory:${root}`] as const,
    list: ({ page, pageSize, keyword }: Record<string, unknown>) =>
      [
        `factory:${root}:list`,
        { page, pageSize, keyword: String(keyword ?? '').trim() },
      ] as const,
    detail: (id: string) => [`factory:${root}:detail`, id] as const,
    options: (keyword?: string) =>
      [
        `factory:${root}:options`,
        { keyword: String(keyword ?? '').trim() },
      ] as const,
  })

  return {
    youmaiKeys: {
      productData: createKeys('product-data'),
      rawMaterialInventory: createKeys('raw-material-inventory'),
    },
  }
})

const useQueryMock = vi.mocked(useQuery)
const useMutationMock = vi.mocked(useMutationWithInvalidation)

function queryKeyFromLastCall() {
  return useQueryMock.mock.calls.at(-1)?.[0].queryKey
}

async function runLastQuery(signal: AbortSignal) {
  const queryFn = useQueryMock.mock.calls.at(-1)?.[0].queryFn

  if (typeof queryFn !== 'function') {
    throw new Error('Expected the latest query to define a query function')
  }

  await queryFn({ signal } as never)
}

function invalidationKeysFromLastCall() {
  return useMutationMock.mock.calls.at(-1)?.[0].invalidateQueries
}

describe('Youmai hooks query-key integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses normalized factory keys for product and raw-material lists', () => {
    useYoumaiProductDataList({
      page: 2,
      pageSize: 20,
      searchParams: { keyword: '  A-01  ' },
    })
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.productData.list({
        page: 2,
        pageSize: 20,
        keyword: 'A-01',
      }),
    )

    useYoumaiRawMaterialInventoryList({
      page: 3,
      pageSize: 50,
      searchParams: { keyword: '   ' },
    })
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.rawMaterialInventory.list({
        page: 3,
        pageSize: 50,
        keyword: '',
      }),
    )
  })

  it('places every product and raw-material option query below its master-data root', () => {
    useInventoryProductOptions()
    expect(queryKeyFromLastCall()).toEqual(youmaiKeys.productData.options())

    useStockInProductOptions()
    expect(queryKeyFromLastCall()).toEqual(youmaiKeys.productData.options())

    useStockOutProductOptions()
    expect(queryKeyFromLastCall()).toEqual(youmaiKeys.productData.options())

    useYoumaiRawMaterialInventoryOptions()
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.rawMaterialInventory.options(),
    )

    useYoumaiRawMaterialInventoryOptionsForStockOut()
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.rawMaterialInventory.options(),
    )
  })

  it('keeps option keywords in sync with the query key and forwards cancellation', async () => {
    const signal = new AbortController().signal

    useInventoryProductOptions('  inventory  ')
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.productData.options('inventory'),
    )
    await runLastQuery(signal)
    expect(getInventoryProductOptions).toHaveBeenLastCalledWith(
      'inventory',
      signal,
    )

    useStockInProductOptions('  stock-in  ')
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.productData.options('stock-in'),
    )
    await runLastQuery(signal)
    expect(getStockInProductOptions).toHaveBeenLastCalledWith(
      'stock-in',
      signal,
    )

    useStockOutProductOptions('  stock-out  ')
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.productData.options('stock-out'),
    )
    await runLastQuery(signal)
    expect(getStockOutProductOptions).toHaveBeenLastCalledWith(
      'stock-out',
      signal,
    )

    useYoumaiRawMaterialInventoryOptions('  raw-in  ')
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.rawMaterialInventory.options('raw-in'),
    )
    await runLastQuery(signal)
    expect(getYoumaiRawMaterialInventoryOptions).toHaveBeenLastCalledWith(
      'raw-in',
      signal,
    )

    useYoumaiRawMaterialInventoryOptionsForStockOut('  raw-out  ')
    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.rawMaterialInventory.options('raw-out'),
    )
    await runLastQuery(signal)
    expect(getYoumaiRawMaterialInventoryOptions).toHaveBeenLastCalledWith(
      'raw-out',
      signal,
    )
  })

  it('uses the raw-material detail key for an exact editable option', async () => {
    const signal = new AbortController().signal

    useYoumaiRawMaterialInventoryOption('raw-over-1000')

    expect(queryKeyFromLastCall()).toEqual(
      youmaiKeys.rawMaterialInventory.detail('raw-over-1000'),
    )
    expect(useQueryMock.mock.calls.at(-1)?.[0].enabled).toBe(true)
    await runLastQuery(signal)
    expect(
      getYoumaiRawMaterialInventoryOptionById,
    ).toHaveBeenLastCalledWith('raw-over-1000', signal)

    useYoumaiRawMaterialInventoryOption()
    expect(useQueryMock.mock.calls.at(-1)?.[0].enabled).toBe(false)
  })

  it('invalidates the product-data root after every product-data mutation', () => {
    useCreateYoumaiProductData()
    expect(invalidationKeysFromLastCall()).toEqual([youmaiKeys.productData.all])

    useUpdateYoumaiProductData()
    expect(invalidationKeysFromLastCall()).toEqual([youmaiKeys.productData.all])

    useImportYoumaiProductData()
    expect(invalidationKeysFromLastCall()).toEqual([youmaiKeys.productData.all])

    useDeleteYoumaiProductData()
    expect(invalidationKeysFromLastCall()).toEqual([youmaiKeys.productData.all])
  })

  it('invalidates the raw-material root after master-data and stock mutations', () => {
    useCreateYoumaiRawMaterialInventory()
    expect(invalidationKeysFromLastCall()).toEqual([
      youmaiKeys.rawMaterialInventory.all,
    ])

    useUpdateYoumaiRawMaterialInventory()
    expect(invalidationKeysFromLastCall()).toEqual([
      youmaiKeys.rawMaterialInventory.all,
    ])

    useDeleteYoumaiRawMaterialInventory()
    expect(invalidationKeysFromLastCall()).toEqual([
      youmaiKeys.rawMaterialInventory.all,
    ])

    useCreateYoumaiRawMaterialStockIn()
    expect(invalidationKeysFromLastCall()).toContainEqual(
      youmaiKeys.rawMaterialInventory.all,
    )

    useDeleteYoumaiRawMaterialStockIn()
    expect(invalidationKeysFromLastCall()).toContainEqual(
      youmaiKeys.rawMaterialInventory.all,
    )

    useCreateYoumaiRawMaterialStockOut()
    expect(invalidationKeysFromLastCall()).toContainEqual(
      youmaiKeys.rawMaterialInventory.all,
    )

    useDeleteYoumaiRawMaterialStockOut()
    expect(invalidationKeysFromLastCall()).toContainEqual(
      youmaiKeys.rawMaterialInventory.all,
    )
  })
})
