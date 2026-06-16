import { Key, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Table, TableColumnsType, TableProps } from 'antd'
import dayjs from 'dayjs'

import { useAppStore } from '@/store'
import { ISyneyPo } from '@/types'

const STATUS_STYLES: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  已创建: {
    label: '已创建',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  部分送货: {
    label: '部分送货',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  已入库: {
    label: '已入库',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  暂停: {
    label: '暂停',
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    dot: 'bg-pink-500',
  },
  作废: {
    label: '作废',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
  },
}

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
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  const currentPageTotalQty = useMemo(
    () => data.reduce((total, record) => total + (record.Qty || 0), 0),
    [data],
  )

  const columns: TableColumnsType<ISyneyPo> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 50,
        fixed: 'left',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
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
        defaultSortOrder: 'ascend',
        render: (text: string | null) =>
          text ? dayjs(new Date(text)).format('YYYY-MM-DD') : '-',
      },
      {
        title: '送货状态',
        dataIndex: 'Status',
        key: 'Status',
        width: 110,
        filters: Object.keys(STATUS_STYLES).map((value) => ({
          text: STATUS_STYLES[value].label,
          value,
        })),
        onFilter: (value, record) => record.Status === value,
        render: (text: string) => {
          const style = STATUS_STYLES[text]
          if (!style) {
            return <span className="text-slate-400">-</span>
          }
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
        title: '订单号-[生产号]',
        dataIndex: 'No',
        key: 'No',
        width: 240,
        render: (text: string, record: ISyneyPo) => (
          <Link
            className="font-medium text-blue-600 hover:text-blue-700"
            to={`/syney-po-list/${record.id}`}
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
        render: (value: number) => (
          <span className="font-semibold tabular-nums text-slate-700">
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
        render: (text: string) =>
          text ? text.replace(/,/g, ' ') : '-',
      },
      {
        title: '编号',
        dataIndex: 'SerialNo',
        key: 'SerialNo',
        width: 80,
        render: (value: number | null) => value ?? '-',
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
    [page, pageSize],
  )

  const rowSelection: TableProps<ISyneyPo>['rowSelection'] = {
    selectedRowKeys: tableSelectedKeys,
    onChange: (newSelectedRowKeys: Key[]) => {
      setTableSelectedKeys(newSelectedRowKeys)
    },
    preserveSelectedRowKeys: true,
  }

  const handleRow = (record: ISyneyPo) => ({
    onClick: () => onRowClick?.(record),
    style: {
      cursor: onRowClick ? 'pointer' : undefined,
      backgroundColor:
        record.id && record.id === activeRowId ? '#f0f7ff' : undefined,
      height: rowHeight,
    },
  })

  return (
    <Table<ISyneyPo>
      rowSelection={rowSelection}
      rowKey={(record) => record.id ?? ''}
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={false}
      size="small"
      onRow={handleRow}
      scroll={{ x: 1480, y: scrollY }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-row:hover>td]:bg-blue-50/50"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={5}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6}>
              <span className="font-bold text-slate-900 tabular-nums">
                {currentPageTotalQty}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={7} colSpan={4} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}

export default PoTable
