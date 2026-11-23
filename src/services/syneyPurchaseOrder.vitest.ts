import type { ISyneySpec } from '@/types'
import { describe, expect, it } from 'vitest'
import { parseDeliveryOrderRequest } from '../../server/syneyDeliveryOrderLogic'
import { fetchPurchaseOrderRows } from '../../server/syneyPurchaseOrder'
import {
  buildSyneyPurchaseOrderPayload,
  prepareManualOrExcelPoGroups,
  prepareSyneyLoosePartsOrder,
  prepareSyneyPurchaseOrder,
} from '../utils/syneyPurchaseOrder'

const row = {
  PONo: 'P123',
  EndDate: '2026-10-28T00:00:00',
  PartNo: 'XN2808AF998',
  PartName: '后板',
  Spec: '1000型',
  SONo: 'SO-1',
  CalculateQty: 1,
  CalculateUnit: 'EA',
  Qty: 99,
  Unit: 'KG',
  Remarks: '采购单备注',
}

describe('西尼采购单取数', () => {
  it('校验并修剪采购单号', () => {
    expect(parseDeliveryOrderRequest({ action: 'fetchPurchaseOrder', payload: { poNo: ' P123 ' } }))
      .toEqual({ ok: true, action: 'fetchPurchaseOrder', payload: { poNo: 'P123' } })
    expect(parseDeliveryOrderRequest({ action: 'fetchPurchaseOrder', payload: { poNo: 'P123&x=1' } }).ok)
      .toBe(false)
  })

  it('分页精确匹配，保留同件号的上下头部和核算数量', async () => {
    const readPage = async (index: number) => ({
      total: 3,
      rows: index === 0
        ? [{ ...row, PKID: 1, Remark: '上头部 L1=648mm' }, { ...row, PONo: 'P1234', PKID: 2 }]
        : [{ ...row, PKID: 3, Remark: '下头部 L1=684mm', PartStatus: 4 }],
    })
    const order = await fetchPurchaseOrderRows('P123', readPage, 2)
    expect(order.rows).toHaveLength(2)
    expect(order.rows.map(item => [item.quantity, item.unit, item.remark])).toEqual([
      [1, 'EA', '上头部 L1=648mm'],
      [1, 'EA', '下头部 L1=684mm'],
    ])
    const groups = prepareSyneyPurchaseOrder(order, [])
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ soNo: 'SO-1', endDate: '2026-10-28', remark: '采购单备注', isLooseParts: false })
    expect(groups[0].items.map(item => item.Remark)).toEqual(['上头部 L1=648mm', '下头部 L1=684mm'])
  })

  it('允许散件采购单无生产编号（如 P202611100277）并直接生成散件分组', async () => {
    const order = await fetchPurchaseOrderRows('P202611100277', async () => ({
      total: 3,
      rows: [
        { ...row, PKID: 9705642, PONo: 'P202611100277', SONo: '', EndDate: '2026-11-12T00:00:00', PartNo: 'XN4025H3', PartName: '人行道梳齿板', Spec: '右件', CalculateQty: 4, Remarks: '售后熊剑波', Remark: 'GM261109007,售后熊剑波,' },
        { ...row, PKID: 9705643, PONo: 'P202611100277', SONo: '', EndDate: '2026-11-12T00:00:00', PartNo: 'XN4025H2', PartName: '人行道梳齿板', Spec: '中间', CalculateQty: 12, Remarks: '售后熊剑波', Remark: 'GM261109007,售后熊剑波,' },
        { ...row, PKID: 9705644, PONo: 'P202611100277', SONo: '', EndDate: '2026-11-12T00:00:00', PartNo: 'XN4025H1', PartName: '人行道梳齿板', Spec: '左件', CalculateQty: 4, Remarks: '售后熊剑波', Remark: 'GM261109007,售后熊剑波,' },
      ],
    }))

    const groups = prepareSyneyLoosePartsOrder(order)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({
      soNo: '',
      endDate: '2026-11-12',
      spec: '散件',
      brand: null,
      technique: null,
      remark: '售后熊剑波',
      isLooseParts: true,
    })
    expect(groups[0].items).toHaveLength(3)

    const payload = buildSyneyPurchaseOrderPayload(groups)
    expect(payload[0]).toMatchObject({
      soNo: '',
      spec: '散件',
      brand: null,
      technique: null,
      isLooseParts: true,
    })
    expect(payload[0].items[0]).toMatchObject({
      PartNo: 'XN4025H3',
      Qty: 4,
      PartName2: null,
      PartModel: null,
      PartCodePrefix: null,
    })
  })

  it('发现缺字段、重复分页或分页提前结束时拒绝生成不完整预览', async () => {
    await expect(fetchPurchaseOrderRows('P123', async () => ({
      rows: [{ ...row, PKID: 1, CalculateQty: null }],
      total: 1,
    }))).rejects.toThrow('核算数量')
    await expect(fetchPurchaseOrderRows('P123', async () => ({
      rows: [{ ...row, PKID: 1 }],
      total: 2,
    }), 1)).rejects.toThrow('明细重复')
    await expect(fetchPurchaseOrderRows('P123', async () => ({
      rows: [{ ...row, PKID: 1 }],
      total: 3,
    }), 2)).rejects.toThrow('未取齐')
  })
})

