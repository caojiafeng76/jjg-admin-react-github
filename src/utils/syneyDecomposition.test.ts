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
  { part_no: 'XN2808FD', decomposition_role: 'cross_frame' },
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

  it('uses rear plate remark direction before a configured rear role for new part numbers', () => {
    const cells = buildDecompositionCells(
      [
        item({
          PartNo: 'XN3024ZZ1',
          PartName: '前沿后板组件',
          ParamSpec: '1525*540',
          Qty: 1,
          Remark: 'XNJD-FZ26-126-0305 后板 L1=540mm 上头部',
        }),
        item({
          PartNo: 'XN3024ZZ1',
          PartName: '前沿后板组件',
          ParamSpec: '1525*540',
          Qty: 1,
          Remark: 'XNJD-FZ26-126-0305 后板 L1=540mm 下头部',
        }),
      ],
      [{ part_no: 'XN3024ZZ', decomposition_role: 'rear_upper' }],
    )

    expect(cells.rearUpper).toEqual({ spec: '1525*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1525*540', qty: 1 })
  })

  it('splits a configured single rear plate with Qty 2 into upper and lower 1+1', () => {
    const cells = buildDecompositionCells(
      [
        item({
          PartNo: 'XN3024ZZ1',
          PartName: '前沿后板组件',
          ParamSpec: '1525*540',
          Qty: 2,
          Remark: 'XNJD-FZ26-126-0305 后板 L1=540mm',
        }),
      ],
      [{ part_no: 'XN3024ZZ', decomposition_role: 'rear_upper' }],
    )

    expect(cells.rearUpper).toEqual({ spec: '1525*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1525*540', qty: 1 })
  })

  it('splits a configured single rear plate without PartName into upper and lower 1+1', () => {
    const cells = buildDecompositionCells(
      [
        item({
          PartNo: 'XN3024ZZ1',
          ParamSpec: '1525*540',
          Qty: 2,
          Remark: 'XNJD-FZ26-126-0305 后板 L1=540mm',
        }),
      ],
      [{ part_no: 'XN3024ZZ', decomposition_role: 'rear_upper' }],
    )

    expect(cells.rearUpper).toEqual({ spec: '1525*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1525*540', qty: 1 })
  })

  it('routes FN rear plates by remark direction like AF', () => {
    const cells = buildDecompositionCells([
      item({
        PartNo: 'XN2808FN2',
        ParamSpec: '1244*540',
        Qty: 1,
        Remark: 'XNJD-FZ26-123-0296 后板右下角 品牌:西尼 L1=540mm  上头部',
      }),
      item({
        PartNo: 'XN2808FN2',
        ParamSpec: '1244*540',
        Qty: 1,
        Remark: 'XNJD-FZ26-123-0296 后板右下角 品牌:西尼 L1=540mm  下头部',
      }),
    ])

    expect(cells.rearUpper).toEqual({ spec: '1244*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1244*540', qty: 1 })
  })

  it('splits a single DA middle plate into upper and lower 1+1', () => {
    const cells = buildDecompositionCells([
      item({
        PartNo: 'XN3024DA2',
        ParamSpec: '1244*550',
        Qty: 1,
        Remark: 'XNJD-FZ26-123-0296 中板不剪角 L1=550mm',
      }),
    ])

    expect(cells.upperMiddle).toEqual({ spec: '1244*550', qty: 1 })
    expect(cells.lowerMiddle).toEqual({ spec: '1244*550', qty: 1 })
  })

  it('splits a single DA middle plate with Qty 2 into 1+1', () => {
    const cells = buildDecompositionCells([
      item({
        PartNo: 'XN3024DA2',
        ParamSpec: '1244*550',
        Qty: 2,
        Remark: 'XNJD-FZ26-123-0296 中板 L1=550mm',
      }),
    ])

    expect(cells.upperMiddle).toEqual({ spec: '1244*550', qty: 1 })
    expect(cells.lowerMiddle).toEqual({ spec: '1244*550', qty: 1 })
  })

  it('routes DA middle plates by remark direction when flagged', () => {
    const cells = buildDecompositionCells([
      item({
        PartNo: 'XN3024DA2',
        ParamSpec: '1244*550',
        Qty: 1,
        Remark: '上部',
      }),
      item({
        PartNo: 'XN3024DA2',
        ParamSpec: '1244*550',
        Qty: 1,
        Remark: '下部',
      }),
    ])

    expect(cells.upperMiddle).toEqual({ spec: '1244*550', qty: 1 })
    expect(cells.lowerMiddle).toEqual({ spec: '1244*550', qty: 1 })
  })

  it('splits an unflagged single FN rear plate into upper and lower 1+1', () => {
    const cells = buildDecompositionCells([
      item({
        PartNo: 'XN2808FN2',
        ParamSpec: '1244*540',
        Qty: 1,
        Remark: 'XNJD-FZ26-123-0296 后板',
      }),
    ])

    expect(cells.rearUpper).toEqual({ spec: '1244*540', qty: 1 })
    expect(cells.rearLower).toEqual({ spec: '1244*540', qty: 1 })
  })

  it('routes configured cross frame parts into the cross frame cell', () => {
    const cells = buildDecompositionCells(
      [
        item({
          PartNo: 'XN2808FD2',
          PartName: '横框组件',
          ParamSpec: 'L=1260',
          Qty: 2,
        }),
      ],
      settings,
    )

    expect(cells.crossFrame).toEqual({ spec: 'L=1260', qty: 2 })
  })

  it('keeps legacy cross frame prefixes mapped without settings', () => {
    const cells = buildDecompositionCells([
      item({ PartNo: 'XN2808EC1', ParamSpec: 'L=900', Qty: 1 }),
      item({ PartNo: 'XN2838CP1', ParamSpec: 'L=900', Qty: 2 }),
    ])

    expect(cells.crossFrame).toEqual({ spec: 'L=900', qty: 3 })
  })
})
