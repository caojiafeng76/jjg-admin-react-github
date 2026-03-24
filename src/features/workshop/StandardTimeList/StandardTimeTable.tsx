import { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'
import type { StandardTime } from '@/services/apiStandardTimes'

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
}

export default function StandardTimeTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  hideStandardSeconds = false,
}: Props) {
  const columns: TableColumnsType<StandardTime> = useMemo(() => {
    const nextColumns: TableColumnsType<StandardTime> = [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        width: 60,
        fixed: 'left',
        key: '#',
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 150,
        ellipsis: {
          showTitle: true,
        },
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 200,
        ellipsis: {
          showTitle: true,
        },
        render: (value: string | string[]) => {
          if (Array.isArray(value)) {
            return value.join(', ')
          }
          return value
        },
      },
    ]

    if (!hideStandardSeconds) {
      nextColumns.push({
        title: '标准工时（秒）',
        dataIndex: 'standard_seconds',
        key: 'standard_seconds',
        width: 150,
      })
    }

    nextColumns.push(
      {
        title: '理论工时（秒）',
        dataIndex: 'theoretical_seconds',
        key: 'theoretical_seconds',
        width: 150,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
    )

    return nextColumns
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
        cell: (props: any) => {
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

  return (
    <Table<StandardTime>
      rowKey={(record) => record.id || ''}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: hideStandardSeconds ? 800 : 950, y: scrollY }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
