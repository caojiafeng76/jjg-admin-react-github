/** 金檀木业列表页多字段组合筛选：字段定义、URL 读写与查询拼装 */

export type JintanSearchFieldKey
  = | 'model'
    | 'name'
    | 'specification'
    | 'color'
    | 'material'
    | 'supplier'

export type JintanSearchFilters = Partial<Record<JintanSearchFieldKey, string>>

export interface JintanSearchField {
  /** URL 参数名与表单字段名 */
  key: JintanSearchFieldKey
  /** 数据库列名 */
  column: string
  /** 输入框占位文字 */
  label: string
}

export const JINTAN_PARTS_SEARCH_FIELDS: readonly JintanSearchField[] = [
  { key: 'name', column: 'part_name', label: '名称' },
  { key: 'specification', column: 'specification', label: '规格' },
  { key: 'color', column: 'color', label: '颜色' },
  { key: 'material', column: 'material', label: '材质' },
  { key: 'supplier', column: 'supplier', label: '采购厂家' },
]

export const JINTAN_PROFILES_SEARCH_FIELDS: readonly JintanSearchField[] = [
  { key: 'model', column: 'profile_model', label: '型号' },
  { key: 'name', column: 'profile_name', label: '名称' },
  { key: 'specification', column: 'specification', label: '规格' },
  { key: 'color', column: 'color', label: '颜色' },
  { key: 'material', column: 'material', label: '材质' },
]

export const JINTAN_MATERIALS_SEARCH_FIELDS: readonly JintanSearchField[] = [
  { key: 'model', column: 'material_model', label: '型号' },
  { key: 'name', column: 'material_name', label: '名称' },
  { key: 'specification', column: 'specification', label: '规格' },
  { key: 'material', column: 'material', label: '材质' },
]

/** 所有可能出现的筛选键，按固定顺序，用于 queryKey 归一化与 URL 清理 */
const ALL_SEARCH_KEYS: readonly JintanSearchFieldKey[] = [
  'model',
  'name',
  'specification',
  'color',
  'material',
  'supplier',
]

/** trim、去掉空值并按固定键序输出，保证 queryKey 稳定 */
export function normalizeJintanSearchFilters(
  filters?: JintanSearchFilters,
): JintanSearchFilters {
  const result: JintanSearchFilters = {}
  for (const key of ALL_SEARCH_KEYS) {
    const value = filters?.[key]?.trim()
    if (value)
      result[key] = value
  }
  return result
}

/** 转义 LIKE 通配符，让用户输入的 % _ \ 按字面匹配 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, char => `\\${char}`)
}

/** 每个非空字段追加一个 ilike 模糊条件，字段之间为 AND */
export function applyJintanSearchFilters<
  Q extends { ilike: (column: string, pattern: string) => Q },
>(
  query: Q,
  filters: JintanSearchFilters | undefined,
  fields: readonly JintanSearchField[],
): Q {
  let next = query
  for (const field of fields) {
    const value = filters?.[field.key]?.trim()
    if (value)
      next = next.ilike(field.column, `%${escapeLikePattern(value)}%`)
  }
  return next
}

export function readJintanSearchFilters(
  params: URLSearchParams,
  fields: readonly JintanSearchField[],
): JintanSearchFilters {
  const result: JintanSearchFilters = {}
  for (const field of fields) {
    const value = params.get(field.key)?.trim()
    if (value)
      result[field.key] = value
  }
  return result
}

/** 把筛选写回 URL：有值的写入，空值和旧的 keyword 参数删除 */
export function writeJintanSearchFilters(
  params: URLSearchParams,
  filters: JintanSearchFilters | undefined,
  fields: readonly JintanSearchField[],
): void {
  params.delete('keyword')
  for (const field of fields) {
    const value = filters?.[field.key]?.trim()
    if (value)
      params.set(field.key, value)
    else
      params.delete(field.key)
  }
}
