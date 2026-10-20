import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useStandardTimeSearchParams } from './useStandardTimeSearchParams'

function renderSearchParamsHook(initialEntry: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  )

  return renderHook(
    () => ({ ...useStandardTimeSearchParams(), location: useLocation() }),
    { wrapper },
  )
}

describe('useStandardTimeSearchParams', () => {
  it('从 URL 读取分页与搜索条件', () => {
    const { result } = renderSearchParamsHook(
      '/standard-time?page=3&pageSize=20&model=M-1&unmatchedOnly=true&partNoOnly=false&recordType=B',
    )

    expect(result.current.page).toBe(3)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.searchParams).toEqual({
      operation: undefined,
      model: 'M-1',
      partNo: undefined,
      unmatchedOnly: true,
      partNoOnly: undefined,
      updatedStartDate: undefined,
      updatedEndDate: undefined,
      recordType: 'B',
    })
  })

  it('搜索时回到第一页，写入有值的条件并删除空条件，保留其他参数', () => {
    const { result } = renderSearchParamsHook(
      '/standard-time?page=4&pageSize=50&operation=CNC&partNo=P-1',
    )

    act(() => {
      result.current.applySearch({
        model: 'M-2',
        unmatchedOnly: true,
        partNoOnly: false,
        updatedStartDate: '2026-10-01',
      })
    })

    expect(result.current.location.search).toBe(
      '?page=1&pageSize=50&model=M-2&unmatchedOnly=true&updatedStartDate=2026-10-01',
    )
    expect(result.current.searchParams).toEqual({
      model: 'M-2',
      unmatchedOnly: true,
      partNoOnly: false,
      updatedStartDate: '2026-10-01',
    })
  })

  it('重置时清空全部搜索条件，只保留分页大小', () => {
    const { result } = renderSearchParamsHook(
      '/standard-time?page=2&pageSize=20&operation=CNC&recordType=A&updatedEndDate=2026-10-31',
    )

    act(() => {
      result.current.resetSearch()
    })

    expect(result.current.location.search).toBe('?page=1&pageSize=20')
    expect(result.current.searchParams).toEqual({})
  })
})
