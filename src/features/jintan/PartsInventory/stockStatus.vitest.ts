import { describe, expect, it } from 'vitest'

import {
  calcJintanPartsSafetyStock,
  getJintanPartsStockStatus,
  isJintanPartsStockStatus,
  JINTAN_PARTS_STOCK_STATUS_OPTIONS,
} from './stockStatus'

describe('金檀木业配件安全库存口径', () => {
  it('安全库存 = 单台 × 倍数，阈值 = 单台 × 5；未设置单台返回 null', () => {
    expect(calcJintanPartsSafetyStock(14, 10)).toEqual({
      safetyStock: 140,
      thresholdStock: 70,
    })
    expect(calcJintanPartsSafetyStock(2, 15)).toEqual({
      safetyStock: 30,
      thresholdStock: 10,
    })
    expect(calcJintanPartsSafetyStock(3, undefined)).toEqual({
      safetyStock: 30,
      thresholdStock: 15,
    })
    expect(calcJintanPartsSafetyStock(null, 10)).toBeNull()
    expect(calcJintanPartsSafetyStock(0, 10)).toBeNull()
  })

  it('≥ 安全库存为充足，< 阈值为不足，等于阈值算偏低', () => {
    expect(getJintanPartsStockStatus(140, 14, 10)).toBe('safe')
    expect(getJintanPartsStockStatus(139, 14, 10)).toBe('warning')
    expect(getJintanPartsStockStatus(70, 14, 10)).toBe('warning')
    expect(getJintanPartsStockStatus(69, 14, 10)).toBe('danger')
    expect(getJintanPartsStockStatus(0, 14, 10)).toBe('danger')
    expect(getJintanPartsStockStatus(100, null, 10)).toBe('unset')
  })

  it('状态选项按 不足/偏低/充足/未设置 排列并可校验 URL 参数', () => {
    expect(JINTAN_PARTS_STOCK_STATUS_OPTIONS.map(o => o.label)).toEqual([
      '不足',
      '偏低',
      '充足',
      '未设置',
    ])
    expect(isJintanPartsStockStatus('danger')).toBe(true)
    expect(isJintanPartsStockStatus('toString')).toBe(false)
    expect(isJintanPartsStockStatus(null)).toBe(false)
  })
})
