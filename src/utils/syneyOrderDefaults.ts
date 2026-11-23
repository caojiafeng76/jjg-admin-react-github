import type { ISyneyItem } from '@/types'

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

  if (backPlateItem && backPlateItem.Remark) {
    const remark = backPlateItem.Remark

    // 优先匹配 "商标为" 格式（如：商标为现代电梯）
    let brandMatch = remark.match(/商标为\s*([^\s，,。]+)/)
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1].trim()
    }

    // 匹配 "商标:" 或 "商标：" 格式
    brandMatch = remark.match(/商标[:：]\s*([^\s，,。]+)/)
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1].trim()
    }

    // 匹配 "品牌:" 后面的内容,支持括号(如 "现代电梯(杭州)有限公司")
    // eslint-disable-next-line regexp/no-super-linear-backtracking -- 备注文本很短，保持原有匹配语义
    brandMatch = remark.match(/品牌[:：\s]*([^\s，,。]+(?:\([^)]+\))?[^\s，,。]*)/)
    if (brandMatch && brandMatch[1]) {
      return brandMatch[1].trim()
    }
  }

  return null
}

function normalizePartNo(partNo: string) {
  return partNo.replace(/^[^A-Z0-9]+/i, '')
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
  let type = ''
  const partNo = normalizePartNo(frontPlateItem.PartNo || '')

  // XN2808EB 系列是扶梯，XN3024BR 系列是人行道
  if (partNo.startsWith('XN2808EB') || partNo.startsWith('XN2808')) {
    type = '扶梯'
  }
  else if (partNo.startsWith('XN3024BR') || partNo.startsWith('XN3024')) {
    type = '人行道'
  }
  else if (partNo.startsWith('XN2838')) {
    type = '扶梯' // 800型扶梯
  }

  if (!type) {
    return null
  }

  // 4. 从中板的 Spec 字段推断环境
  let environment = '室内' // 默认室内

  // 查找中板组件（上前中板组件、下前中板组件）
  const middlePlateItem = items.find((item) => {
    const partNo = normalizePartNo(item.PartNo || '')
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

  // 6. 验证规格是否存在于支持的选项中
  const validSpecs = [
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
  ]

  return validSpecs.includes(spec) ? spec : null
}
