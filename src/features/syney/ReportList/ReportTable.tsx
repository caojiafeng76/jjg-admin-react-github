import { useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Table, TableColumnsType, TableProps } from 'antd'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'

import { ISyneyStoreReport } from '@/types'
import { formatNumber } from '@/utils/helps'
import { useAppStore } from '@/store'
import { useReports } from './useReports'
import { Key } from 'react'

interface Props {
  loading: boolean
  data: ISyneyStoreReport[]
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  activeRowId?: string | null
  onRowClick?: (record: ISyneyStoreReport) => void
}

const STATUS_STYLES: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  unconfirmed: {
    label: '未校对',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  confirmed: {
    label: '已校对',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  未校对: {
    label: '未校对',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  已校对: {
    label: '已校对',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
}

export default function ReportTable({
  loading,
  data,
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
  const { isLoading } = useReports()

  const currentPageTotalAmount = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.TotalAmount || 0), 0),
    [data],
  )

  const columns: TableColumnsType<ISyneyStoreReport> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 50,
        fixed: 'left',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '对账日期',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 130,
        sorter: (a, b) => {
          const at = a.created_at ? new Date(a.created_at).getTime() : 0
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0
          return at - bt
        },
        defaultSortOrder: 'descend',
        render: (text: string | null) =>
          text ? dayjs(new Date(text)).format('YYYY-MM-DD') : '-',
      },
      {
        title: '对账状态',
        dataIndex: 'Status',
        key: 'Status',
        width: 110,
        filters: [
          { text: '已校对', value: '已校对' },
          { text: '未校对', value: '未校对' },
        ],
        onFilter: (value, record) => record.Status === value,
        render: (text: string) => {
          const style = STATUS_STYLES[text] || STATUS_STYLES.unconfirmed
          return (
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${style.bg} ${style.text}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              {style.label}
            </div>
          )
        },
      },
      {
        title: '对账单号',
        dataIndex: 'No',
        key: 'No',
        width: 200,
        render: (text: string) => (
          <Link
            className="font-medium text-blue-600 hover:text-blue-700"
            to={`/syney-store-report-list/${text}`}
          >
            {text}
          </Link>
        ),
      },
      {
        title: '对账金额',
        dataIndex: 'TotalAmount',
        key: 'TotalAmount',
        width: 160,
        align: 'right',
        sorter: (a, b) => (a.TotalAmount || 0) - (b.TotalAmount || 0),
        render: (text: number) => (
          <span className="font-semibold text-slate-700 tabular-nums">
            {formatNumber(text)}
          </span>
        ),
      },
    ],
    [page, pageSize],
  )

  const rowSelection: TableProps<ISyneyStoreReport>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  const handleRow = (record: ISyneyStoreReport) => ({
    ...(onRowClick
      ? createKeyboardTableRowProps(
          () => onRowClick(record),
          `打开西尼对账单 ${record.No}`,
        )
      : {}),
    onClick: () => onRowClick?.(record),
    style: {
      cursor: onRowClick ? 'pointer' : undefined,
      backgroundColor:
        record.No && record.No === activeRowId ? '#f0f7ff' : undefined,
      height: rowHeight,
    },
  })

  return (
    <Table<ISyneyStoreReport>
      rowSelection={rowSelection}
      rowKey={(record) => record.No ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading || isLoading}
      pagination={false}
      size="small"
      onRow={handleRow}
      scroll={{ x: 700, y: scrollY }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={4}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
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
