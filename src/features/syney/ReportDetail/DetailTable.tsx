import { useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Key } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'

import { ISyneyItem } from '@/types'
import { formatNumber } from '@utils/helps'
import { useAppStore } from '@/store'

interface Props {
  data: ISyneyItem[]
  loading: boolean
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  activeRowId?: number | null
  onRowClick?: (record: ISyneyItem) => void
}

export default function DetailTable({
  data,
  loading,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  activeRowId,
  onRowClick,
}: Props) {
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )

  const currentPageTotalAmount = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.TaxTotalPrice || 0), 0),
    [data],
  )

  const columns: TableColumnsType<ISyneyItem> = [
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
      width: 200,
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
      width: 250,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '参数规格',
      dataIndex: 'ParamSpec',
      key: 'ParamSpec',
      width: 200,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '单价',
      dataIndex: 'TaxUnitPrice',
      key: 'TaxUnitPrice',
      width: 120,
      align: 'right',
      render: (text: number) => (
        <span className="text-slate-700 tabular-nums">
          {formatNumber(text)}
        </span>
      ),
    },
    {
      title: '数量',
      dataIndex: 'Qty',
      key: 'Qty',
      width: 90,
      align: 'right',
      render: (value: number | null) => (
        <span className="font-semibold text-slate-700 tabular-nums">
          {value ?? '-'}
        </span>
      ),
    },
    {
      title: '单位',
      dataIndex: 'Unit',
      key: 'Unit',
      width: 80,
      render: (value: string | null) => value || '-',
    },
    {
      title: '小计',
      dataIndex: 'TaxTotalPrice',
      key: 'TaxTotalPrice',
      width: 130,
      align: 'right',
      render: (text: number) => (
        <span className="font-semibold text-slate-700 tabular-nums">
          {formatNumber(text)}
        </span>
      ),
    },
  ]

  const rowSelection: TableProps<ISyneyItem>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  const handleRow = (record: ISyneyItem) => ({
    ...(onRowClick
      ? createKeyboardTableRowProps(
          () => onRowClick(record),
          `打开对账明细 ${record.id}`,
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
    <Table<ISyneyItem>
      rowSelection={rowSelection}
      rowKey={(record) => record.id?.toString() ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size="small"
      onRow={handleRow}
      scroll={{ x: 1100, y: scrollY }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={7}>
              <span className="font-medium text-slate-600">当前页小计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8}>
              <span className="font-bold text-slate-900 tabular-nums">
                {formatNumber(currentPageTotalAmount)}
              </span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
