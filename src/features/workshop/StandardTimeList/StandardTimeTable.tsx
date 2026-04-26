import type { ReactNode, TdHTMLAttributes } from 'react'
import { memo, useCallback, useMemo } from 'react'
import { Table, TableColumnsType, Tag } from 'antd'
import type { StandardTime } from '@/services/apiStandardTimes'
import { calculateDailyStandardCapacity } from '@/utils/costAccounting'

function formatNumber(value: number | null | undefined, digits = 4) {
  return Number(value || 0).toFixed(digits)
}

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

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode
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
          if (value === 'A') return <Tag color="blue">A类</Tag>
          if (value === 'B') return <Tag color="default">B类</Tag>
          return <Tag color="default">-</Tag>
        },
      },
      {
        title: '末道',
        dataIndex: 'is_last_process',
        key: 'is_last_process',
        width: 90,
        render: (value: boolean | null | undefined) =>
          value ? <Tag color="green">末道</Tag> : <Tag>非末道</Tag>,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 150,
        ellipsis: { showTitle: true },
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
          value ? <span>{value}</span> : <Tag color="warning">未匹配</Tag>,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 180,
        render: (value?: string | null) =>
          value ? <span>{value}</span> : <Tag color="default">留空</Tag>,
      },
      {
        title: '设备编号',
        dataIndex: 'equipment_no',
        key: 'equipment_no',
        width: 140,
        render: (value?: string | null) =>
          value ? <span>{value}</span> : <Tag color="default">留空</Tag>,
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
          value ? <span>{value}</span> : <Tag color="default">留空</Tag>,
      },
    ]

    if (!hideStandardSeconds) {
      cols.push(
        {
          title: '标准工时（秒）',
          dataIndex: 'standard_seconds',
          key: 'standard_seconds',
          width: 140,
        },
        {
          title: '日标准产能',
          key: 'daily_standard_capacity',
          width: 120,
          render: (_value, record) =>
            formatNumber(
              calculateDailyStandardCapacity(record.standard_seconds),
              2,
            ),
        },
        {
          title: '理论工时（秒）',
          dataIndex: 'theoretical_seconds',
          key: 'theoretical_seconds',
          width: 140,
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
            ? '#e6f4ff'
            : !record.job_name
              ? '#fffbe6'
              : undefined,
      },
    }),
    [activeRowId, onRowClick],
  )

  return (
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
      style={{ fontSize: '12px' }}
      components={components}
    />
  )
})

export default StandardTimeTable
