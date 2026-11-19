import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  readWorkshopMiscMaterialsSearchFilters,
  writeWorkshopMiscMaterialsSearchFilters,
} from '@/services/workshopMiscMaterialsSearchFields'

/** 列表页的 URL 状态：page / pageSize / 型号 / 客户型号 / 规格 / 类别 */
export function useWorkshopMiscMaterialsListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const filters = useMemo(
    () => readWorkshopMiscMaterialsSearchFilters(searchParams),
    [searchParams],
  )

  const setFilters = useCallback(
    (next?: WorkshopMiscMaterialsSearchFilters) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev)
        params.set('page', '1')
        writeWorkshopMiscMaterialsSearchFilters(params, next)
        return params
      }, { replace: true })
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
        }, { replace: true })
      }
    },
    [page, setSearchParams],
  )

  return { page, pageSize, filters, setFilters, stepBackIfEmpty }
}
