import { useMemo } from 'react'
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
    const baseInfoChildren: NonNullable<
      TableColumnsType<StandardTime>[number]
    >[] = [
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
        render: (value: number | null | undefined) =>
          formatNumber(value, 2),
      },
      {
        title: '料号',
        dataIndex: 'part_no',
        key: 'part_no',
        width: 160,
        ellipsis: { showTitle: true },
        render: (value?: string | null) =>
          value ? <span>{value}</span> : <Tag color="default">留空</Tag>,
      },
    ]

    if (!hideStandardSeconds) {
      baseInfoChildren.push({
        title: '标准工时（秒）',
        dataIndex: 'standard_seconds',
        key: 'standard_seconds',
        width: 140,
      })

      baseInfoChildren.push({
        title: '日标准产能',
        key: 'daily_standard_capacity',
        width: 120,
        render: (_value, record) =>
          formatNumber(
            calculateDailyStandardCapacity(record.standard_seconds),
            2,
          ),
      })
    }

    const nextColumns: TableColumnsType<StandardTime> = [
      {
        title: '#',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
        width: 60,
        fixed: 'left',
        key: '#',
      },
      {
        title: '基础信息',
        children: baseInfoChildren,
      },
    ]

    nextColumns.push(
      {
        title: '费率参数',
        children: [
          {
            title: '理论工时（秒）',
            dataIndex: 'theoretical_seconds',
            key: 'theoretical_seconds',
            width: 140,
          },
          {
            title: '检验工时（秒）',
            dataIndex: 'inspection_seconds',
            key: 'inspection_seconds',
            width: 140,
          },
          {
            title: '人工费率',
            dataIndex: 'labor_rate',
            key: 'labor_rate',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '设备费率',
            dataIndex: 'equipment_rate',
            key: 'equipment_rate',
            width: 140,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '刀具费率',
            dataIndex: 'tool_rate',
            key: 'tool_rate',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '切削液费率',
            dataIndex: 'cutting_fluid_rate',
            key: 'cutting_fluid_rate',
            width: 130,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '工装费率',
            dataIndex: 'fixture_rate',
            key: 'fixture_rate',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '日管理总费用',
            dataIndex: 'daily_management_cost',
            key: 'daily_management_cost',
            width: 140,
            render: (value: number) => formatNumber(value, 2),
          },
          {
            title: '日总工时',
            dataIndex: 'daily_total_hours',
            key: 'daily_total_hours',
            width: 120,
            render: (value: number) => formatNumber(value, 2),
          },
        ],
      },
      {
        title: '自动成本',
        children: [
          {
            title: '人工成本',
            dataIndex: 'labor_cost',
            key: 'labor_cost',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '设备成本',
            dataIndex: 'equipment_cost',
            key: 'equipment_cost',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '刀具辅料成本',
            dataIndex: 'tooling_consumable_cost',
            key: 'tooling_consumable_cost',
            width: 140,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '检验成本',
            dataIndex: 'inspection_cost',
            key: 'inspection_cost',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '单品分摊额',
            dataIndex: 'overhead_cost',
            key: 'overhead_cost',
            width: 130,
            render: (value: number) => formatNumber(value),
          },
          {
            title: '合计',
            dataIndex: 'total_cost',
            key: 'total_cost',
            width: 120,
            render: (value: number) => formatNumber(value),
          },
        ],
      },
      {
        title: '数据上传',
        dataIndex: 'uploaded_by_name',
        key: 'uploaded_by_name',
        width: 140,
        render: (value?: string | null) =>
          value ? <span>{value}</span> : <Tag color="default">留空</Tag>,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 180,
        ellipsis: {
          showTitle: true,
        },
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
      onRow={(record) => ({
        style: !record.job_name
          ? {
              backgroundColor: '#fffbe6',
            }
          : undefined,
      })}
      scroll={{ x: hideStandardSeconds ? 2340 : 2490, y: scrollY }}
      size="small"
      pagination={false}
      style={{
        fontSize: '12px',
      }}
      components={components}
    />
  )
}
