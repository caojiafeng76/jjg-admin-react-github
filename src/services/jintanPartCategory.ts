import type { JintanItemType } from './jintanItemType'
import { JINTAN_ITEM_TYPES } from './jintanItemType'

/** 金檀配件类别 */
export type JintanPartCategory = '140U' | '220U' | '通用'

export const JINTAN_PART_CATEGORIES: readonly JintanPartCategory[] = ['140U', '220U', '通用']

export const DEFAULT_JINTAN_PART_CATEGORY: JintanPartCategory = '通用'

export const JINTAN_PART_CATEGORY_OPTIONS = JINTAN_PART_CATEGORIES.map(value => ({
  value,
  label: value,
}))

/**
 * 解析类别文本（Excel 单元格、URL 参数）：忽略首尾空格与英文大小写。
 * 不是 140U、220U、通用 时返回 null。
 */
export function parseJintanPartCategory(value: unknown): JintanPartCategory | null {
  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }
  const upper = text.toUpperCase()
  if (upper === '140U' || upper === '220U') {
    return upper
  }
  return text === '通用' ? '通用' : null
}

export interface JintanPartSheetGroup {
  partCategory: JintanPartCategory
  itemType: JintanItemType
  /** 例如 140U-A、140U-B、220U-A、220U-B、通用-A、通用-B */
  label: string
}

/**
 * 生成配件导出工作表分组，默认按 140U-A / 140U-B / 220U-A / 220U-B / 通用-A / 通用-B 顺序。
 * 传入筛选条件时仅生成匹配的工作表分组。
 */
export function getJintanPartSheetGroups(options?: {
  partCategory?: JintanPartCategory
  itemType?: JintanItemType
}): JintanPartSheetGroup[] {
  const categories = options?.partCategory ? [options.partCategory] : JINTAN_PART_CATEGORIES
  const itemTypes = options?.itemType ? [options.itemType] : JINTAN_ITEM_TYPES
  const groups: JintanPartSheetGroup[] = []

  for (const partCategory of categories) {
    for (const itemType of itemTypes) {
      groups.push({
        partCategory,
        itemType,
        label: `${partCategory}-${itemType}`,
      })
    }
  }

  return groups
}
