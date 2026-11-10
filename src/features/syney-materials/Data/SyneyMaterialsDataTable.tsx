import type { TableColumnsType } from 'antd'
import type { SyneyMaterialsData } from '@/services/apiSyneyMaterialsData'
import { Button, Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { formatDateTime, renderText, zebraRowClassName } from '../display'

export interface SyneyMaterialsDataTableProps {
  loading: boolean
  data: SyneyMaterialsData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  emptyAction?: React.ReactNode
  /** 打开行详情抽屉（库存/出入库）；不传时不渲染操作列 */
  onOpenDetail?: (record: SyneyMaterialsData) => void
}

export default function SyneyMaterialsDataTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  emptyAction,
  onOpenDetail,
}: SyneyMaterialsDataTableProps) {
  const columns: TableColumnsType<SyneyMaterialsData> = useMemo(() => {
    const base: TableColumnsType<SyneyMaterialsData> = [
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
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 260,
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
    ]

    if (onOpenDetail) {
      base.push({
        title: '库存/出入库',
        key: 'inventory-detail',
        width: 120,
        fixed: 'right',
        render: (_value, record) => (
          <Button
            type="link"
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              onOpenDetail(record)
            }}
          >
            查看
          </Button>
        ),
      })
    }

    return base
  }, [onOpenDetail, page, pageSize])

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<SyneyMaterialsData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: onOpenDetail ? 1100 : 980, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无材料资料"
            description="点击下方按钮创建第一条材料资料"
            action={emptyAction}
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择材料 ${record.material_name}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
