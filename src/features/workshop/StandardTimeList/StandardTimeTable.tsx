import {
  memo,
  useCallback,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { StandardTime } from '@/services/apiStandardTimes'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'
import { formatNumber } from '@/utils/format'

interface Props {
  loading: boolean
  data: StandardTime[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  hideStandardSeconds?: boolean
  activeRowId?: string | null
  onRowClick?: (record: StandardTime) => void
}

const MIN_RESIZABLE_COLUMN_WIDTH = 44

type ColumnWidthMap = Record<string, number>

type ResizableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  columnKey?: string
  minWidth?: number
  onResizeColumn?: (columnKey: string, width: number) => void
  width?: number
}

function ResizableHeaderCell({
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
    <th {...props} style={style}>
      <div
        style={{
          display: 'block',
          margin: '-4px -6px',
          padding: '4px 6px',
          position: 'relative',
        }}
      >
        {children}
        {columnKey && onResizeColumn ? (
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
        ) : null}
      </div>
    </th>
  )
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
}

function getColumnKey<RecordType>(
  column: TableColumnsType<RecordType>[number],
) {
  if (column.key !== undefined) {
    return String(column.key)
  }

  if ('dataIndex' in column && column.dataIndex !== undefined) {
    return Array.isArray(column.dataIndex)
      ? column.dataIndex.join('.')
      : String(column.dataIndex)
  }

  return ''
}

function applyColumnWidths<RecordType>(
  columns: TableColumnsType<RecordType>,
  columnWidths: ColumnWidthMap,
  onResizeColumn: (columnKey: string, width: number) => void,
): TableColumnsType<RecordType> {
  return columns.map((column) => {
    const columnKey = getColumnKey(column)
    const defaultWidth = typeof column.width === 'number' ? column.width : 0
    const width = columnKey
      ? (columnWidths[columnKey] ?? defaultWidth)
      : defaultWidth

    return {
      ...column,
      width,
      onHeaderCell: () =>
        ({
          columnKey,
          minWidth: MIN_RESIZABLE_COLUMN_WIDTH,
          onResizeColumn,
          width,
        }) as ResizableHeaderCellProps,
    }
  })
}

function getTableColumnWidth<RecordType>(columns: TableColumnsType<RecordType>) {
  return columns.reduce((total, column) => {
    const width = column.width
    return total + (typeof width === 'number' ? width : 0)
  }, 0)
}

const StandardTimeTable = memo(function StandardTimeTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  hideStandardSeconds = false,
  activeRowId,
  onRowClick,
}: Props) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidthMap>({})

  const handleResizeColumn = useCallback(
    (columnKey: string, width: number) => {
      setColumnWidths((current) => {
        if (current[columnKey] === width) {
          return current
        }
        return { ...current, [columnKey]: width }
      })
    },
    [],
  )

  const baseColumns: TableColumnsType<StandardTime> = useMemo(() => {
    const cols: TableColumnsType<StandardTime> = [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        width: 60,
        fixed: 'left',
        key: '#',
      },
      {
        title: '类型',
        dataIndex: 'record_type',
        key: 'record_type',
        width: 90,
        render: (value: string | null | undefined) => {
          if (value === 'A')
            return (
              <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                A类
              </span>
            )
          if (value === 'B')
            return (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                B类
              </span>
            )
          return (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400">
              -
            </span>
          )
        },
      },
      {
        title: '末道',
        dataIndex: 'is_last_process',
        key: 'is_last_process',
        width: 90,
        render: (value: boolean | null | undefined) =>
          value ? (
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              末道
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400">
              非末道
            </span>
          ),
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 150,
        ellipsis: { showTitle: true },
        render: (value: string) => (
          <span className="font-medium text-slate-800">{value || '-'}</span>
        ),
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 200,
        ellipsis: { showTitle: true },
        render: (value: string | string[]) =>
          Array.isArray(value) ? value.join(', ') : value,
      },
      {
        title: '工种',
        dataIndex: 'job_name',
        key: 'job_name',
        width: 120,
        render: (value?: string | null) =>
          value ? (
            <span className="text-slate-700">{value}</span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600">
              未匹配
            </span>
          ),
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 180,
        render: (value?: string | null) =>
          value ? (
            <span className="text-slate-600">{value}</span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
              留空
            </span>
          ),
      },
      {
        title: '设备编号',
        dataIndex: 'equipment_no',
        key: 'equipment_no',
        width: 140,
        render: (value?: string | null) =>
          value ? (
            <span className="font-mono text-slate-600">{value}</span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
              留空
            </span>
          ),
      },
      {
        title: '长度',
        dataIndex: 'length',
        key: 'length',
        width: 100,
        render: (value: number | null | undefined) => formatNumber(value, 2),
      },
      {
        title: '料号',
        dataIndex: 'part_no',
        key: 'part_no',
        width: 120,
        ellipsis: { showTitle: true },
        render: (value?: string | null) =>
          value ? (
            <span className="font-mono text-slate-600">{value}</span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
              留空
            </span>
          ),
      },
    ]

    if (!hideStandardSeconds) {
      cols.push(
        {
          title: '标准工时（秒）',
          dataIndex: 'standard_seconds',
          key: 'standard_seconds',
          width: 140,
          render: (value: number | null | undefined) => (
            <span className="font-medium text-indigo-600">{formatNumber(value)}</span>
          ),
        },
        {
          title: '日标准产能',
          key: 'daily_standard_capacity',
          width: 120,
          render: (_value, record) => (
            <span className="font-medium text-emerald-600">
              {formatNumber(calculateDailyStandardCapacity(record.standard_seconds), 2)}
            </span>
          ),
        },
        {
          title: '理论工时（秒）',
          dataIndex: 'theoretical_seconds',
          key: 'theoretical_seconds',
          width: 140,
          render: (value: number | null | undefined) => (
            <span className="font-medium text-cyan-600">{formatNumber(value)}</span>
          ),
        },
      )
    }

    return cols
  }, [hideStandardSeconds, page, pageSize])

  const columns = useMemo(
    () => applyColumnWidths(baseColumns, columnWidths, handleResizeColumn),
    [baseColumns, columnWidths, handleResizeColumn],
  )

  const tableWidth = useMemo(() => getTableColumnWidth(columns), [columns])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => {
        onSelect(keys)
      },
    }),
    [selectedRowKeys, onSelect],
  )

  const components = useMemo(
    () => ({
      body: {
        cell: (props: TableCellProps) => {
          const { children, ...restProps } = props
          return (
            <td
              {...restProps}
              style={{
                ...restProps.style,
                height: `${rowHeight}px`,
              }}
            >
              {children}
            </td>
          )
        },
      },
      header: {
        cell: ResizableHeaderCell,
      },
    }),
    [rowHeight],
  )

  const handleRow = useCallback(
    (record: StandardTime) => ({
      onClick: () => onRowClick?.(record),
      style: {
        cursor: onRowClick ? 'pointer' : undefined,
        backgroundColor:
          record.id && record.id === activeRowId
            ? '#f0f7ff'
            : !record.job_name
              ? '#fffbeb'
              : undefined,
        transition: 'all 0.15s ease',
      },
    }),
    [activeRowId, onRowClick],
  )

  return (
    <div className="standard-time-table">
      <Table<StandardTime>
        rowKey={(record) => record.id || ''}
        loading={loading}
        columns={columns}
        dataSource={data}
        rowSelection={rowSelection}
        onRow={handleRow}
        scroll={{ x: tableWidth, y: scrollY }}
        size="small"
        pagination={false}
        className="font-[family-name:var(--font-sans)]"
        components={components}
      />
    </div>
  )
})

export default StandardTimeTable
