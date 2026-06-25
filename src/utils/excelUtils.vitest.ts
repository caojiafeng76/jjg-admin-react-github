import { describe, expect, it } from 'vitest'

import { transformToOrderData, type ExcelData } from './excelUtils'

describe('transformToOrderData', () => {
  it('does not use the first SONo spec as the PO-level spec when Excel rows contain mixed specs', () => {
    const excelData: ExcelData = {
      headers: [
        '采购单号',
        '交货日期',
        '物料件号',
        '物料名称',
        '规格',
        '核算数量',
        '核算单位',
        '生产编号',
      ],
      rows: [
        {
          采购单号: 'P202606240440',
          交货日期: 46205,
          物料件号: 'XN2808EB2',
          物料名称: '前沿板组件',
          规格: '一体式铝合金 800型',
          核算数量: 2,
          核算单位: 'EA',
          生产编号: 'JD-FZ26-065-0150',
        },
        {
          采购单号: 'P202606240440',
          交货日期: 46205,
          物料件号: 'XN2808BP988',
          物料名称: '上前中板组件',
          规格: '800型 室外',
          核算数量: 1,
          核算单位: 'EA',
          生产编号: 'JD-FZ26-065-0150',
        },
        {
          采购单号: 'P202606240440',
          交货日期: 46205,
          物料件号: 'XN2808EB1',
          物料名称: '前沿板组件',
          规格: '一体式铝合金 1000型',
          核算数量: 2,
          核算单位: 'EA',
          生产编号: 'JD-FZ26-065-0154',
        },
        {
          采购单号: 'P202606240440',
          交货日期: 46205,
          物料件号: 'XN2808BP987',
          物料名称: '上前中板组件',
          规格: '1000型 室外',
          核算数量: 1,
          核算单位: 'EA',
          生产编号: 'JD-FZ26-065-0154',
        },
      ],
    }

    expect(transformToOrderData(excelData).po.Spec).toBeNull()
  })
})
