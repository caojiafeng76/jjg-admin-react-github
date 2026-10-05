import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { jintanKeys } from '../queryKeys'

const queryMock = vi.hoisted(() =>
  vi.fn((options: { queryKey: readonly unknown[] }) => options),
)
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: queryMock,
}))

import { useJintanProfilesInventoryOptions } from './useJintanProfilesInventory'

describe('型材出入库共享库存选择缓存', () => {
  it('选件查询挂到库存根键，入库、出库和库存调整的失效均覆盖它', async () => {
    useJintanProfilesInventoryOptions(' 铝合金 ')
    expect(queryMock.mock.calls.at(-1)?.[0].queryKey).toEqual(
      jintanKeys.profilesInventory.options('铝合金'),
    )
    const client = new QueryClient()
    const allOptions = jintanKeys.profilesInventory.options()
    const filteredOptions = jintanKeys.profilesInventory.options('铝合金')
    const stockInList = jintanKeys.profilesStockIn.list({
      page: 1,
      pageSize: 10,
    })
    client.setQueryData(allOptions, [])
    client.setQueryData(filteredOptions, [])
    client.setQueryData(stockInList, [])
    await client.invalidateQueries({
      queryKey: jintanKeys.profilesInventory.all,
    })
    expect(client.getQueryState(allOptions)?.isInvalidated).toBe(true)
    expect(client.getQueryState(filteredOptions)?.isInvalidated).toBe(true)
    expect(client.getQueryState(stockInList)?.isInvalidated).toBe(false)
    client.clear()
  })
})
