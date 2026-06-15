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
})
