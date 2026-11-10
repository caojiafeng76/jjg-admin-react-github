import type { TableColumnsType } from 'antd'
import type { SyneyMaterialsInventory } from '@/services/apiSyneyMaterialsInventory'
import { Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { formatDateTime, renderText, zebraRowClassName } from '../display'

export interface SyneyMaterialsInventoryTableProps {
  loading: boolean
  data: SyneyMaterialsInventory[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function SyneyMaterialsInventoryTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: SyneyMaterialsInventoryTableProps) {
  const columns: TableColumnsType<SyneyMaterialsInventory> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '品名',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 220,
        fixed: 'left',
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 180,
        render: renderText,
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 80,
        render: renderText,
      },
      {
        title: '库存数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 110,
        align: 'right',
        render: (value: number) => (
          <span className="font-medium tabular-nums">
            {Number(value ?? 0).toLocaleString('zh-CN')}
          </span>
        ),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 240,
        ellipsis: true,
        render: renderText,
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: formatDateTime,
      },
    ],
    [page, pageSize],
  )

  return (
    <Table<SyneyMaterialsInventory>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={{ type: 'radio', selectedRowKeys, onChange: onSelect }}
      pagination={false}
      scroll={{ x: 1070, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无材料库存"
            description="库存行随材料资料自动生成，请先维护材料资料"
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择材料库存 ${record.material_name}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
