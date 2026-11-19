import type { TableColumnsType } from 'antd'
import type { WorkshopMiscMaterialsData } from '@/services/apiWorkshopMiscMaterialsData'
import { Button, Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { formatDateTime } from '@/utils/format'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { renderText } from '../display'

export interface WorkshopMiscMaterialsDataTableProps {
  loading: boolean
  data: WorkshopMiscMaterialsData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  emptyAction?: React.ReactNode
  /** 打开行详情抽屉（库存/出入库）；不传时不渲染操作列 */
  onOpenDetail?: (record: WorkshopMiscMaterialsData) => void
}

export default function WorkshopMiscMaterialsDataTable({
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
}: WorkshopMiscMaterialsDataTableProps) {
  const columns: TableColumnsType<WorkshopMiscMaterialsData> = useMemo(() => {
    const base: TableColumnsType<WorkshopMiscMaterialsData> = [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '型号',
        dataIndex: 'model',
        key: 'model',
        width: 180,
        fixed: 'left',
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 180,
        render: renderText,
      },
      {
        title: '规格',
        dataIndex: 'specification',
        key: 'specification',
        width: 180,
        render: renderText,
      },
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        render: renderText,
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
        width: 170,
        render: value => formatDateTime(value),
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
    <Table<WorkshopMiscMaterialsData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={
        data.length > 0
          ? { x: onOpenDetail ? 1250 : 1130, y: scrollY }
          : { x: onOpenDetail ? 1250 : 1130 }
      }
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
          `选择材料 ${record.model}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
