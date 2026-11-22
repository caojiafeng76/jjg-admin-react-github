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

  it('renders standard search and reset actions with icons', () => {
    const onReset = vi.fn()
    render(<FilterBarActions onReset={onReset} />)

    const searchBtn = screen.getByRole('button', { name: /搜\s*索/ })
    const resetBtn = screen.getByRole('button', { name: /重\s*置/ })

    expect(searchBtn.getAttribute('type')).toBe('submit')
    expect(searchBtn.querySelector('.ant-btn-icon svg')?.getAttribute('class')).toContain('size-4')
    expect(resetBtn.querySelector('.ant-btn-icon svg')?.getAttribute('class')).toContain('size-4')

    fireEvent.click(resetBtn)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('supports onSearch, size and custom container className', () => {
    const onSearch = vi.fn()
    const onReset = vi.fn()
    const { container } = render(
      <FilterBarActions
        onSearch={onSearch}
        onReset={onReset}
        size="small"
        className="grid w-full grid-cols-2 gap-2"
      />,
    )

    const wrapper = container.firstElementChild
    expect(wrapper?.tagName).toBe('DIV')
    expect(wrapper?.className).toContain('grid-cols-2')

    const searchBtn = screen.getByRole('button', { name: /搜\s*索/ })
    const resetBtn = screen.getByRole('button', { name: /重\s*置/ })
    expect(searchBtn.getAttribute('type')).toBe('button')
    expect(searchBtn.className).toContain('ant-btn-sm')
    expect(resetBtn.className).toContain('ant-btn-sm')

    fireEvent.click(searchBtn)
    expect(onSearch).toHaveBeenCalledTimes(1)
  })
})
