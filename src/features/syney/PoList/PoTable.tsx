import { Key, memo, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Table, TableColumnsType, TableProps } from 'antd'
import { format } from 'date-fns'

import { useAppStore } from '@/store'
import { ISyneyPo } from '@/types'
import { usePos } from './usePos'

function PoTable() {
  const [searchParams] = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  // 使用 useMemo 缓存列定义,避免每次渲染重新创建
  const columns: TableColumnsType<ISyneyPo> = useMemo(
    () => [
      {
        title: '#',
        render: (_text: string, _record: ISyneyPo, index) =>
          (page - 1) * pageSize + index + 1,
        width: 50,
      },
      {
        title: '交货日期',
        dataIndex: 'EndDate',
        width: 110,
        render: (text: string) => format(new Date(text), 'yyyy-MM-dd'),
      },
      {
        title: '送货状态',
        dataIndex: 'Status',
        width: 100,
        render: (text: string) => {
          switch (text) {
            case '已创建':
              return <span className="text-red-500/80">{text}</span>
            case '部分送货':
              return <span className="text-yellow-500/80">{text}</span>
            case '已入库':
              return <span className="text-green-500/80">{text}</span>
            case '暂停':
              return <span className="text-pink-500/80">{text}</span>
            case '作废':
              return <span className="text-gray-500/80">{text}</span>
          }
        },
      },
      {
        title: '订单号-[生产号]',
        dataIndex: 'No',
        width: 220,
        render: (text: string, record: ISyneyPo) => (
          <Link className="text-blue-500/80" to={`/syney-po-list/${record.id}`}>
            {`${text}-[${record.SONo?.split('-').at(-2)}-${record.SONo?.split('-').at(-1)}]`}
          </Link>
        ),
      },
      {
        title: '规格',
        dataIndex: 'Spec',
        width: 160,
      },
      {
        title: '数量',
        dataIndex: 'Qty',
        width: 60,
      },
      {
        title: '商标',
        dataIndex: 'Brand',
        width: 160,
      },
      {
        title: '工艺要求',
        dataIndex: 'Technique',
        width: 160,
        render: (text: string) => {
          // 将逗号替换为空格，用于订单列表显示
          return text ? text.replace(/,/g, ' ') : ''
        },
      },
      {
        title: '编号',
        dataIndex: 'SerialNo',
        width: 70,
      },
      {
        title: '生产号',
        dataIndex: 'SONo',
        width: 180,
      },
      {
        title: '备注',
        dataIndex: 'Remark',
      },
    ],
    [page, pageSize],
  )

  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  const { isLoading, pos } = usePos()

  const rowSelection: TableProps<ISyneyPo>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
  }
  return (
    <Table<ISyneyPo>
      rowSelection={rowSelection}
      rowKey={(record) => record.id ?? ''}
      columns={columns}
      dataSource={pos}
      loading={isLoading}
      pagination={false}
      scroll={{
        y: 'calc(100vh - 320px)',
      }}
      summary={(pageData) => {
        let totalCount = 0
        pageData.forEach((item) => {
          totalCount += item.Qty || 0
        })
        return (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={6}>
                合计
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7}>{totalCount}</Table.Summary.Cell>
              <Table.Summary.Cell index={8} colSpan={3} />
            </Table.Summary.Row>
          </Table.Summary>
        )
      }}
    />
  )
}

// 使用 memo 优化,避免不必要的重渲染
export default memo(PoTable)
