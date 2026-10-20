import type { JintanPartsStockStatus } from '@/services/apiJintanPartsInventory'

export const JINTAN_PARTS_THRESHOLD_MULTIPLE = 5
export const JINTAN_PARTS_DEFAULT_SAFETY_MULTIPLE = 10

export interface JintanPartsStockStatusConfig {
  label: string
  description: string
  /** antd Tag color；未设置不着色 */
  tagColor?: 'error' | 'warning' | 'success'
  /** Excel 单元格底色 / 字体色（Excel 条件格式的标准红黄绿） */
  excelFill?: string
  excelFont?: string
}

export const JINTAN_PARTS_STOCK_STATUS_CONFIG: Record<
  JintanPartsStockStatus,
  JintanPartsStockStatusConfig
> = {
  danger: {
    label: '不足',
    description: '库存低于阈值（单台数量 × 5）',
    tagColor: 'error',
    excelFill: 'FFC7CE',
    excelFont: '9C0006',
  },
  warning: {
    label: '偏低',
    description: '库存介于阈值与安全库存之间',
    tagColor: 'warning',
    excelFill: 'FFEB9C',
    excelFont: '9C5700',
  },
  safe: {
    label: '充足',
    description: '库存达到安全库存（单台数量 × 倍数）',
    tagColor: 'success',
    excelFill: 'C6EFCE',
    excelFont: '006100',
  },
  unset: {
    label: '未设置',
    description: '未设置单台数量，不判断库存状态',
  },
}

export const JINTAN_PARTS_STOCK_STATUS_OPTIONS = (
  Object.entries(JINTAN_PARTS_STOCK_STATUS_CONFIG) as Array<
    [JintanPartsStockStatus, JintanPartsStockStatusConfig]
  >
).map(([value, config]) => ({ value, label: config.label }))

export function isJintanPartsStockStatus(
  value: unknown,
): value is JintanPartsStockStatus {
  return (
    typeof value === 'string'
    && Object.hasOwn(JINTAN_PARTS_STOCK_STATUS_CONFIG, value)
  )
}

/** 表单实时预览用；列表展示以数据库生成列为准 */
export function calcJintanPartsSafetyStock(
  unitQuantity: number | null | undefined,
  safetyMultiple: number | null | undefined,
): { safetyStock: number, thresholdStock: number } | null {
  if (!unitQuantity || unitQuantity <= 0) {
    return null
  }

  return {
    safetyStock:
      unitQuantity * (safetyMultiple ?? JINTAN_PARTS_DEFAULT_SAFETY_MULTIPLE),
    thresholdStock: unitQuantity * JINTAN_PARTS_THRESHOLD_MULTIPLE,
  }
}

/** 与数据库 stock_status 生成列口径一致：≥ 安全库存为充足，< 阈值为不足 */
export function getJintanPartsStockStatus(
  quantity: number,
  unitQuantity: number | null | undefined,
  safetyMultiple: number | null | undefined,
): JintanPartsStockStatus {
  const result = calcJintanPartsSafetyStock(unitQuantity, safetyMultiple)
  if (!result)
    return 'unset'
  if (quantity >= result.safetyStock)
    return 'safe'
  if (quantity < result.thresholdStock)
    return 'danger'
  return 'warning'
}
