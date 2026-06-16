import { Key, useMemo } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'
import { useAppStore } from '@/store'
import { ISyneyItem } from '@/types'
import { useDetail } from './useDetail'

interface Props {
  loading: boolean
  data: ISyneyItem[]
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  activeRowId?: number | null
  onRowClick?: (record: ISyneyItem) => void
}

export default function DetailTable({
  loading,
  data,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  activeRowId,
  onRowClick,
}: Props) {
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()
  const { items, isLoading } = useDetail()

  const currentPageTotalQty = useMemo(
    () =>
      ((items as ISyneyItem[]) || []).reduce(
        (sum, item) => sum + Number(item.Qty || 0),
        0,
      ),
    [items],
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
      width: 180,
      sorter: (a, b) =>
        String(a.PartNo || '').localeCompare(String(b.PartNo || ''), 'zh-CN'),
      render: (value: string | null) => value || '-',
    },
    {
      title: '名称',
      dataIndex: 'PartName',
      key: 'PartName',
      width: 180,
      render: (value: string | null) => value || '-',
    },
    {
      title: '参数规格',
      dataIndex: 'ParamSpec',
      key: 'ParamSpec',
      width: 220,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '名称2',
      dataIndex: 'PartName2',
      key: 'PartName2',
      width: 140,
      render: (value: string | null) => value || '-',
    },
    {
      title: '编号',
      dataIndex: 'PartCode',
      key: 'PartCode',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '型号',
      dataIndex: 'PartModel',
      key: 'PartModel',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '规格',
      dataIndex: 'Spec',
      key: 'Spec',
      width: 240,
      ellipsis: true,
      render: (value: string | null) => value || '-',
    },
    {
      title: '数量',
      dataIndex: 'Qty',
      key: 'Qty',
      width: 90,
      render: (value: number | null) =>
        value === null || value === undefined ? (
          <span className="text-slate-400">-</span>
        ) : (
          <span className="font-semibold tabular-nums text-slate-700">
            {value}
          </span>
        ),
      sorter: (a, b) => (a.Qty || 0) - (b.Qty || 0),
    },
    {
      title: '合同号',
      dataIndex: 'SONo',
      key: 'SONo',
      width: 200,
      ellipsis: true,
      render: (value: string | null) => value || '-',
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
      loading={loading || isLoading}
      pagination={false}
      size="small"
      onRow={handleRow}
      scroll={{ x: 1380, y: scrollY }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-row:hover>td]:bg-blue-50/50"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={7}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8}>
              <span className="font-bold text-slate-900 tabular-nums">
                {currentPageTotalQty}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={9} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
