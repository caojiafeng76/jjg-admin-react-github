import { useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Table, TableColumnsType } from 'antd'

import type { YoumaiProductData } from '@/services/apiYoumaiProductData'
import { TableEmpty } from '@/ui/TableState'
import { formatNumber } from '@/utils/format'

interface Props {
  loading: boolean
  data: YoumaiProductData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  /** 空态引导动作（通常为新建按钮），透传给 TableEmpty */
  emptyAction?: React.ReactNode
}

export default function YoumaiProductDataTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  emptyAction,
}: Props) {
  const columns: TableColumnsType<YoumaiProductData> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '物料编码',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 180,
        fixed: 'left',
      },
      {
        title: '物料名称',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 180,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 140,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 140,
      },
      {
        title: '比重',
        dataIndex: 'specific_gravity',
        key: 'specific_gravity',
        width: 120,
        align: 'right',
        render: (value: number) => formatNumber(value, 3),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 260,
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
    <Table<YoumaiProductData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1320, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无优迈货品资料"
            description="点击下方按钮创建第一条优迈货品资料"
            action={emptyAction}
          />
        ),
      }}
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/60 dark:bg-slate-800/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择优迈产品 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
