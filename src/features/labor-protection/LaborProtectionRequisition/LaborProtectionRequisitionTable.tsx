import { useMemo } from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { LaborProtectionRequisition } from '@/services/apiLaborProtectionRequisitions'

interface Props {
  loading: boolean
  data: LaborProtectionRequisition[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

export default function LaborProtectionRequisitionTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<LaborProtectionRequisition> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '种类',
        dataIndex: 'category',
        key: 'category',
        width: 180,
        fixed: 'left',
      },
      {
        title: '岗位',
        dataIndex: 'job_title',
        key: 'job_title',
        width: 180,
      },
      {
        title: '机器编号',
        dataIndex: 'machine_no',
        key: 'machine_no',
        width: 140,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '机器名称',
        dataIndex: 'machine_name',
        key: 'machine_name',
        width: 160,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        align: 'right',
      },
      {
        title: '领取人',
        dataIndex: 'recipient',
        key: 'recipient',
        width: 160,
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value: string) =>
          value ? new Date(value).toLocaleString('zh-CN') : '-',
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
    <Table<LaborProtectionRequisition>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1160, y: scrollY }}
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
