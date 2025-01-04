import { Key } from 'react'
import { Table, TableColumnsType, TableProps } from 'antd'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

import { ISyneyStoreReport } from '@/types'
import { formatNumber } from '@/utils/helps'
import { useAppStore } from '@/store'
import { useReports } from './useReports'

const columns: TableColumnsType<ISyneyStoreReport> = [
  {
    title: '#',
    render: (_text: string, _record: ISyneyStoreReport, index) => index + 1,
    width: 50,
  },
  {
    title: '对账日期',
    dataIndex: 'created_at',
    render: (text: string) => format(new Date(text), 'yyyy-MM-dd'),
  },
  {
    title: '对账状态',
    dataIndex: 'Status',
    render: (text: string) =>
      text === 'unconfirmed' ? (
        <span className="text-red-500/80">未校对</span>
      ) : (
        <span className="text-green-500/80">已校对</span>
      ),
  },
  {
    title: '对账单号',
    dataIndex: 'No',
    render: (text: string) => (
      <Link
        className="text-blue-500/80"
        to={`/syney-store-report-list/${text}`}
      >
        {text}
      </Link>
    ),
  },
  {
    title: '对账金额',
    dataIndex: 'TotalAmount',
    render: (text: number) => formatNumber(text),
  },
]
export default function ReportTable() {
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  const { isLoading, reports } = useReports()

  const rowSelection: TableProps<ISyneyStoreReport>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
  }

  return (
    <Table<ISyneyStoreReport>
      rowSelection={rowSelection}
      rowKey={(record) => record.No ?? ''}
      columns={columns}
      dataSource={reports}
      loading={isLoading}
      pagination={false}
      scroll={{
        y: 560,
      }}
      summary={(pageData) => {
        let totalAmount = 0
        pageData.forEach((item) => {
          totalAmount += item.TotalAmount || 0
        })
        return (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                合计
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6}>
                {formatNumber(totalAmount)}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )
      }}
    />
  )
}
