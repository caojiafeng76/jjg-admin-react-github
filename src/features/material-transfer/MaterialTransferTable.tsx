import { useMemo } from 'react'
import { Button, Table, type TableColumnsType, type TableProps } from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

import type { MaterialTransferWithEmployee } from '@/services/apiMaterialTransfers'

interface Props {
  loading: boolean
  data: MaterialTransferWithEmployee[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: MaterialTransferWithEmployee) => void
  scrollY?: number
}

export default function MaterialTransferTable({
  loading,
  data,
  page,
  pageSize,
  selectedRowKeys,
  onSelect,
  onEdit,
  scrollY = 400,
}: Props) {
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
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        fixed: 'left',
        width: 140,
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 140,
        render: (value: string | null) => value || '-',
      },
      {
        title: '长度',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 100,
        render: (value: number | null) => value ?? '-',
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 160,
        render: (value: string | null) => value || '-',
      },
      {
        title: '转移数量',
        dataIndex: 'transfer_quantity',
        key: 'transfer_quantity',
        width: 100,
      },
      {
        title: '操作人',
        key: 'employee',
        width: 120,
        render: (_text, record) => record.employee?.name || '-',
      },
      {
        title: '接收车间',
        dataIndex: 'target_workshop',
        key: 'target_workshop',
        width: 120,
      },
      {
        title: '接收人',
        dataIndex: 'recipient_name',
        key: 'recipient_name',
        width: 120,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 180,
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 72,
        fixed: 'right',
        render: (_text, record) => (
          <Button
            type="text"
            size="small"
            icon={<PencilSquareIcon className="h-4 w-4" />}
            onClick={() => onEdit(record)}
            title="编辑"
          />
        ),
      },
    ],
    [onEdit, page, pageSize],
  )

  const rowSelection: TableProps<MaterialTransferWithEmployee>['rowSelection'] =
    {
      selectedRowKeys,
      onChange: onSelect,
      preserveSelectedRowKeys: true,
    }

  return (
    <Table<MaterialTransferWithEmployee>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 1400, y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
    />
  )
}
