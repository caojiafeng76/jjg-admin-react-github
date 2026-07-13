import { fireEvent } from '@testing-library/react'
import type { KeyboardEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createKeyboardTableRowProps } from './keyboardTableRow'

describe('createKeyboardTableRowProps', () => {
  it.each(['Enter', ' '])('activates the row with %s', (key) => {
    const onActivate = vi.fn()
    const row = document.createElement('tr')
    const props = createKeyboardTableRowProps(onActivate, '选择测试行')

    Object.assign(row, {
      tabIndex: props.tabIndex,
      ariaLabel: props['aria-label'],
    })
    row.addEventListener('keydown', (event) =>
      props.onKeyDown?.(event as unknown as KeyboardEvent<HTMLTableRowElement>),
    )

    fireEvent.keyDown(row, { key })

    expect(onActivate).toHaveBeenCalledOnce()
    expect(row.tabIndex).toBe(0)
    expect(row.ariaLabel).toBe('选择测试行')
  })

  it('ignores unrelated keys and keyboard events from nested controls', () => {
    const onActivate = vi.fn()
    const row = document.createElement('tr')
    const button = document.createElement('button')
    const props = createKeyboardTableRowProps(onActivate)

    row.append(button)
    row.addEventListener('keydown', (event) =>
      props.onKeyDown?.(event as unknown as KeyboardEvent<HTMLTableRowElement>),
    )

    fireEvent.keyDown(row, { key: 'ArrowDown' })
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(onActivate).not.toHaveBeenCalled()
  })
})
