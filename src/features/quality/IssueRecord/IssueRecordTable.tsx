import type { TableColumnsType } from 'antd'
import type { Key } from 'react'
import type { QualityIssueAuditStatus, QualityIssueRecord } from '@/services/apiQualityIssueRecords'
import type { StatusTone } from '@/ui/StatusPill'
import { Table } from 'antd'
import dayjs from 'dayjs'
import { memo, useMemo } from 'react'
import {
  getQualityIssueOperatorName,
  getQualityIssueReporterName,
} from '@/services/apiQualityIssueRecords'

import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { AUDIT_STATUS_LABELS } from './IssueRecordSearch'

const AUDIT_STATUS_TONES: Record<QualityIssueAuditStatus, StatusTone> = {
  approved: 'success',
  pending: 'info',
  rejected: 'danger',
}

function formatDate(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD') : '-'
}

function formatDateTime(value: string | null | undefined) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function formatNumber(value: number | null | undefined) {
  return value ?? '-'
}

function renderAuditStatus(status: QualityIssueAuditStatus) {
  return (
    <StatusPill tone={AUDIT_STATUS_TONES[status] || 'neutral'}>
      {AUDIT_STATUS_LABELS[status] || status}
    </StatusPill>
  )
}

interface Props {
  data: QualityIssueRecord[]
  loading: boolean
  onEdit?: (record: QualityIssueRecord) => void
  onSelect: (keys: Key[]) => void
  page: number
  pageSize: number
  rowHeight?: number
  scrollY?: number
  selectedRowKeys: Key[]
}

function IssueRecordTable({
  data,
  loading,
  onEdit,
  onSelect,
  page,
  pageSize,
  rowHeight = 40,
  scrollY = 400,
  selectedRowKeys,
}: Props) {
  const columns: TableColumnsType<QualityIssueRecord> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '审核状态',
        dataIndex: 'audit_status',
        key: 'audit_status',
        width: 110,
        fixed: 'left',
        render: renderAuditStatus,
      },
      {
        title: '生产日期',
        dataIndex: 'production_date',
        key: 'production_date',
        width: 120,
        fixed: 'left',
        render: formatDate,
      },
      {
        title: '上报人',
        key: 'reporter',
        width: 120,
        fixed: 'left',
        render: (_value, record) => getQualityIssueReporterName(record),
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 140,
        fixed: 'left',
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 150,
        render: (value: string | null) => value || '-',
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 150,
        render: (value: string | null) => value || '-',
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 100,
        render: formatNumber,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 150,
        render: (value: string | null) => value || '-',
      },
      {
        title: '订单数量',
        dataIndex: 'order_quantity',
        key: 'order_quantity',
        width: 100,
        render: formatNumber,
      },
      {
        title: '加工数量',
        dataIndex: 'processed_quantity',
        key: 'processed_quantity',
        width: 100,
      },
      {
        title: '合格数量',
        dataIndex: 'qualified_quantity',
        key: 'qualified_quantity',
        width: 100,
      },
      {
        title: '不良数量',
        dataIndex: 'defective_quantity',
        key: 'defective_quantity',
        width: 100,
      },
      {
        title: '不良率(%)',
        dataIndex: 'defect_rate',
        key: 'defect_rate',
        width: 110,
        render: (value: number) => Number(value || 0).toFixed(2),
      },
      {
        title: '质量问题',
        dataIndex: 'quality_issue',
        key: 'quality_issue',
        width: 260,
        ellipsis: true,
      },
      {
        title: '造成原因',
        dataIndex: 'cause',
        key: 'cause',
        width: 220,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '不良品处理结果',
        dataIndex: 'defective_handling_result',
        key: 'defective_handling_result',
        width: 220,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '问题类型',
        dataIndex: 'issue_type',
        key: 'issue_type',
        width: 120,
        render: (value: string) => value || '-',
      },
      {
        title: '责任处理结果',
        dataIndex: 'responsibility_handling_result',
        key: 'responsibility_handling_result',
        width: 220,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '操作人',
        key: 'operator',
        width: 110,
        render: (_value, record) => getQualityIssueOperatorName(record),
      },
      {
        title: '当班负责人',
        dataIndex: 'shift_leader_name',
        key: 'shift_leader_name',
        width: 120,
        render: (value: string) => value || '-',
      },
      {
        title: '检验人',
        dataIndex: 'inspector_name',
        key: 'inspector_name',
        width: 110,
        render: (value: string) => value || '-',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 220,
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: formatDateTime,
      },
    ],
    [page, pageSize],
  )

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys: Key[]) => onSelect(keys),
    }),
    [onSelect, selectedRowKeys],
  )

  return (
    <Table<QualityIssueRecord>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 3600, y: scrollY }}
      size="small"
      locale={{
        emptyText: (
          <TableEmpty
            title="暂无质量问题记录"
            description="点击上方「添加」记录质量问题"
          />
        ),
      }}
      rowClassName={zebraRowClassName}
      onRow={record => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择质量问题 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        onDoubleClick: () => onEdit?.(record),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}

export default memo(IssueRecordTable)
