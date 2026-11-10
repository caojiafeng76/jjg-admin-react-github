import { useCallback, useState } from 'react'

import { useDebouncedValue } from './useDebouncedValue'

export const SYNEY_MATERIALS_MOBILE_PAGE_SIZE = 20

/** 手机列表：一个搜索框 +「加载更多」（每次多取 20 条，搜索变化时回到第一批） */
export function useMobileList() {
  const [rawSearch, setRawSearch] = useState('')
  const [pageSize, setPageSize] = useState(SYNEY_MATERIALS_MOBILE_PAGE_SIZE)
  const keyword = useDebouncedValue(rawSearch.trim())

  const setSearchValue = useCallback((value: string) => {
    setRawSearch(value)
    setPageSize(SYNEY_MATERIALS_MOBILE_PAGE_SIZE)
  }, [])

  const loadMore = useCallback(() => {
    setPageSize(size => size + SYNEY_MATERIALS_MOBILE_PAGE_SIZE)
  }, [])

  return { searchValue: rawSearch, setSearchValue, keyword, pageSize, loadMore }
}
