import { useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Key } from 'react'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import { ISyneySpec } from '@/types'

interface Props {
  data: ISyneySpec[]
  loading: boolean
  onSelect: (selectedRowKeys: Key[]) => void
  selectedRowKeys: Key[]
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  activeRowId?: number | null
  onRowClick?: (record: ISyneySpec) => void
}

export default function SpecTable({
  data,
  loading,
  onSelect,
  selectedRowKeys,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  activeRowId,
  onRowClick,
}: Props) {
  const columns: TableColumnsType<ISyneySpec> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 50,
        fixed: 'left',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '件号',
        dataIndex: 'PartNo',
        key: 'PartNo',
        width: 220,
        sorter: (a, b) =>
          String(a.PartNo || '').localeCompare(String(b.PartNo || ''), 'zh-CN'),
        defaultSortOrder: 'ascend',
        render: (value: string | null) => value || '-',
      },
      {
        title: '名称',
        dataIndex: 'PartName',
        key: 'PartName',
        width: 200,
        render: (value: string | null) => value || '-',
      },
      {
        title: '规格',
        dataIndex: 'Spec',
        key: 'Spec',
        width: 180,
        render: (value: string | null) => value || '-',
      },
      {
        title: '参数规格',
        dataIndex: 'ParamSpec',
        key: 'ParamSpec',
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
    ],
    [page, pageSize],
  )

  const rowSelection: TableProps<ISyneySpec>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      onSelect(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  const handleRow = (record: ISyneySpec) => ({
    ...(onRowClick
      ? createKeyboardTableRowProps(
          () => onRowClick(record),
          `打开西尼规格 ${record.PartNo || record.id}`,
        )
      : {}),
    onClick: () => onRowClick?.(record),
    style: {
      cursor: onRowClick ? 'pointer' : undefined,
      backgroundColor:
        record.id && record.id === activeRowId ? '#f0f7ff' : undefined,
      height: rowHeight,
    },
  })

  return (
    <Table<ISyneySpec>
      rowSelection={rowSelection}
      rowKey={(record) => record.id?.toString() ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      size="small"
      pagination={false}
      onRow={handleRow}
      scroll={{ x: 800, y: scrollY }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600"
    />
  )
}
