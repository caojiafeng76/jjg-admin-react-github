import type { TableColumnsType, TableProps } from 'antd'
import type { Key } from 'react'
import type { ISyneyStoreReport } from '@/types'
import { Table } from 'antd'

import { useMemo } from 'react'

import { Link, useLocation } from 'react-router-dom'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { SUMMARY_ROW_CLASS_NAME, zebraRowClassName } from '@/ui/tableStyles'
import { formatDate } from '@/utils/format'
import { formatNumberPadded } from '@/utils/helps'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { getReportStatusTone, REPORT_STATUS_LABELS } from '../statusTones'
import { toggleTableSelectionKey, useTableSelection } from '../useTableSelection'

interface Props {
  loading: boolean
  data: ISyneyStoreReport[]
  page: number
  pageSize: number
  scrollY?: number
}

export default function ReportTable({
  loading,
  data,
  page,
  pageSize,
  scrollY = 400,
}: Props) {
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()

  const currentPageTotalAmount = useMemo(
    () => data.reduce((sum, item) => sum + Number(item.TotalAmount || 0), 0),
    [data],
  )

  const location = useLocation()
  // 详情页「返回列表」时恢复当前列表的筛选与分页
  const listHref = `${location.pathname}${location.search}`

  const columns: TableColumnsType<ISyneyStoreReport> = useMemo(
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
        render: (text: string | null) => formatDate(text),
      },
      {
        title: '对账状态',
        dataIndex: 'Status',
        key: 'Status',
        width: 110,
        render: (text: string) => (
          <StatusPill tone={getReportStatusTone(text)}>
            {REPORT_STATUS_LABELS[text] ?? '未校对'}
          </StatusPill>
        ),
      },
      {
        title: '对账单号',
        dataIndex: 'No',
        key: 'No',
        width: 200,
        render: (text: string) => (
          <Link
            className="font-medium text-primary hover:opacity-80"
            to={`/syney-store-report-list/${text}`}
            state={{ from: listHref }}
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
          <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {formatNumberPadded(text)}
          </span>
        ),
      },
    ],
    [listHref, page, pageSize],
  )

  const rowSelection: TableProps<ISyneyStoreReport>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  return (
    <Table<ISyneyStoreReport>
      rowSelection={rowSelection}
      rowKey={record => record.No ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      rowClassName={zebraRowClassName}
      locale={{ emptyText: <TableEmpty title="暂无西尼入库单" description="请新建或调整筛选条件" /> }}
      onRow={record =>
        record.No
          ? createKeyboardTableRowProps(
              () => setTableSelectedKeys(toggleTableSelectionKey(tableSelectedKeys, record.No)),
              `选择西尼对账单 ${record.No}`,
            )
          : {}}
      scroll={{ x: 700, y: scrollY }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className={SUMMARY_ROW_CLASS_NAME}>
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={4}>
              <span className="font-medium text-slate-600 dark:text-slate-300">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <span className="font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {formatNumberPadded(currentPageTotalAmount)}
              </span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
