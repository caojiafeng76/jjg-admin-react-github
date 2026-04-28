import { useMemo } from 'react'
import dayjs from 'dayjs'
import { Table, type TableColumnsType } from 'antd'

import type { QualityReworkRepair } from '@/services/apiQualityReworkRepair'

function formatDate(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

function formatDateTime(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
}

interface Props {
  loading: boolean
  data: QualityReworkRepair[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function ReworkRepairTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<QualityReworkRepair> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '编号',
        dataIndex: 'document_no',
        key: 'document_no',
        width: 150,
        fixed: 'left',
        render: (value: string | null) => value || '-',
      },
      {
        title: '类别',
        dataIndex: 'rework_category',
        key: 'rework_category',
        width: 150,
      },
      {
        title: '产品名称',
        dataIndex: 'product_name',
        key: 'product_name',
        width: 180,
      },
      {
        title: '规格型号',
        dataIndex: 'specification_model',
        key: 'specification_model',
        width: 160,
      },
      {
        title: '责任单位',
        dataIndex: 'responsible_unit',
        key: 'responsible_unit',
        width: 140,
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 90,
      },
      {
        title: '计划返工',
        dataIndex: 'planned_rework_date',
        key: 'planned_rework_date',
        width: 120,
        render: formatDate,
      },
      {
        title: '实际返工',
        dataIndex: 'actual_rework_date',
        key: 'actual_rework_date',
        width: 120,
        render: formatDate,
      },
      {
        title: '不合格描述',
        dataIndex: 'defect_description',
        key: 'defect_description',
        width: 260,
        ellipsis: true,
      },
      {
        title: '申请理由',
        dataIndex: 'application_reason',
        key: 'application_reason',
        width: 260,
        ellipsis: true,
      },
      {
        title: '申请人',
        dataIndex: 'workshop_applicant',
        key: 'workshop_applicant',
        width: 120,
        render: (value: string) => value || '-',
      },
      {
        title: '生产部审核',
        dataIndex: 'production_reviewer',
        key: 'production_reviewer',
        width: 130,
        render: (value: string) => value || '-',
      },
      {
        title: '改进措施',
        dataIndex: 'improvement_actions',
        key: 'improvement_actions',
        width: 260,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '验证结果',
        dataIndex: 'verification_result',
        key: 'verification_result',
        width: 260,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: formatDateTime,
      },
    ],
    [page, pageSize],
  )

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: React.Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<QualityReworkRepair>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 2790, y: scrollY }}
      size="small"
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }
      onRow={(record) => ({
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}