describe('手工 / Excel 建单统一走 RPC 分组转换', () => {
  const specs: ISyneySpec[] = [
    { id: 1, PartNo: 'XN2808AF998', PartName: '前沿后板组件', Spec: '1000型', ParamSpec: '1525*实际宽度', Unit: 'EA' },
  ]

  it('按生产编号分组并匹配规格与安全部件前缀', () => {
    const { groups, hasInferredParamSpec } = prepareManualOrExcelPoGroups({
      order: {
        endDate: '2026-11-25',
        spec: '1000型-室内-扶梯',
        technique: '前：商标',
        remark: '贴牌梯~注意',
      },
      items: [
        {
          No: 'P20261123001',
          PartNo: 'XN2808AF998',
          PartName: '前沿后板组件',
          Spec: '1000型',
          ParamSpec: '',
          Qty: 1,
          Unit: 'EA',
          SONo: 'SO-A',
          Remark: '品牌:西尼 L1=540mm',
        },
        {
          No: 'P20261123001',
          PartNo: 'XN2808DA1',
          PartName: '中板组件',
          Spec: '1000型',
          ParamSpec: '',
          Qty: 2,
          Unit: 'EA',
          SONo: 'SO-B',
          Remark: '宽=550',
        },
      ],
      specs,
    })

    expect(hasInferredParamSpec).toBe(true)
    expect(groups).toHaveLength(2)
    expect(groups[0]).toMatchObject({
      soNo: 'SO-A',
      brand: '西尼',
      spec: '1000型-室内-扶梯',
      technique: '前：商标',
      remark: '贴牌梯~注意',
      isLooseParts: false,
    })
    expect(groups[0].items[0].ParamSpec).toBe('1525*540')
    expect(groups[1].items[0].ParamSpec).toBe('1525*550')

    const payload = buildSyneyPurchaseOrderPayload(groups, [
      {
        part_no: 'XN2808AF',
        name: '后板',
        part_model: 'YD1001',
        part_code_prefix: 'HB00',
        need_print_label: true,
      },
    ])
    expect(payload[0].items[0]).toMatchObject({
      PartNo: 'XN2808AF998',
      PartName2: '后板',
      PartModel: 'YD1001',
      PartCodePrefix: 'HB00',
    })
  })

  it('规格为散件时允许空生产编号并跳过品牌/工艺/安全件前缀', () => {
    const { groups } = prepareManualOrExcelPoGroups({
      order: { endDate: '2026-11-25', spec: '散件', brand: '西尼', technique: '前：角钢' },
      items: [
        {
          No: 'P20261123002',
          PartNo: 'XN4025H3',
          PartName: '梳齿板',
          Spec: '右件',
          ParamSpec: '',
          Qty: 4,
          Unit: 'EA',
          SONo: '',
          Remark: '',
        },
      ],
      specs: [],
    })

    expect(groups[0]).toMatchObject({
      soNo: '',
      spec: '散件',
      brand: null,
      technique: null,
      isLooseParts: true,
    })
  })

  it('普通订单缺少生产编号或明细数量非法时拦截报错', () => {
    expect(() =>
      prepareManualOrExcelPoGroups({
        order: { endDate: '2026-11-25', spec: '1000型-室内-扶梯' },
        items: [
          {
            No: 'P1',
            PartNo: 'XN1',
            PartName: '件',
            Spec: '',
            ParamSpec: '',
            Qty: 1,
            Unit: 'EA',
            SONo: '',
            Remark: '',
          },
        ],
        specs: [],
      }),
    ).toThrow('缺少生产编号')

    expect(() =>
      prepareManualOrExcelPoGroups({
        order: { endDate: '2026-11-25', spec: '散件' },
        items: [
          {
            No: 'P1',
            PartNo: 'XN1',
            PartName: '件',
            Spec: '',
            ParamSpec: '',
            Qty: 1.5,
            Unit: 'EA',
            SONo: '',
            Remark: '',
          },
        ],
        specs: [],
      }),
    ).toThrow('非负整数')
  })
})
