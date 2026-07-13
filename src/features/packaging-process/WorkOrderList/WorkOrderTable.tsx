import { memo, useMemo } from 'react'
import { createKeyboardTableRowProps } from '@/utils/keyboardTableRow'
import { Table, type TableColumnsType } from 'antd'
import dayjs from 'dayjs'

import type { PackagingWorkOrderBatch } from '@/services/apiPackagingWorkOrders'

interface Props {
  loading: boolean
  data: PackagingWorkOrderBatch[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function WorkOrderTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<PackagingWorkOrderBatch> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '日期',
        dataIndex: 'work_date',
        key: 'work_date',
        width: 120,
        render: (value: string) => (value ? dayjs(value).format('MM-DD') : '-'),
      },
      {
        title: '人员',
        dataIndex: 'employee_names',
        key: 'employee_names',
        width: 140,
        render: (value: string[] | null | undefined) =>
          value?.join('、') || '-',
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 140,
        render: (value: string | null) => value || '-',
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 160,
      },
      {
        title: '颜色',
        dataIndex: 'color_name',
        key: 'color_name',
        width: 90,
        render: (value: string | null) => value || '-',
      },
      {
        title: '工艺',
        dataIndex: 'process_name',
        key: 'process_name',
        width: 100,
        render: (value: string | null) => value || '-',
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 110,
        render: (value: number | null) => value ?? '-',
      },
      {
        title: '料号',
        dataIndex: 'part_no',
        key: 'part_no',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '米重',
        dataIndex: 'weight_per_meter_kg',
        key: 'weight_per_meter_kg',
        width: 90,
        align: 'right' as const,
        render: (value: number | null | undefined) =>
          value !== null && value !== undefined
            ? Number(value).toFixed(4)
            : '0.0000',
      },
      {
        title: '单位',
        dataIndex: 'unit',
        key: 'unit',
        width: 70,
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80,
        align: 'right' as const,
      },
      {
        title: '不良数量',
        dataIndex: 'defective_quantity',
        key: 'defective_quantity',
        width: 100,
        align: 'right' as const,
        render: (value: number | null | undefined) =>
          value !== null && value !== undefined
            ? Number(value).toFixed(1)
            : '0.0',
      },
      {
        title: '不良重量',
        dataIndex: 'defective_weight_kg',
        key: 'defective_weight_kg',
        width: 100,
        align: 'right' as const,
        render: (value: number | null | undefined) =>
          value !== null && value !== undefined
            ? Number(value).toFixed(2)
            : '0.00',
      },
      {
        title: '不良原因',
        dataIndex: 'defect_reason',
        key: 'defect_reason',
        width: 180,
        render: (value: string | null) => value || '-',
      },
      {
        title: '标时/s',
        dataIndex: 'standard_seconds',
        key: 'standard_seconds',
        width: 90,
        align: 'right' as const,
      },
      {
        title: '人均时间(小时)',
        dataIndex: 'work_hours',
        key: 'work_hours',
        width: 110,
        align: 'right' as const,
        render: (value: number) =>
          value !== null && value !== undefined
            ? Number(value).toFixed(2)
            : '0.00',
      },
      {
        title: '总工时(小时)',
        dataIndex: 'total_work_hours',
        key: 'total_work_hours',
        width: 110,
        align: 'right' as const,
        render: (value: number) =>
          value !== null && value !== undefined
            ? Number(value).toFixed(2)
            : '0.00',
      },
      {
        title: '数据状态',
        dataIndex: 'is_historical_inconsistent',
        key: 'is_historical_inconsistent',
        width: 130,
        render: (value: boolean) => (value ? '历史数据不一致' : '-'),
      },
      {
        title: '零工',
        dataIndex: 'extra_qualified_hours',
        key: 'extra_qualified_hours',
        width: 90,
        align: 'right' as const,
        render: (value: number | null | undefined) =>
          value !== null && value !== undefined
            ? Number(value).toFixed(2)
            : '0.00',
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 160,
        render: (value: string | null) => value || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 160,
        render: (value: string) =>
          value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
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
    <Table<PackagingWorkOrderBatch>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 2380, y: scrollY }}
      size="small"
      rowClassName={(_, index) =>
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
      }
      onRow={(record) => ({
        ...createKeyboardTableRowProps(
          () => onSelect([record.id]),
          `选择包装工单 ${record.id}`,
        ),
        onClick: () => onSelect([record.id]),
        style: { cursor: 'pointer', height: rowHeight },
      })}
    />
  )
}

export default memo(WorkOrderTable)
