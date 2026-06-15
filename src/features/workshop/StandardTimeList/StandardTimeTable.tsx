import { memo, useCallback, useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'
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

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode
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
  const columns: TableColumnsType<StandardTime> = useMemo(() => {
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
        scroll={{ x: hideStandardSeconds ? 1090 : 1550, y: scrollY }}
        size="small"
        pagination={false}
        className="font-[family-name:var(--font-sans)]"
        components={components}
      />
    </div>
  )
})

export default StandardTimeTable
