import { useCallback, useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Table, type TableColumnsType, type TableProps } from 'antd'

import type { PrecisionFinishingCuttingWithEmployee } from '@/services/apiPrecisionFinishingCuttings'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'

interface Props {
  loading: boolean
  data: PrecisionFinishingCuttingWithEmployee[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  scrollY?: number
  rowHeight?: number
  activeRowId?: string | null
  onRowClick?: (record: PrecisionFinishingCuttingWithEmployee) => void
  /** 空态引导动作（通常为新建按钮），透传给 TableEmpty */
  emptyAction?: React.ReactNode
}

export default function PrecisionFinishingCuttingTable({
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
  emptyAction,
}: Props) {
  const currentPageTransferQuantity = useMemo(
    () =>
      data.reduce(
        (total, record) => total + Number(record.transfer_quantity || 0),
        0,
      ),
    [data],
  )

  const columns: TableColumnsType<PrecisionFinishingCuttingWithEmployee> =
    useMemo(
      () => [
        {
          title: '#',
          key: 'index',
          width: 50,
          fixed: 'left',
          align: 'right',
          render: (_text, _record, index) => (
            <span className="tabular-nums">{(page - 1) * pageSize + index + 1}</span>
          ),
        },
        {
          title: '创建时间',
          dataIndex: 'created_at',
          key: 'created_at',
          width: 165,
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
            <StatusPill tone={value ? 'success' : 'neutral'}>
              {value ? '已审核' : '待审核'}
            </StatusPill>
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
        },
        {
          title: '型号',
          dataIndex: 'product_model',
          key: 'product_model',
          width: 130,
          filters: Array.from(
            new Set(data.map((r) => r.product_model).filter(Boolean)),
          ).map((v) => ({ text: v as string, value: v as string })),
          onFilter: (value, record) =>
            record.product_model === (value as string),
          filterSearch: true,
          render: (value: string | null) => value || '-',
        },
        {
          title: '长度',
          dataIndex: 'length_mm',
          key: 'length_mm',
          width: 80,
          align: 'right',
          filters: Array.from(
            new Set(
              data
                .map((r) => r.length_mm)
                .filter((v): v is number => v !== null),
            ),
          )
            .sort((a, b) => a - b)
            .map((v) => ({ text: `${v}mm`, value: v })),
          onFilter: (value, record) => record.length_mm === (value as number),
          render: (value: number | null) =>
            value == null ? (
              '-'
            ) : (
              <span className="tabular-nums">{value}</span>
            ),
        },
        {
          title: '转移数量',
          dataIndex: 'transfer_quantity',
          key: 'transfer_quantity',
          width: 90,
          align: 'right',
          render: (value: number) => (
            <span className="font-semibold text-slate-700 tabular-nums dark:text-slate-200">
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
        },
      ],
      [page, pageSize, data],
    )

  const rowSelection: TableProps<PrecisionFinishingCuttingWithEmployee>['rowSelection'] =
    {
      selectedRowKeys,
      onChange: onSelect,
      preserveSelectedRowKeys: true,
    }

  const handleRow = useCallback(
    (record: PrecisionFinishingCuttingWithEmployee) => ({
      ...(onRowClick
        ? createKeyboardTableRowProps(
            () => onRowClick(record),
            `打开精加工记录 ${record.id}`,
          )
        : {}),
      onClick: () => onRowClick?.(record),
      style: {
        cursor: onRowClick ? 'pointer' : undefined,
        backgroundColor:
          record.id && record.id === activeRowId
            ? 'var(--table-active-row-bg-alt)'
            : undefined,
        height: rowHeight,
      },
    }),
    [activeRowId, onRowClick, rowHeight],
  )

  return (
    <Table<PrecisionFinishingCuttingWithEmployee>
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
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无精加工切割单"
            description="点击下方按钮创建第一条精加工切割单"
            action={emptyAction}
          />
        ),
      }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600 dark:[&_.ant-table-row:hover>td]:bg-blue-500/10 dark:[&_.ant-table-thead>tr>th]:border-slate-700 dark:[&_.ant-table-thead>tr>th]:bg-slate-800 dark:[&_.ant-table-thead>tr>th]:text-slate-400"
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row className="bg-slate-50 dark:bg-slate-800/80">
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={7}>
              <span className="font-medium text-slate-600 dark:text-slate-300">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8} align="right">
              <span className="font-bold text-slate-900 tabular-nums dark:text-slate-100">
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
