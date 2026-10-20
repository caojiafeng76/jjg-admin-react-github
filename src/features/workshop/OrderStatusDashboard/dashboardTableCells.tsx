import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'

import { MIN_RESIZABLE_COLUMN_WIDTH } from './dashboardUtils'

const DENSE_TABLE_CELL_STYLE: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  padding: '4px 6px',
}

type ResizableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  columnKey?: string
  minWidth?: number
  onResizeColumn?: (columnKey: string, width: number) => void
  width?: number
}

export function ResizableHeaderCell({
  children,
  columnKey,
  minWidth = MIN_RESIZABLE_COLUMN_WIDTH,
  onResizeColumn,
  style,
  width,
  ...props
}: ResizableHeaderCellProps) {
  function handleResizeStart(event: ReactMouseEvent<HTMLSpanElement>) {
    if (!columnKey || !onResizeColumn || typeof width !== 'number') {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = width
    const originalCursor = document.body.style.cursor
    const originalUserSelect = document.body.style.userSelect

    const handleResizeMove = (moveEvent: MouseEvent) => {
      const nextWidth = Math.max(
        minWidth,
        Math.round(startWidth + moveEvent.clientX - startX),
      )
      onResizeColumn(columnKey, nextWidth)
    }

    const handleResizeEnd = () => {
      document.body.style.cursor = originalCursor
      document.body.style.userSelect = originalUserSelect
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeEnd)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleResizeMove)
    window.addEventListener('mouseup', handleResizeEnd)
  }

  return (
    <th
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    >
      <div
        style={{
          display: 'block',
          margin: '-4px -6px',
          padding: '4px 6px',
          position: 'relative',
        }}
      >
        {children}
        {columnKey && onResizeColumn
          ? (
              <span
                aria-label="调整列宽"
                role="separator"
                aria-orientation="vertical"
                onMouseDown={handleResizeStart}
                style={{
                  bottom: 0,
                  cursor: 'col-resize',
                  position: 'absolute',
                  right: -3,
                  top: 0,
                  width: 6,
                  zIndex: 3,
                }}
              />
            )
          : null}
      </div>
    </th>
  )
}

export function DenseBodyCell({
  style,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    />
  )
}
