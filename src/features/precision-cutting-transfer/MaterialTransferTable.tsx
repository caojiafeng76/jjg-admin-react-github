import { useCallback, useMemo } from 'react'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import type { PrecisionCuttingTransferRow } from '@/services/apiPrecisionCuttingTransfers'

interface Props {
  loading: boolean
  data: PrecisionCuttingTransferRow[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  scrollY?: number
  rowHeight?: number
  activeRowId?: string | null
  onRowClick?: (record: PrecisionCuttingTransferRow) => void
}

export default function MaterialTransferTable({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onSelect,
  scrollY = 400,
  rowHeight = 40,
  activeRowId,
  onRowClick,
}: Props) {
  const currentPageTransferQuantity = useMemo(
    () =>
      data.reduce(
        (total, record) => total + Number(record.transfer_quantity || 0),
        0,
      ),
    [data],
  )

  const columns: TableColumnsType<PrecisionCuttingTransferRow> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 50,
        fixed: 'left',
        render: (_text, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 165,
        sorter: (a, b) => {
          const at = a.created_at ? new Date(a.created_at).getTime() : 0
          const bt = b.created_at ? new Date(b.created_at).getTime() : 0
          return at - bt
        },
        sortDirections: ['descend', 'ascend'],
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
      {
        title: '审核状态',
        dataIndex: 'is_audited',
        key: 'is_audited',
        width: 90,
        filters: [
          { text: '已审核', value: true },
          { text: '待审核', value: false },
        ],
        onFilter: (value, record) => record.is_audited === value,
        render: (value: boolean) => (
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium shadow-sm ${
              value
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${value ? 'bg-emerald-500' : 'bg-slate-400'}`}
            />
            {value ? '已审核' : '待审核'}
          </div>
        ),
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 120,
        filters: Array.from(
          new Set(data.map((r) => r.customer).filter(Boolean)),
        ).map((v) => ({ text: v as string, value: v as string })),
        onFilter: (value, record) => record.customer === (value as string),
        filterSearch: true,
        sorter: (a, b) =>
          String(a.customer || '').localeCompare(
            String(b.customer || ''),
            'zh-CN',
          ),
        render: (value: string | null) => value || '-',
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 130,
        filters: Array.from(new Set(data.map((r) => r.project_no))).map(
          (v) => ({ text: v, value: v }),
        ),
        onFilter: (value, record) => record.project_no === (value as string),
        filterSearch: true,
        sorter: (a, b) =>
          String(a.project_no || '').localeCompare(
            String(b.project_no || ''),
            'zh-CN',
            { numeric: true, sensitivity: 'base' },
          ),
        defaultSortOrder: 'ascend',
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 130,
        filters: Array.from(
          new Set(data.map((r) => r.product_model).filter(Boolean)),
        ).map((v) => ({ text: v as string, value: v as string })),
        onFilter: (value, record) => record.product_model === (value as string),
        filterSearch: true,
        render: (value: string | null) => value || '-',
      },
      {
        title: '长度',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 80,
        filters: Array.from(
          new Set(
            data.map((r) => r.length_mm).filter((v): v is number => v !== null),
          ),
        )
          .sort((a, b) => a - b)
          .map((v) => ({ text: `${v}mm`, value: v })),
        onFilter: (value, record) => record.length_mm === (value as number),
        render: (value: number | null) => value ?? '-',
      },
      {
        title: '转移数量',
        dataIndex: 'transfer_quantity',
        key: 'transfer_quantity',
        width: 90,
        render: (value: number) => (
          <span className="font-semibold text-slate-700 tabular-nums">
            {value}
          </span>
        ),
      },
      {
        title: '操作人',
        key: 'operator_names',
        width: 160,
        render: (_text, record) => record.operator_names.join('、') || '-',
      },
      {
        title: '接收车间',
        dataIndex: 'target_workshop',
        key: 'target_workshop',
        width: 100,
        fixed: 'right',
        filters: Array.from(
          new Set(data.map((r) => r.target_workshop).filter(Boolean)),
        ).map((v) => ({ text: v, value: v })),
        onFilter: (value, record) =>
          record.target_workshop === (value as string),
        render: (value: string | null) =>
          value ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {value}
            </span>
          ) : (
            '-'
          ),
      },
    ],
    [page, pageSize, data],
  )

  const rowSelection: TableProps<PrecisionCuttingTransferRow>['rowSelection'] =
    {
      selectedRowKeys,
      onChange: onSelect,
      preserveSelectedRowKeys: true,
    }

  const handleRow = useCallback(
    (record: PrecisionCuttingTransferRow) => ({
      onClick: () => onRowClick?.(record),
      style: {
        cursor: onRowClick ? 'pointer' : undefined,
        backgroundColor:
          record.id && record.id === activeRowId ? '#f0f7ff' : undefined,
        height: rowHeight,
      },
    }),
    [activeRowId, onRowClick, rowHeight],
  )

  return (
    <Table<PrecisionCuttingTransferRow>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      onRow={handleRow}
      scroll={{ x: 1120, y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={7}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8}>
              <span className="font-bold text-slate-900 tabular-nums">
                {currentPageTransferQuantity}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={9} colSpan={2} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
