import type { ISyneyItem, ISyneyPo } from '@/types'

/**
 * Excel解析结果类型
 */
export interface ExcelData {
  headers: string[]
  rows: ExcelRow[]
}

/**
 * Excel行数据类型
 */
export interface ExcelRow {
  [key: string]: string | number | null | undefined
  采购单号?: string
  采购单状态?: string
  供应商名称?: string
  商标?: string
  交货日期?: number | string
  交货地点?: string
  物料件号?: string
  物料名称?: string
  规格?: string
  参数规格?: string
  核算数量?: number
  核算单位?: string
  计量数量?: number
  计量单位?: string
  生产编号?: string
  备注?: string
  订单备注?: string
}

/**
 * 数据验证结果
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 转换后的订单数据
 */
export interface TransformedOrderData {
  po: Partial<ISyneyPo>
  items: Partial<ISyneyItem>[]
  // 规格是否是通过后备逻辑推断的（需要用户确认）
  specInferred?: boolean
}
