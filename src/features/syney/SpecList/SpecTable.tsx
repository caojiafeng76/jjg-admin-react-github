import type { TableColumnsType, TableProps } from 'antd'
import type { Key } from 'react'
import type { ISyneySpec } from '@/types'

import { Table } from 'antd'
import { useMemo } from 'react'

import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { toggleTableSelectionKey } from '../useTableSelection'

interface Props {
  data: ISyneySpec[]
  loading: boolean
  onSelect: (selectedRowKeys: Key[]) => void
  selectedRowKeys: Key[]
  page: number
  pageSize: number
  scrollY?: number
}

export default function SpecTable({
  data,
  loading,
  onSelect,
  selectedRowKeys,
  page,
  pageSize,
  scrollY = 400,
}: Props) {
  const columns: TableColumnsType<ISyneySpec> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 50,
        fixed: 'left',
        align: 'right',
        render: (_text, _record, index) => (
          <span className="tabular-nums">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
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

  return (
    <Table<ISyneySpec>
      rowSelection={rowSelection}
      rowKey={record => record.id?.toString() ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      rowClassName={zebraRowClassName}
      locale={{ emptyText: <TableEmpty title="暂无踏板规格" description="请新建规格或调整筛选条件" /> }}
      onRow={record =>
        record.id !== undefined && record.id !== null
          ? createKeyboardTableRowProps(
              () => onSelect(toggleTableSelectionKey(selectedRowKeys, record.id!.toString())),
              `选择西尼规格 ${record.PartNo || record.id}`,
            )
          : {}}
      pagination={false}
      scroll={{ x: 800, y: scrollY }}
    />
  )
}
