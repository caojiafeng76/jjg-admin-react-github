import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import TableSelectionProvider from './TableSelectionProvider'
import { useTableSelection } from './useTableSelection'

afterEach(cleanup)

describe('TableSelectionProvider', () => {
  function SelectionProbe({ name, selectKey }: { name: string, selectKey: number }) {
    const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()

    return (
      <button type="button" onClick={() => setTableSelectedKeys([selectKey])}>
        {`${name}:${tableSelectedKeys.join(',') || '无'}`}
      </button>
    )
  }

  it('keeps selections independent between page instances (cached tabs)', () => {
    render(
      <>
        <TableSelectionProvider>
          <SelectionProbe name="订单列表" selectKey={1} />
        </TableSelectionProvider>
        <TableSelectionProvider>
          <SelectionProbe name="对账单列表" selectKey={2} />
        </TableSelectionProvider>
      </>,
    )

    fireEvent.click(screen.getByRole('button', { name: '订单列表:无' }))

    expect(screen.getByRole('button', { name: '订单列表:1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '对账单列表:无' })).toBeTruthy()
  })

  it('throws a clear error when used outside a provider', () => {
    expect(() => render(<SelectionProbe name="x" selectKey={1} />)).toThrow(
      'useTableSelection must be used within a TableSelectionProvider',
    )
  })
})
