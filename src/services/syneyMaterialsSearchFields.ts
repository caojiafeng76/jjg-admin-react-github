/** 西尼材料列表页组合筛选：复用金檀木业的通用读写/查询拼装，只定义字段 */
import type { JintanSearchField } from './jintanSearchFields'

export type { JintanSearchFilters as SyneyMaterialsSearchFilters } from './jintanSearchFields'

export const SYNEY_MATERIALS_SEARCH_FIELDS: readonly JintanSearchField[] = [
  { key: 'name', column: 'material_name', label: '品名' },
  { key: 'specification', column: 'specification', label: '规格' },
]

/** 去掉会破坏 PostgREST or() 语法的字符，供下拉搜索使用 */
export function sanitizeSyneyMaterialsKeyword(keyword?: string): string {
  return (keyword ?? '').replace(/[,()]/g, ' ').trim()
}
