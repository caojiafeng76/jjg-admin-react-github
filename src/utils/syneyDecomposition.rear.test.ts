import { describe, expect, it } from 'vitest'

import type { ISyneyItem } from '@/services/types'

import { buildDecompositionCells } from './syneyDecomposition'

describe('rear plate decomposition', () => {
  it('splits a Qty 2 AF rear plate into upper and lower despite an upper-head remark', () => {
    const item: ISyneyItem = {
      No: 'P202609030516',
      ParamSpec: '1525*540',
      PartName: '前沿后板组件',
      PartNo: 'XN2808AF1',
      Qty: 2,
      Remark:
        'JD-FZ26-127-0307 前沿板中间 品牌:永大电梯设备(中国)有限公司 L1=540mm 上头部',
      SONo: 'JD-FZ26-127-0307',
      Spec: null,
      Unit: null,
    }

    const cells = buildDecompositionCells([item])

    expect(cells.rearUpper).toEqual({ spec: '1525*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1525*540', qty: 1 })
  })
})
