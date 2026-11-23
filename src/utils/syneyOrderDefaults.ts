import type { ISyneyItem } from '@/types'

export const SYNEY_LOOSE_PARTS_SPEC = '散件'

export const SYNEY_STANDARD_SPEC_OPTIONS = [
  '1000型-室内-扶梯',
  '1000型-室外-扶梯',
  '1000型-室内-人行道',
  '1000型-室外-人行道',
  '800型-室内-扶梯',
  '800型-室外-扶梯',
  '800型-室内-人行道',
  '800型-室外-人行道',
  '600型-室内-扶梯',
  '600型-室外-扶梯',
  '1000型-室内-老围框',
  '800型-室内-老围框',
  '600型-室内-老围框',
] as const

export const SYNEY_SPEC_OPTIONS = [
  ...SYNEY_STANDARD_SPEC_OPTIONS,
  SYNEY_LOOSE_PARTS_SPEC,
] as const

const STANDARD_SPEC_SET = new Set<string>(SYNEY_STANDARD_SPEC_OPTIONS)

const BRAND_CAPTURE_SOURCE = '((?:[^\\s，,。()]|\\([^)]*\\))+)'
const BRAND_PATTERNS = [
  new RegExp(`商标为\\s*${BRAND_CAPTURE_SOURCE}`),
  new RegExp(`商标[:：]\\s*${BRAND_CAPTURE_SOURCE}`),
  new RegExp(`品牌[:：\\s]+${BRAND_CAPTURE_SOURCE}`),
]

export function isSyneyLoosePartsSpec(spec: string | null | undefined) {
  return spec?.trim() === SYNEY_LOOSE_PARTS_SPEC
}

export function isValidStandardSyneySpec(
  spec: string | null | undefined,
): spec is (typeof SYNEY_STANDARD_SPEC_OPTIONS)[number] {
  return typeof spec === 'string' && STANDARD_SPEC_SET.has(spec)
}

/** 规范化西尼物料件号：去除首尾空白及开头非字母数字前缀 */
export function normalizeSyneyPartNo(partNo: string | null | undefined): string {
  return (partNo || '').trim().replace(/^[^A-Z0-9]+/i, '')
}

/**
 * 从备注文本中提取商标/品牌名，统一支持带括号的品牌名称（如 "现代电梯(杭州)有限公司"）
 */
export function extractBrandFromRemark(
  remark: string | null | undefined,
): string | null {
  if (!remark) {
    return null
  }

  for (const pattern of BRAND_PATTERNS) {
    const match = remark.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

/**
 * 根据物料件号判断产品类型（扶梯 / 人行道），兼容 XN2808 / XN2838 / XN3024 系列
 */
export function inferSyneySpecTypeFromPartNo(
  rawPartNo: string | null | undefined,
): '扶梯' | '人行道' | null {
  const partNo = normalizeSyneyPartNo(rawPartNo)

  // XN2808EB / XN2808 系列及 XN2838 系列（800型）均属于扶梯
  if (
    partNo.includes('XN2808EB')
    || partNo.startsWith('XN2808')
    || partNo.startsWith('XN2838')
  ) {
    return '扶梯'
  }

  // XN3024BR / XN3024 系列属于人行道
  if (partNo.includes('XN3024BR') || partNo.startsWith('XN3024')) {
    return '人行道'
  }

  return null
}

/**
 * 从订单条目中提取商标信息
 * @param items - 订单明细数组
 * @returns 提取的商标名称,如果没有找到则返回 null
 */
export function extractBrandFromItems(items: ISyneyItem[]): string | null {
  // 查找后板组件（前沿后板组件）
  const backPlateItem = items.find(
    item =>
      item.PartName?.includes('前沿后板') || item.PartName?.includes('后板'),
  )

  return extractBrandFromRemark(backPlateItem?.Remark)
}

/**
 * 从订单条目中提取规格信息
 * @param items - 订单明细数组
 * @returns 推断的规格,如果无法推断则返回 null
 */
export function extractSpecFromItems(items: ISyneyItem[]): string | null {
  // 1. 查找前沿板组件
  const frontPlateItem = items.find(
    item =>
      item.PartName?.includes('前沿板')
      || item.PartNo?.startsWith('XN2808EB')
      || item.PartNo?.startsWith('XN3024BR'),
  )

  if (!frontPlateItem) {
    return null
  }

  // 2. 从 Spec 字段提取型号（1000型/800型/600型）
  let model = ''
  if (frontPlateItem.Spec) {
    const specMatch = frontPlateItem.Spec.match(/(1000型?|800型?|600型?)/)
    if (specMatch) {
      model = specMatch[1].includes('型') ? specMatch[1] : `${specMatch[1]}型`
    }
  }

  if (!model) {
    return null
  }

  // 3. 从件号判断类型（扶梯/人行道）
  const type = inferSyneySpecTypeFromPartNo(frontPlateItem.PartNo)
  if (!type) {
    return null
  }

  // 4. 从中板的 Spec 字段推断环境
  let environment = '室内' // 默认室内

  // 查找中板组件（上前中板组件、下前中板组件）
  const middlePlateItem = items.find((item) => {
    const partNo = normalizeSyneyPartNo(item.PartNo)
    return (
      item.PartName?.includes('中板')
      || partNo.startsWith('XN2808BP')
      || partNo.startsWith('XN2808BQ')
      || partNo.startsWith('XN3024BS')
      || partNo.startsWith('XN3024BT')
      || partNo.startsWith('XN3024AP')
      || partNo.startsWith('XN3024AQ')
    )
  })

  if (middlePlateItem && middlePlateItem.Spec) {
    // 从 Spec 字段匹配环境（如 "1000型 室内" 或 "1000型 室外"）
    if (middlePlateItem.Spec.includes('室外')) {
      environment = '室外'
    }
    else if (middlePlateItem.Spec.includes('室内')) {
      environment = '室内'
    }
  }

  // 5. 组合规格
  const spec = `${model}-${environment}-${type}`

  // 6. 验证规格是否存在于支持的标准选项中
  return isValidStandardSyneySpec(spec) ? spec : null
}
