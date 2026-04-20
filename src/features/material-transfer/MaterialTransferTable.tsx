import { useCallback, useMemo } from 'react'
import { Table, Tag, type TableColumnsType, type TableProps } from 'antd'

import type { MaterialTransferWithEmployee } from '@/services/apiMaterialTransfers'

interface Props {
  loading: boolean
  data: MaterialTransferWithEmployee[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  scrollY?: number
  activeRowId?: string | null
  onRowClick?: (record: MaterialTransferWithEmployee) => void
}

export default function MaterialTransferTable({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onSelect,
  scrollY = 400,
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

  const columns: TableColumnsType<MaterialTransferWithEmployee> = useMemo(
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
        render: (value: boolean) => (
          <Tag color={value ? 'success' : 'default'}>
            {value ? '已审核' : '待审核'}
          </Tag>
        ),
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 130,
        sorter: (a, b) =>
          String(a.project_no || '').localeCompare(
            String(b.project_no || ''),
            'zh-CN',
            {
              numeric: true,
              sensitivity: 'base',
            },
          ),
        defaultSortOrder: 'ascend',
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 130,
        render: (value: string | null) => value || '-',
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 130,
        render: (value: string | null) => value || '-',
      },
      {
        title: '长度',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 80,
        render: (value: number | null) => value ?? '-',
      },
      {
        title: '转移数量',
        dataIndex: 'transfer_quantity',
        key: 'transfer_quantity',
        width: 90,
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
      },
    ],
    [page, pageSize],
  )

  const rowSelection: TableProps<MaterialTransferWithEmployee>['rowSelection'] =
    {
      selectedRowKeys,
      onChange: onSelect,
      preserveSelectedRowKeys: true,
    }

  const handleRow = useCallback(
    (record: MaterialTransferWithEmployee) => ({
      onClick: () => onRowClick?.(record),
      style: {
        cursor: onRowClick ? 'pointer' : undefined,
        backgroundColor:
          record.id && record.id === activeRowId ? '#e6f4ff' : undefined,
      },
    }),
    [activeRowId, onRowClick],
  )

  return (
    <Table<MaterialTransferWithEmployee>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      onRow={handleRow}
      scroll={{ x: 1120, y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={7}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={8}>
              <span className="font-semibold text-slate-900">
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
