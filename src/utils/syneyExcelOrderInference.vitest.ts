import { describe, expect, it } from 'vitest'

import { normalizeZip64ExcelBuffer } from './excelZip64'
import {
  extractBrandFromBackPlate,
  extractSpecFromAllRows,
  extractTechnique,
  inferConsistentSpecFromRows,
} from './syneyExcelOrderInference'

describe('西尼 Excel 订单推断规则', () => {
  it('从后板备注提取商标', () => {
    expect(
      extractBrandFromBackPlate([
        { 物料名称: '后板', 备注: '前沿板中间，商标为现代电梯，其他' },
      ]),
    ).toBe('现代电梯')
    expect(extractBrandFromBackPlate([{ 物料名称: '中板' }])).toBeNull()
  })

  it('工艺要求排除否定描述，并按前/后/中板汇总', () => {
    expect(
      extractTechnique([
        { 物料名称: '前沿板', 备注: '不带支撑角钢' },
        { 物料名称: '后板', 备注: '商标在前沿板中间' },
        { 物料名称: '上中板', 备注: '带雷达孔，不剪角' },
      ]),
    ).toBe('前：商标,中：雷达孔,中：不剪角')
    expect(extractTechnique([{ 物料名称: '前沿板', 备注: '带角钢' }])).toBe(
      '前：角钢',
    )
  })

  it('后备规格推断需同时识别型号与扶梯/人行道类型', () => {
    expect(
      extractSpecFromAllRows([{ 物料件号: 'XN2808AA', 规格: '800 室外' }]),
    ).toBe('800型-室外-扶梯')
    expect(extractSpecFromAllRows([{ 物料件号: 'ABC', 规格: '800型' }])).toBe(
      null,
    )
  })

  it('同一生产编号按前沿板件号与中板规格推断规格', () => {
    expect(
      inferConsistentSpecFromRows([
        { 生产编号: 'S1', 物料件号: 'XN3024BR01', 物料名称: '前沿板' },
        { 生产编号: 'S1', 物料名称: '中板', 规格: '1000型 室内' },
      ]),
    ).toEqual({ spec: '1000型-室内-人行道', hasMixedSpecs: false })
  })
})

describe('normalizeZip64ExcelBuffer', () => {
  it('非 ZIP 数据原样返回', () => {
    const data = new Uint8Array([1, 2, 3]).buffer

    expect(normalizeZip64ExcelBuffer(data)).toBe(data)
  })

  it('本地文件头的 ZIP64 占位大小回填为扩展字段中的真实大小', () => {
    const fileName = 'a'
    const extraLength = 4 + 16
    const payloadLength = 3
    const buffer = new ArrayBuffer(30 + fileName.length + extraLength + 3)
    const view = new DataView(buffer)

    view.setUint32(0, 0x04034B50, true)
    view.setUint32(18, 0xFFFFFFFF, true)
    view.setUint32(22, 0xFFFFFFFF, true)
    view.setUint16(26, fileName.length, true)
    view.setUint16(28, extraLength, true)
    const extraStart = 30 + fileName.length
    view.setUint16(extraStart, 0x0001, true)
    view.setUint16(extraStart + 2, 16, true)
    view.setBigUint64(extraStart + 4, 5n, true)
    view.setBigUint64(extraStart + 12, BigInt(payloadLength), true)

    normalizeZip64ExcelBuffer(buffer)

    expect(view.getUint32(18, true)).toBe(payloadLength)
    expect(view.getUint32(22, true)).toBe(5)
  })
})
