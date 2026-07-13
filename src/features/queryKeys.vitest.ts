import { describe, expect, it } from 'vitest'

import { packagingProcessKeys } from '@/features/packaging-process/queryKeys'
import { syneyPoKeys } from '@/features/syney/queryKeys'
import { toolingKeys } from '@/features/tooling/queryKeys'
import { youmaiKeys } from '@/features/youmai/queryKeys'

describe('domain query-key factories', () => {
  it('normalizes list keywords into stable parameter objects', () => {
    expect(
      packagingProcessKeys.employees.list({
        page: 2,
        pageSize: 20,
        keyword: '  张三  ',
      }),
    ).toEqual([
      'packaging-employees',
      'list',
      { page: 2, pageSize: 20, keyword: '张三' },
    ])

    expect(
      toolingKeys.data.list({ page: 1, pageSize: 50, keyword: '   ' }),
    ).toEqual(['tooling-data', 'list', { page: 1, pageSize: 50, keyword: '' }])
  })

  it('keeps options below the corresponding master-data root', () => {
    expect(toolingKeys.data.options()).toEqual([
      ...toolingKeys.data.all,
      'options',
      { keyword: '' },
    ])
    expect(youmaiKeys.productData.options('  A-01 ')).toEqual([
      ...youmaiKeys.productData.all,
      'options',
      { keyword: 'A-01' },
    ])
    expect(youmaiKeys.rawMaterialInventory.options()).toEqual([
      ...youmaiKeys.rawMaterialInventory.all,
      'options',
      { keyword: '' },
    ])
  })

  it('uses one canonical detail key for both Syney PO detail entry points', () => {
    expect(syneyPoKeys.detail(42)).toEqual(syneyPoKeys.detail('42'))
    expect(syneyPoKeys.detail(42)).toEqual([...syneyPoKeys.all, 'detail', '42'])
  })
})
