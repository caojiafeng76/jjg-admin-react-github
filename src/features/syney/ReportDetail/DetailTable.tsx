import { Key } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'

import { ISyneyItem } from '@/types'
import { formatNumber } from '@utils/helps'
import { useAppStore } from '@/store'

export default function DetailTable({
  data,
  loading,
}: {
  data: ISyneyItem[]
  loading: boolean
}) {
  const columns: TableColumnsType<ISyneyItem> = [
    {
      title: '#',
      render: (_text, _record, index) => index + 1,
      width: 50,
    },
    {
      title: '件号',
      dataIndex: 'PartNo',
      width: 200,
      filters: Array.from(new Set(data)).map((item) => ({
        text: item.PartNo,
        value: item.PartNo as Key,
      })),
      onFilter: (value, record) =>
        record.PartNo?.startsWith(value as string) || false,
    },
    {
      title: '名称',
      dataIndex: 'PartName',
      width: 200,
    },
    {
      title: '规格',
      dataIndex: 'Spec',
      width: 250,
    },
    {
      title: '参数规格',
      dataIndex: 'ParamSpec',
    },
    {
      title: '单价',
      dataIndex: 'TaxUnitPrice',
      render: (text: number) => formatNumber(text),
    },
    {
      title: '数量',
      dataIndex: 'Qty',
    },
    {
      title: '单位',
      dataIndex: 'Unit',
    },
    {
      title: '小计',
      dataIndex: 'TaxTotalPrice',
      render: (text: number) => formatNumber(text),
    },
  ]

  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  const rowSelection: TableProps<ISyneyItem>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
  }

  return (
    <Table<ISyneyItem>
      rowSelection={rowSelection}
      rowKey={(record) => record.id?.toString() ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      size="small"
      pagination={false}
      scroll={{
        y: 550,
      }}
    />
  )
}
