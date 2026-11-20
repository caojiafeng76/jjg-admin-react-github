import type { TableColumnsType } from 'antd'
import type { LaborProtectionData } from '@/services/apiLaborProtectionData'
import { Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { formatDateTime } from '@/utils/format'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'

interface Props {
  loading: boolean
  data: LaborProtectionData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function LaborProtectionDataTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<LaborProtectionData> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '种类',
        dataIndex: 'category',
        key: 'category',
        width: 300,
        fixed: 'left',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value: string) => formatDateTime(value),
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
    <Table<LaborProtectionData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 680, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无劳保资料"
            description="点击上方「添加」维护劳保用品种类"
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择劳保用品 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
