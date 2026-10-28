import type { TableColumnsType, TableProps } from 'antd'
import type { Key } from 'react'
import type { ISyneyPo } from '@/types'
import { Table } from 'antd'
import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'

import StatusPill from '@/ui/StatusPill'
import { formatDate } from '@/utils/format'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { PO_STATUS_TONES, PO_STATUSES } from '../statusTones'
import { useTableSelection } from '../useTableSelection'

interface Props {
  loading: boolean
  data: ISyneyPo[]
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
  activeRowId?: number | null
  onRowClick?: (record: ISyneyPo) => void
}

function PoTable({
  loading,
  data,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
  activeRowId,
  onRowClick,
}: Props) {
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()

  const currentPageTotalQty = useMemo(
    () => data.reduce((total, record) => total + (record.Qty || 0), 0),
    [data],
  )

  const location = useLocation()
  // 详情页「返回列表」时恢复当前列表的筛选与分页
  const listHref = `${location.pathname}${location.search}`

  const columns: TableColumnsType<ISyneyPo> = useMemo(
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
        title: '交货日期',
        dataIndex: 'EndDate',
        key: 'EndDate',
        width: 120,
        sorter: (a, b) => {
          const at = a.EndDate ? new Date(a.EndDate).getTime() : 0
          const bt = b.EndDate ? new Date(b.EndDate).getTime() : 0
          return at - bt
        },
        sortDirections: ['descend', 'ascend'],
        render: (text: string | null) => formatDate(text),
      },
      {
        title: '送货状态',
        dataIndex: 'Status',
        key: 'Status',
        width: 110,
        filters: PO_STATUSES.map(value => ({ text: value, value })),
        onFilter: (value, record) => record.Status === value,
        render: (text: string) => {
          const tone = PO_STATUS_TONES[text]
          if (!tone) {
            return <span className="text-slate-400 dark:text-slate-500">-</span>
          }
          return <StatusPill tone={tone}>{text}</StatusPill>
        },
      },
      {
        title: '送货单号',
        dataIndex: 'DeliveryNo',
        key: 'DeliveryNo',
        width: 130,
        render: (value: string | null | undefined) => (
          <span className="tabular-nums">{value || '-'}</span>
        ),
      },
      {
        title: '订单号-[生产号]',
        dataIndex: 'No',
        key: 'No',
        width: 240,
        render: (text: string, record: ISyneyPo) => (
          <Link
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            to={`/syney-po-list/${record.id}`}
            state={{ from: listHref }}
          >
            {`${text}-[${record.SONo?.split('-').at(-2)}-${record.SONo?.split('-').at(-1)}]`}
          </Link>
        ),
      },
      {
        title: '规格',
        dataIndex: 'Spec',
        key: 'Spec',
        width: 180,
        ellipsis: true,
      },
      {
        title: '数量',
        dataIndex: 'Qty',
        key: 'Qty',
        width: 80,
        align: 'right',
        render: (value: number) => (
          <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
            {value ?? '-'}
          </span>
        ),
        sorter: (a, b) => (a.Qty || 0) - (b.Qty || 0),
      },
      {
        title: '商标',
        dataIndex: 'Brand',
        key: 'Brand',
        width: 160,
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
      {
        title: '工艺要求',
        dataIndex: 'Technique',
        key: 'Technique',
        width: 180,
        ellipsis: true,
        render: (text: string) => (text ? text.replace(/,/g, ' ') : '-'),
      },
      {
        title: '编号',
        dataIndex: 'SerialNo',
        key: 'SerialNo',
        width: 80,
        align: 'right',
        render: (value: number | null) => (
          <span className="tabular-nums">{value ?? '-'}</span>
        ),
      },
      {
        title: '生产号',
        dataIndex: 'SONo',
        key: 'SONo',
        width: 180,
        ellipsis: true,
      },
      {
        title: '备注',
        dataIndex: 'Remark',
        key: 'Remark',
        width: 200,
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
    ],
    [listHref, page, pageSize],
  )

  const rowSelection: TableProps<ISyneyPo>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  const handleRow = (record: ISyneyPo) => ({
    ...(onRowClick
      ? createKeyboardTableRowProps(
          () => onRowClick(record),
          `打开西尼订单 ${record.No || record.id}`,
        )
      : {}),
    onClick: () => onRowClick?.(record),
    style: {
      cursor: onRowClick ? 'pointer' : undefined,
      backgroundColor:
        record.id && record.id === activeRowId
          ? 'var(--table-active-row-bg)'
          : undefined,
      height: rowHeight,
    },
  })

  return (
    <Table<ISyneyPo>
      rowSelection={rowSelection}
      rowKey={record => record.id ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size="small"
      onRow={handleRow}
      scroll={{ x: 1480, y: scrollY }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 dark:[&_.ant-table-row:hover>td]:bg-blue-900/30 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600 dark:[&_.ant-table-thead>tr>th]:border-slate-700 dark:[&_.ant-table-thead>tr>th]:bg-slate-800 dark:[&_.ant-table-thead>tr>th]:text-slate-300"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50 dark:bg-slate-800">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={5}>
              <span className="font-medium text-slate-600 dark:text-slate-300">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              <span className="font-bold text-slate-900 tabular-nums dark:text-slate-100">
                {currentPageTotalQty.toLocaleString()}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} colSpan={5} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}

export default PoTable
