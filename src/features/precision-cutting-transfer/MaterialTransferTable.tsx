import { useMemo } from 'react'
import {
  Button,
  Table,
  Tag,
  type TableColumnsType,
  type TableProps,
} from 'antd'
import { PencilSquareIcon } from '@heroicons/react/16/solid'

import type { PrecisionCuttingTransferRow } from '@/services/apiPrecisionCuttingTransfers'

interface Props {
  loading: boolean
  data: PrecisionCuttingTransferRow[]
  page: number
  pageSize: number
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: PrecisionCuttingTransferRow) => void
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
        width: 180,
        fixed: 'left',
        render: (text: string) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
      },
      {
        title: '审核状态',
        dataIndex: 'is_audited',
        key: 'is_audited',
        width: 100,
        fixed: 'left',
        render: (value: boolean) => (
          <Tag color={value ? 'success' : 'default'}>
            {value ? '已审核' : '待审核'}
          </Tag>
        ),
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        fixed: 'left',
        width: 140,
        render: (value: string | null) => value || '-',
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
        title: '长料长度(mm)',
        dataIndex: 'long_material_length_mm',
        key: 'long_material_length_mm',
        width: 120,
      },
      {
        title: '长料数量',
        dataIndex: 'long_material_quantity',
        key: 'long_material_quantity',
        width: 100,
      },
      {
        title: '原料不良数',
        dataIndex: 'raw_material_defect_count',
        key: 'raw_material_defect_count',
        width: 110,
      },
      {
        title: '加工不良数',
        dataIndex: 'processing_defect_count',
        key: 'processing_defect_count',
        width: 110,
      },
      {
        title: '转移数量',
        dataIndex: 'transfer_quantity',
        key: 'transfer_quantity',
        width: 100,
      },
      {
        title: '操作人',
        key: 'operator_names',
        width: 180,
        render: (_text, record) => record.operator_names.join('、') || '-',
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
        title: '检验人',
        dataIndex: 'inspector_name',
        key: 'inspector_name',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '数据上传',
        dataIndex: 'uploaded_by_name',
        key: 'uploaded_by_name',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '审核时间',
        dataIndex: 'audited_at',
        key: 'audited_at',
        width: 180,
        render: (text: string | null) => {
          if (!text) return '-'
          return new Date(text).toLocaleString('zh-CN')
        },
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
        title: '不良原因',
        dataIndex: 'defect_reason',
        key: 'defect_reason',
        width: 180,
        ellipsis: true,
        render: (value: string | null) => value || '-',
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

  const rowSelection: TableProps<PrecisionCuttingTransferRow>['rowSelection'] =
    {
      selectedRowKeys,
      onChange: onSelect,
      preserveSelectedRowKeys: true,
    }

  return (
    <Table<PrecisionCuttingTransferRow>
      rowKey={(record) => record.id}
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      scroll={{ x: 1960, y: scrollY }}
      size="small"
      pagination={false}
      style={{ fontSize: '12px' }}
      summary={() => (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} />
            <Table.Summary.Cell index={1} colSpan={11}>
              <span className="font-medium text-slate-600">当前页合计</span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={12}>
              <span className="font-semibold text-slate-900">
                {currentPageTransferQuantity}
              </span>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={13} colSpan={9} />
          </Table.Summary.Row>
        </Table.Summary>
      )}
    />
  )
}
