/** 车间杂项材料列表页多字段组合筛选：字段定义、URL 读写与查询拼装 */

export type WorkshopMiscMaterialsSearchFieldKey
  = | 'model'
    | 'customerModel'
    | 'specification'
    | 'category'

export type WorkshopMiscMaterialsSearchFilters = Partial<
  Record<WorkshopMiscMaterialsSearchFieldKey, string>
>

export interface WorkshopMiscMaterialsSearchField {
  /** URL 参数名与表单字段名 */
  key: WorkshopMiscMaterialsSearchFieldKey
  /** 数据库列名 */
  column: string
  /** 输入框占位文字 */
  label: string
}

export const WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS: readonly WorkshopMiscMaterialsSearchField[] = [
  { key: 'model', column: 'model', label: '型号' },
  { key: 'customerModel', column: 'customer_model', label: '客户型号' },
  { key: 'specification', column: 'specification', label: '规格' },
  { key: 'category', column: 'category', label: '类别' },
]

/** 所有可能出现的筛选键，按固定顺序，用于 queryKey 归一化与 URL 清理 */
const ALL_SEARCH_KEYS: readonly WorkshopMiscMaterialsSearchFieldKey[] = [
  'model',
  'customerModel',
  'specification',
  'category',
]

/** trim、去掉空值并按固定键序输出，保证 queryKey 稳定 */
export function normalizeWorkshopMiscMaterialsSearchFilters(
  filters?: WorkshopMiscMaterialsSearchFilters,
): WorkshopMiscMaterialsSearchFilters {
  const result: WorkshopMiscMaterialsSearchFilters = {}
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
export function applyWorkshopMiscMaterialsSearchFilters<
  Q extends { ilike: (column: string, pattern: string) => Q },
>(
  query: Q,
  filters?: WorkshopMiscMaterialsSearchFilters,
): Q {
  let next = query
  for (const field of WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS) {
    const value = filters?.[field.key]?.trim()
    if (value)
      next = next.ilike(field.column, `%${escapeLikePattern(value)}%`)
  }
  return next
}

export function readWorkshopMiscMaterialsSearchFilters(
  params: URLSearchParams,
): WorkshopMiscMaterialsSearchFilters {
  const result: WorkshopMiscMaterialsSearchFilters = {}
  for (const field of WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS) {
    const value = params.get(field.key)?.trim()
    if (value)
      result[field.key] = value
  }
  return result
}

/** 把筛选写回 URL：有值的写入，空值和旧的 keyword 参数删除 */
export function writeWorkshopMiscMaterialsSearchFilters(
  params: URLSearchParams,
  filters?: WorkshopMiscMaterialsSearchFilters,
): void {
  params.delete('keyword')
  for (const field of WORKSHOP_MISC_MATERIALS_SEARCH_FIELDS) {
    const value = filters?.[field.key]?.trim()
    if (value)
      params.set(field.key, value)
    else
      params.delete(field.key)
  }
}

/** 去掉会破坏 PostgREST or() 语法的字符，供下拉远程搜索使用 */
export function sanitizeWorkshopMiscMaterialsKeyword(keyword?: string): string {
  return (keyword ?? '').replace(/[,()]/g, ' ').trim()
}

/** 单个关键词同时模糊匹配型号、客户型号、规格或类别 */
export function applyWorkshopMiscMaterialsKeyword<
  Q extends { or: (filters: string) => Q },
>(
  query: Q,
  keyword?: string,
): Q {
  const text = sanitizeWorkshopMiscMaterialsKeyword(keyword)
  return text
    ? query.or(
        `model.ilike.%${text}%,customer_model.ilike.%${text}%,specification.ilike.%${text}%,category.ilike.%${text}%`,
      )
    : query
}
