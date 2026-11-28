import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import MaterialTransferSearch from './MaterialTransferSearch'

describe('MaterialTransferSearch', () => {
  afterEach(() => {
    cleanup()
  })

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
    expect(form).not.toHaveClass('ant-form-inline')

    const searchButton = screen.getByRole('button', { name: /搜索/ })
    expect(searchButton.closest('.ant-form-item')).toHaveClass('shrink-0')
  })

  it('renders customerModel input instead of materialCode and submits trimmed customerModel', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()

    render(
      <MaterialTransferSearch
        employees={[{ id: 'employee-1', name: '曹佳峰' }]}
        lengthOptions={[1234]}
        onReset={vi.fn()}
        onSearch={onSearch}
      />,
    )

    expect(screen.queryByPlaceholderText('料号')).not.toBeInTheDocument()
    const customerModelInput = screen.getByPlaceholderText('客户型号')
    expect(customerModelInput).toBeInTheDocument()

    await user.type(customerModelInput, '  海尔SC-752  ')
    await user.click(screen.getByRole('button', { name: /搜\s*索/ }))

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1)
    })

    const submitted = onSearch.mock.calls[0]?.[0] as Record<string, unknown>
    expect(submitted.customerModel).toBe('海尔SC-752')
    expect(submitted).not.toHaveProperty('materialCode')
  })

  it('hydrates initialValues.customerModel and clears it on reset', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()

    render(
      <MaterialTransferSearch
        employees={[{ id: 'employee-1', name: '曹佳峰' }]}
        lengthOptions={[1234]}
        initialValues={{ customerModel: '拉手左' }}
        onReset={onReset}
        onSearch={vi.fn()}
      />,
    )

    const customerModelInput = screen.getByPlaceholderText('客户型号')
    await waitFor(() => {
      expect(customerModelInput).toHaveValue('拉手左')
    })

    await user.click(screen.getByRole('button', { name: /重\s*置/ }))

    expect(onReset).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('客户型号')).toHaveValue('')
    })
  })
})
