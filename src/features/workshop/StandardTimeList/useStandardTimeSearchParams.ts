import type { ProcessStandardRecordType } from '@/services/apiStandardTimes'
import { useCallback, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

export interface StandardTimeSearchParams {
  operation?: string
  model?: string
  partNo?: string
  unmatchedOnly?: boolean
  partNoOnly?: boolean
  updatedStartDate?: string
  updatedEndDate?: string
  recordType?: ProcessStandardRecordType
}

// 写入 URL 的顺序与历史实现保持一致
const URL_SEARCH_KEYS = [
  'operation',
  'model',
  'partNo',
  'unmatchedOnly',
  'partNoOnly',
  'recordType',
  'updatedStartDate',
  'updatedEndDate',
] as const satisfies ReadonlyArray<keyof StandardTimeSearchParams>

function readSearchParamsFromURL(
  searchParamsURL: URLSearchParams,
): StandardTimeSearchParams {
  return {
    operation: searchParamsURL.get('operation') || undefined,
    model: searchParamsURL.get('model') || undefined,
    partNo: searchParamsURL.get('partNo') || undefined,
    unmatchedOnly: searchParamsURL.get('unmatchedOnly') === 'true' || undefined,
    partNoOnly: searchParamsURL.get('partNoOnly') === 'true' || undefined,
    updatedStartDate: searchParamsURL.get('updatedStartDate') || undefined,
    updatedEndDate: searchParamsURL.get('updatedEndDate') || undefined,
    recordType:
      (searchParamsURL.get('recordType') as ProcessStandardRecordType)
      || undefined,
  }
}

/** 成本核算列表的分页与搜索条件，和 URL 查询参数双向同步 */
export function useStandardTimeSearchParams() {
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [searchParams, setSearchParams] = useState<StandardTimeSearchParams>(
    () => readSearchParamsFromURL(searchParamsURL),
  )

  const applySearch = useCallback(
    (params: StandardTimeSearchParams) => {
      setSearchParams(params)
      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)

      nextSearchParamsURL.set('page', '1')

      for (const key of URL_SEARCH_KEYS) {
        const value = params[key]

        if (value) {
          nextSearchParamsURL.set(key, value === true ? 'true' : value)
        }
        else {
          nextSearchParamsURL.delete(key)
        }
      }

      setSearchParamsURL(nextSearchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const resetSearch = useCallback(() => {
    setSearchParams({})
    const nextSearchParamsURL = new URLSearchParams(searchParamsURL)

    nextSearchParamsURL.set('page', '1')
    for (const key of URL_SEARCH_KEYS) {
      nextSearchParamsURL.delete(key)
    }

    setSearchParamsURL(nextSearchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  return {
    page,
    pageSize,
    searchParams,
    searchParamsURL,
    setSearchParamsURL,
    applySearch,
    resetSearch,
  }
}
