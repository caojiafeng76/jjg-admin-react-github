import { Pagination, Table, TableColumnsType } from 'antd'
import { useMemo } from 'react'
import dayjs from 'dayjs'

import type { MachineRuntimeItem } from '@/services/apiMachineRuntime'

interface Props {
  loading: boolean
  data: MachineRuntimeItem[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number, pageSize: number) => void
  scrollY?: number
  rowHeight?: number
}

export default function MachineRuntimeDetailTable({
  loading,
  data,
  total,
  page,
  pageSize,
  onPageChange,
  scrollY = 350,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<MachineRuntimeItem> = useMemo(
    () => [
      {
        title: '#',
        render: (_: unknown, __: unknown, index: number) =>
          (page - 1) * pageSize + index + 1,
        key: '#',
        width: 50,
      },
      {
        title: '日期',
        dataIndex: 'order_date',
        key: 'order_date',
        width: 110,
        render: (value: string | null) =>
          value ? dayjs(value).format('YYYY-MM-DD') : '-',
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 120,
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 100,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 120,
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        key: 'length_mm',
        width: 90,
      },
      {
        title: '工序',
        dataIndex: 'operation',
        key: 'operation',
        width: 100,
      },
      {
        title: '来料接收数',
        dataIndex: 'incoming_qualified_quantity',
        key: 'incoming_qualified_quantity',
        width: 100,
      },
      {
        title: '操作人',
        dataIndex: 'operator_name',
        key: 'operator_name',
        width: 90,
        render: (value: string | null) => value || '-',
      },
      {
        title: '运行时间',
        key: 'runtime',
        width: 100,
        render: (_: unknown, record: MachineRuntimeItem) => {
          const seconds = record.runtime_seconds ?? 0
          if (seconds === 0) return <span className="text-slate-400">—</span>
          return `${(seconds / 3600).toFixed(2)} h`
        },
      },
    ],
    [page, pageSize],
  )

  return (
    <div className="flex flex-col gap-2">
      <Table<MachineRuntimeItem>
        rowKey={(r) => r.id}
        loading={loading}
        columns={columns}
        dataSource={data}
        scroll={{ y: scrollY, x: 1000 }}
        size="small"
        pagination={false}
        onRow={() => ({ style: { height: rowHeight } })}
      />
      <div className="flex justify-end">
        <Pagination
          total={total}
          current={page}
          pageSize={pageSize}
          onChange={onPageChange}
          showSizeChanger
          showTotal={(t) => `共 ${t} 条`}
          pageSizeOptions={['20', '50', '100']}
          size="small"
        />
      </div>
    </div>
  )
}
