import type { TableColumnsType } from 'antd'
import type { JintanPartsInventory } from '@/services/apiJintanPartsInventory'
import { Table, Tag, Tooltip } from 'antd'

import { useMemo } from 'react'
import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { JINTAN_PARTS_STOCK_STATUS_CONFIG } from './stockStatus'

interface Props {
  loading: boolean
  data: JintanPartsInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function JintanPartsInventoryTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<JintanPartsInventory> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '名称',
        dataIndex: 'part_name',
        key: 'part_name',
        width: 200,
        fixed: 'left',
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 150,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '材质',
        dataIndex: 'material',
        key: 'material',
        width: 120,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '采购厂家',
        dataIndex: 'supplier',
        key: 'supplier',
        width: 150,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '库存数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 110,
        align: 'right',
        render: (value: number | null | undefined, record) => {
          const quantity = value ?? 0
          const config = JINTAN_PARTS_STOCK_STATUS_CONFIG[record.stock_status]
          if (!config?.tagColor) {
            return <span className="tabular-nums">{quantity}</span>
          }

          return (
            <Tooltip title={`${config.label}：${config.description}`}>
              <Tag
                color={config.tagColor}
                className="me-0 min-w-14 text-right tabular-nums"
              >
                {quantity}
              </Tag>
            </Tooltip>
          )
        },
      },
      {
        title: '单台数量',
        dataIndex: 'unit_quantity',
        key: 'unit_quantity',
        width: 100,
        align: 'right',
        render: renderOptionalNumber,
      },
      {
        title: '安全库存',
        dataIndex: 'safety_stock',
        key: 'safety_stock',
        width: 100,
        align: 'right',
        render: (value: number | null | undefined, record) =>
          value == null
            ? (
                '-'
              )
            : (
                <Tooltip
                  title={`单台数量 ${record.unit_quantity} × 倍数 ${record.safety_multiple}`}
                >
                  <span className="tabular-nums">{value}</span>
                </Tooltip>
              ),
      },
      {
        title: '阈值',
        dataIndex: 'threshold_stock',
        key: 'threshold_stock',
        width: 90,
        align: 'right',
        render: renderOptionalNumber,
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 220,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
      },
    ],
    [page, pageSize],
  )

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<JintanPartsInventory>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1480, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无配件库存"
            description="库存行随配件资料自动生成，请先在配件资料中维护配件"
          />
        ),
      }}
      rowClassName={(_, index) =>
        index % 2 === 0
          ? 'bg-white dark:bg-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-800/60'}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择配件 ${record.part_name}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}

function renderOptionalNumber(value: number | null | undefined) {
  return value == null ? '-' : <span className="tabular-nums">{value}</span>
}
