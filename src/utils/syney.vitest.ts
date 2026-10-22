import type { ISyneyItem } from '@/types'
import { describe, expect, it } from 'vitest'

import { distinctItems } from './syney'

function makeItem(overrides: Partial<ISyneyItem>): ISyneyItem {
  return {
    PartNo: 'XN2808AF998',
    PartName: '前沿后板组件',
    SONo: 'XNJD-FZ26-148-0374',
    Qty: 1,
    TaxUnitPrice: 12.5,
    ...overrides,
  } as ISyneyItem
}

describe('distinctItems（入库单汇总口径）', () => {
  it('按件号和单价合并数量并重算总价', () => {
    const result = distinctItems([
      makeItem({ ParamSpec: '1325*648' }),
      makeItem({ ParamSpec: '1325*684' }),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].Qty).toBe(2)
    expect(result[0].TaxTotalPrice).toBe(25)
  })

  it('单价不同不合并', () => {
    const result = distinctItems([
      makeItem({}),
      makeItem({ TaxUnitPrice: 13 }),
    ])

    expect(result).toHaveLength(2)
  })
})
