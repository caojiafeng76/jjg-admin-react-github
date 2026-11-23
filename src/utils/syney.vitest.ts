import type { ISyneyItem } from '@/types'
import { describe, expect, it } from 'vitest'

import { distinctItems, jsonToArray } from './syney'

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

describe('jsonToArray（粘贴 JSON 解析）', () => {
  it('能解析备注中含未配对方括号的包裹文本与纯数组', () => {
    const wrapped = 'prefix {"total": 2, "data": [{"PartNo": "XN1", "PartName": "板", "Qty": 2, "Unit": "EA", "SONo": "SO-1", "Remark": "注意[仅上头部"}, {"PartNo": "XN2", "PartName": "框", "Qty": 1, "Unit": "EA", "SONo": "SO-1", "Remark": "右侧]加强"}]} trailing'
    const parsed = jsonToArray(wrapped)

    expect(parsed).toHaveLength(2)
    expect(parsed[0]).toMatchObject({ PartNo: 'XN1', Remark: '注意[仅上头部' })
    expect(parsed[1]).toMatchObject({ PartNo: 'XN2', Remark: '右侧]加强' })

    const directArray = jsonToArray('[{"PartNo": "XN3", "PartName": "件", "Qty": 1, "Unit": "EA", "SONo": "SO-2", "Remark": "[测试]"}]')
    expect(directArray).toHaveLength(1)
    expect(directArray[0].PartNo).toBe('XN3')
  })
})
