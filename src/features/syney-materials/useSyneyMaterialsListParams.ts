import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  readJintanSearchFilters,
  writeJintanSearchFilters,
} from '@/services/jintanSearchFields'
import { SYNEY_MATERIALS_SEARCH_FIELDS } from '@/services/syneyMaterialsSearchFields'

/** 列表页的 URL 状态：page / pageSize / 品名 / 规格 */
export function useSyneyMaterialsListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const filters = useMemo(
    () => readJintanSearchFilters(searchParams, SYNEY_MATERIALS_SEARCH_FIELDS),
    [searchParams],
  )

  const setFilters = useCallback(
    (next?: SyneyMaterialsSearchFilters) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('page', '1')
        writeJintanSearchFilters(params, next, SYNEY_MATERIALS_SEARCH_FIELDS)
        return params
      })
    },
    [setSearchParams],
  )

  /** 当前页删空后回退一页 */
  const stepBackIfEmpty = useCallback(
    (itemCount: number | undefined) => {
      if (page > 1 && itemCount === 0) {
        setSearchParams((prev) => {
          const params = new URLSearchParams(prev)
          params.set('page', String(page - 1))
          return params
        })
      }
    },
    [page, setSearchParams],
  )

  return { page, pageSize, filters, setFilters, stepBackIfEmpty }
}
