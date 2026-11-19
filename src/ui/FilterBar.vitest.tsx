import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FilterBar, { FilterBarActions } from './FilterBar'
import { FILTER_INPUT_WIDTH_CLASSES } from './filterBarTokens'

afterEach(cleanup)

describe('FilterBar', () => {
  it('renders a flat accessible region with standard width tokens', () => {
    render(
      <FilterBar>
        <span>筛选项</span>
      </FilterBar>,
    )

    const region = screen.getByRole('region', { name: '筛选条件' })
    expect(region.className).toContain('bg-slate-50/80')
    expect(region.className).toContain('dark:bg-slate-900/50')
    expect(screen.getByText('筛选项')).toBeTruthy()
    expect(FILTER_INPUT_WIDTH_CLASSES).toEqual({
      short: 'w-36',
      medium: 'w-52',
      wide: 'w-64',
    })
  })

  it('renders standard search and reset actions', () => {
    const onReset = vi.fn()
    render(<FilterBarActions onReset={onReset} />)

    const searchBtn = screen.getByRole('button', { name: /搜\s*索/ })
    const resetBtn = screen.getByRole('button', { name: /重\s*置/ })

    expect(searchBtn.getAttribute('type')).toBe('submit')
    fireEvent.click(resetBtn)
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
