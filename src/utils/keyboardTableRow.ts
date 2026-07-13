import type { HTMLAttributes } from 'react'

type KeyboardTableRowProps = Pick<
  HTMLAttributes<HTMLTableRowElement>,
  'aria-label' | 'onKeyDown' | 'tabIndex'
>

export function createKeyboardTableRowProps(
  onActivate: () => void,
  accessibleName?: string,
): KeyboardTableRowProps {
  return {
    tabIndex: 0,
    'aria-label': accessibleName,
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return
      if (event.key !== 'Enter' && event.key !== ' ') return

      event.preventDefault()
      onActivate()
    },
  }
}
