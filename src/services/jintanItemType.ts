/** 金檀素材/型材类型 */
export type JintanItemType = 'A' | 'B'

export const JINTAN_ITEM_TYPES: readonly JintanItemType[] = ['A', 'B']

export const DEFAULT_JINTAN_ITEM_TYPE: JintanItemType = 'A'

export const JINTAN_ITEM_TYPE_OPTIONS = JINTAN_ITEM_TYPES.map(value => ({
  value,
  label: value,
}))

/**
 * 解析类型文本（Excel 单元格、URL 参数）：忽略首尾空格和大小写。
 * 不是 A、B 时返回 null，空值如何处理由调用方决定。
 */
export function parseJintanItemType(value: unknown): JintanItemType | null {
  const text = String(value ?? '').trim().toUpperCase()
  return text === 'A' || text === 'B' ? text : null
}
