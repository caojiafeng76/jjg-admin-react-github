import { describe, expect, it } from 'vitest'

import { buildDecompositionCells } from './syneyDecomposition'
import type { ISyneyItem } from '@/services/types'
import type { SyneySafePartRule } from './syneySafePartRules'

const settings: SyneySafePartRule[] = [
  { part_no: 'XN3024Z', decomposition_role: 'front_plate' },
  { part_no: 'XN3024AB', decomposition_role: 'rear_upper' },
  { part_no: 'XN3024AD', decomposition_role: 'rear_lower' },
  { part_no: 'XN3024AE', decomposition_role: 'upper_middle' },
  { part_no: 'XN3024AF', decomposition_role: 'lower_middle' },
]

function item(values: Partial<ISyneyItem>): ISyneyItem {
  return {
    No: 'P202606290153',
    ParamSpec: null,
    PartName: null,
    PartNo: null,
    Qty: null,
    Remark: null,
    SONo: 'XN-RZ14-516-1409-1838',
    Spec: null,
    Unit: null,
    ...values,
  }
}

describe('buildDecompositionCells', () => {
  it('maps configured new Syney part numbers into decomposition columns', () => {
    const cells = buildDecompositionCells(
      [
        item({ PartNo: 'XN3024AB1', ParamSpec: '1575*360', Qty: 1 }),
        item({ PartNo: 'XN3024AD1', ParamSpec: '1575*504', Qty: 1 }),
        item({ PartNo: 'XN3024AE1', ParamSpec: '1575*550', Qty: 1 }),
        item({ PartNo: 'XN3024AF1', ParamSpec: '1575*549', Qty: 1 }),
        item({ PartNo: 'XN3024Z1', ParamSpec: '1060*446', Qty: 2 }),
      ],
      settings,
    )

    expect(cells.frontPlate).toEqual({ spec: '1060*446', qty: 2 })
    expect(cells.upperMiddle).toEqual({ spec: '1575*550', qty: 1 })
    expect(cells.lowerMiddle).toEqual({ spec: '1575*549', qty: 1 })
    expect(cells.rearUpper).toEqual({ spec: '1575*360', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1575*504', qty: 1 })
  })

  it('does not treat rear plate position text as the lower head marker', () => {
    const cells = buildDecompositionCells([
      item({
        PartNo: 'XN2808AF1',
        PartName: '前沿后板组件',
        ParamSpec: '1525*540',
        Qty: 1,
        Remark: 'XNJD-FZ26-071-0186 后板右下角 品牌:西尼 L1=540mm 上头部',
      }),
      item({
        PartNo: 'XN2808AF997',
        PartName: '前沿后板组件',
        ParamSpec: '1525*612',
        Qty: 1,
        Remark: 'XNJD-FZ26-071-0186 后板右下角 品牌:西尼 L1=612mm 下头部',
      }),
    ])

    expect(cells.rearUpper).toEqual({ spec: '1525*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1525*612', qty: 1 })
  })

  it('uses rear plate remark direction before a broad configured rear role', () => {
    const cells = buildDecompositionCells(
      [
        item({
          PartNo: 'XN2808AF1',
          PartName: '前沿后板组件',
          ParamSpec: '1525*540',
          Qty: 1,
          Remark: 'XNJD-FZ26-071-0186 后板右下角 品牌:西尼 L1=540mm 上头部',
        }),
        item({
          PartNo: 'XN2808AF997',
          PartName: '前沿后板组件',
          ParamSpec: '1525*612',
          Qty: 1,
          Remark: 'XNJD-FZ26-071-0186 后板右下角 品牌:西尼 L1=612mm 下头部',
        }),
      ],
      [{ part_no: 'XN2808AF', decomposition_role: 'rear_lower' }],
    )

    expect(cells.rearUpper).toEqual({ spec: '1525*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1525*612', qty: 1 })
  })
})
