import { describe, expect, it } from 'vitest'

import {
  extractBrandFromItems,
  extractSpecFromItems,
  isValidStandardSyneySpec,
  normalizeSyneyPartNo,
  SYNEY_LOOSE_PARTS_SPEC,
  SYNEY_SPEC_OPTIONS,
  SYNEY_STANDARD_SPEC_OPTIONS,
} from './syneyOrderDefaults'

describe('西尼订单默认值与规则共享工具', () => {
  it('规范化件号时去除空白与开头非字母数字前缀', () => {
    expect(normalizeSyneyPartNo('  *XN2808EB01  ')).toBe('XN2808EB01')
    expect(normalizeSyneyPartNo('---xn3024br')).toBe('xn3024br')
    expect(normalizeSyneyPartNo(null)).toBe('')
    expect(normalizeSyneyPartNo(undefined)).toBe('')
  })

  it('区分 13 项标准规格与散件选项', () => {
    expect(SYNEY_STANDARD_SPEC_OPTIONS).toHaveLength(13)
    expect(SYNEY_SPEC_OPTIONS).toEqual([
      ...SYNEY_STANDARD_SPEC_OPTIONS,
      SYNEY_LOOSE_PARTS_SPEC,
    ])
    expect(isValidStandardSyneySpec('1000型-室内-扶梯')).toBe(true)
    expect(isValidStandardSyneySpec('800型-室内-老围框')).toBe(true)
    expect(isValidStandardSyneySpec(SYNEY_LOOSE_PARTS_SPEC)).toBe(false)
    expect(isValidStandardSyneySpec('1200型-室内-扶梯')).toBe(false)
  })

  it('从后板备注提取带括号的商标/品牌名称', () => {
    expect(
      extractBrandFromItems([
        {
          No: 'P1',
          PartNo: 'XN2808AF01',
          PartName: '前沿后板',
          Spec: '1000型',
          ParamSpec: '',
          Qty: 1,
          Unit: 'EA',
          Remark: '品牌: 现代电梯(杭州)有限公司，注意保护',
          SONo: 'SO-1',
        },
      ]),
    ).toBe('现代电梯(杭州)有限公司')

    expect(
      extractBrandFromItems([
        {
          No: 'P1',
          PartNo: 'XN2808AF01',
          PartName: '后板组件',
          Spec: '1000型',
          ParamSpec: '',
          Qty: 1,
          Unit: 'EA',
          Remark: '商标为 OTIS(China) Elevator ，其他',
          SONo: 'SO-1',
        },
      ]),
    ).toBe('OTIS(China)')
  })

  it('识别 XN2838 前沿板件号为扶梯规格', () => {
    expect(
      extractSpecFromItems([
        {
          No: 'P1',
          PartNo: '*XN2838AB01',
          PartName: '前沿板',
          Spec: '800型',
          ParamSpec: '',
          Qty: 1,
          Unit: 'EA',
          Remark: '',
          SONo: 'SO-1',
        },
        {
          No: 'P1',
          PartNo: 'XN2838BP01',
          PartName: '上中板',
          Spec: '800型 室外',
          ParamSpec: '',
          Qty: 1,
          Unit: 'EA',
          Remark: '',
          SONo: 'SO-1',
        },
      ]),
    ).toBe('800型-室外-扶梯')
  })
})
