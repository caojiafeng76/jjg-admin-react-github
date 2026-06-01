import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import MaterialTransferSearch from './MaterialTransferSearch'

describe('MaterialTransferSearch', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        disconnect = vi.fn()
        observe = vi.fn()
        unobserve = vi.fn()
      },
    )
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    )
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('keeps desktop search controls and actions on one row', () => {
    const { container } = render(
      <MaterialTransferSearch
        employees={[{ id: 'employee-1', name: '曹佳峰' }]}
        lengthOptions={[1234]}
        onReset={vi.fn()}
        onSearch={vi.fn()}
      />,
    )

    const form = container.querySelector('form')
    expect(form).toHaveClass('flex-nowrap')
    expect(form?.className).toContain('[&_.ant-form-item]:[margin-inline-end:0]')

    const searchButton = screen.getByRole('button', { name: /搜索/ })
    expect(searchButton.closest('.ant-form-item')).toHaveClass('shrink-0')
  })
})
