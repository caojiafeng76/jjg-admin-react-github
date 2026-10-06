import { useMemo } from 'react'
import { Table, TableColumnsType } from 'antd'

import type { JintanMaterialsData } from '@/services/apiJintanMaterialsData'
import { TableEmpty } from '@/ui/TableState'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'

interface Props {
  loading: boolean
  data: JintanMaterialsData[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  emptyAction?: React.ReactNode
}

export default function JintanMaterialsDataTable({
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
  const columns: TableColumnsType<JintanMaterialsData> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '型号',
        dataIndex: 'material_model',
        key: 'material_model',
        width: 160,
        fixed: 'left',
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '名称',
        dataIndex: 'material_name',
        key: 'material_name',
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
    <Table<JintanMaterialsData>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1090, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无素材资料"
            description="点击下方按钮创建第一条素材资料"
            action={emptyAction}
          />
        ),
      }}
      rowClassName={(_, index) =>
        index % 2 === 0
          ? 'bg-white dark:bg-slate-800'
          : 'bg-slate-50/60 dark:bg-slate-800/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择素材 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
