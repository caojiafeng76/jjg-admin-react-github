import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTableHeight } from './useTableHeight'

describe('useTableHeight', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('keeps the table body viewport within the available container height', () => {
    const { result } = renderHook(() =>
      useTableHeight({
        targetRowCount: 50,
      }),
    )
    const tableContainer = document.createElement('div')
    const pagination = document.createElement('div')

    Object.defineProperty(tableContainer, 'clientHeight', { value: 400 })
    Object.defineProperty(pagination, 'clientHeight', { value: 40 })
    result.current.tableContainerRef.current = tableContainer
    result.current.paginationRef.current = pagination

    act(() => {
      vi.runAllTimers()
    })

    expect(result.current.rowHeight).toBe(32)
    expect(result.current.scrollY).toBe(307)
  })

  it('uses the measured viewport directly when pagination is already outside it', () => {
    const { result } = renderHook(() =>
      useTableHeight({
        headerHeight: 30,
        reservePaginationHeight: false,
        targetRowCount: 10,
      }),
    )
    const tableContainer = document.createElement('div')
    const pagination = document.createElement('div')

    Object.defineProperty(tableContainer, 'clientHeight', { value: 360 })
    Object.defineProperty(pagination, 'clientHeight', { value: 48 })
    result.current.tableContainerRef.current = tableContainer
    result.current.paginationRef.current = pagination

    act(() => {
      vi.runAllTimers()
    })

    // 行高向下取整（32 而非四舍五入的 33）：保证 10 行完整放入 329px 表体，
    // 不出现最后一行被视口截成半行（32 × 10 = 320 ≤ 329）
    expect(result.current.rowHeight).toBe(32)
    expect(result.current.scrollY).toBe(329)
    expect(result.current.rowHeight * 10).toBeLessThanOrEqual(
      result.current.scrollY,
    )
  })
})
