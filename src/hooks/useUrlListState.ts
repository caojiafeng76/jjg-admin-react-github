import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE } from '@/config/pagination'

export type UrlListFilters<K extends string> = Partial<Record<K, string>>

export interface UrlListState<K extends string> {
  page: number
  pageSize: number
  /** 当前筛选条件（始终从 URL 派生，不另存 useState，菜单/标签/刷新后保持一致） */
  filters: UrlListFilters<K>
  /** 应用筛选：写入 URL 并回到第 1 页；空字符串 / undefined 视为清除该条件 */
  setFilters: (next: UrlListFilters<K>) => void
  /** 清空全部筛选并回到第 1 页 */
  resetFilters: () => void
  /** 跳转到指定页（例如删除后当前页为空时回退一页） */
  setPage: (page: number) => void
}

/**
 * 列表页 URL 状态（规范见 docs/前端交互与反馈规范.md §状态）
 *
 * - 筛选 / page / pageSize 全部以 URL 为唯一数据源
 * - 所有修改使用 replace，不污染浏览器历史（与 AppPagination 一致）
 * - 筛选值统一为字符串；日期区间、多选等请在页面侧自行序列化
 *
 * @example
 * ```ts
 * const { page, pageSize, filters, setFilters, resetFilters }
 *   = useUrlListState(['keyword', 'status'] as const)
 * ```
 */
export function useUrlListState<K extends string>(
  filterKeys: readonly K[],
  { defaultPageSize = DEFAULT_PAGE_SIZE }: { defaultPageSize?: number } = {},
): UrlListState<K> {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || defaultPageSize

  const keysSignature = filterKeys.join('|')
  const filters = useMemo(() => {
    const result: UrlListFilters<K> = {}
    for (const key of keysSignature.split('|') as K[]) {
      const value = searchParams.get(key)?.trim()
      if (value)
        result[key] = value
    }
    return result
  }, [keysSignature, searchParams])

  const setFilters = useCallback((next: UrlListFilters<K>) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      for (const key of keysSignature.split('|') as K[]) {
        const value = next[key]?.trim()
        if (value)
          params.set(key, value)
        else
          params.delete(key)
      }
      params.set('page', '1')
      return params
    }, { replace: true })
  }, [keysSignature, setSearchParams])

  const resetFilters = useCallback(() => {
    setFilters({})
  }, [setFilters])

  const setPage = useCallback((nextPage: number) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      params.set('page', String(Math.max(nextPage, 1)))
      return params
    }, { replace: true })
  }, [setSearchParams])

  return { page, pageSize, filters, setFilters, resetFilters, setPage }
}
