import { Key } from 'react'
import { Table } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'

import { ISyneySpec } from '@/types'
import { useSearchParams } from 'react-router-dom'

type Props = {
  data: ISyneySpec[]
  loading: boolean
  onSelect: (selectedRowKeys: Key[]) => void
  selectedRowKeys: Key[]
}

function SpecTable({ data, loading, onSelect, selectedRowKeys }: Props) {
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const columns: TableColumnsType<ISyneySpec> = [
    {
      title: '#',
      render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: '件号',
      dataIndex: 'PartNo',
    },
    {
      title: '名称',
      dataIndex: 'PartName',
    },
    {
      title: '规格',
      dataIndex: 'Spec',
    },
    {
      title: '参数规格',
      dataIndex: 'ParamSpec',
    },
  ]

  const rowSelection: TableProps<ISyneySpec>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      onSelect(newSelectedRowKeys)
    },
  }

  return (
    <Table<ISyneySpec>
      rowSelection={rowSelection}
      rowKey={(record) => record.id?.toString() ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      scroll={{
        y: 550,
      }}
    />
  )
}

export default SpecTable
