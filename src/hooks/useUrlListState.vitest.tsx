import type { ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useUrlListState } from './useUrlListState'

function createWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  }
}

function useStateWithLocation() {
  const state = useUrlListState(['keyword', 'status'] as const)
  const location = useLocation()
  return { ...state, search: location.search }
}

describe('useUrlListState', () => {
  it('derives filters and pagination from the URL', () => {
    const { result } = renderHook(useStateWithLocation, {
      wrapper: createWrapper('/list?page=3&pageSize=20&keyword=%20A1%20&other=x'),
    })

    expect(result.current.page).toBe(3)
    expect(result.current.pageSize).toBe(20)
    expect(result.current.filters).toEqual({ keyword: 'A1' })
  })

  it('applies filters, resets to page 1 and keeps unrelated params', () => {
    const { result } = renderHook(useStateWithLocation, {
      wrapper: createWrapper('/list?page=3&keyword=A1&other=x'),
    })

    act(() => {
      result.current.setFilters({ status: 'open', keyword: '' })
    })

    const params = new URLSearchParams(result.current.search)
    expect(result.current.filters).toEqual({ status: 'open' })
    expect(params.get('page')).toBe('1')
    expect(params.get('keyword')).toBeNull()
    expect(params.get('other')).toBe('x')
  })

  it('resets filters and changes page', () => {
    const { result } = renderHook(useStateWithLocation, {
      wrapper: createWrapper('/list?page=2&keyword=A1&status=open'),
    })

    act(() => {
      result.current.resetFilters()
    })
    expect(result.current.filters).toEqual({})

    act(() => {
      result.current.setPage(0)
    })
    expect(result.current.page).toBe(1)
  })
})
