import { memo, useMemo } from 'react'
import { Table, type TableColumnsType } from 'antd'

import type { PackagingEmployee } from '@/services/apiPackagingEmployees'

interface Props {
  loading: boolean
  data: PackagingEmployee[]
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  page: number
  pageSize: number
  scrollY?: number
  rowHeight?: number
}

function EmployeeTable({
  loading,
  data,
  selectedRowKeys,
  onSelect,
  page,
  pageSize,
  scrollY = 400,
  rowHeight = 40,
}: Props) {
  const columns: TableColumnsType<PackagingEmployee> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 60,
        fixed: 'left',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '用户名',
        dataIndex: 'username',
        key: 'username',
        width: 200,
      },
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 200,
      },
      {
        title: '岗位工资',
        dataIndex: 'position_salary',
        key: 'position_salary',
        width: 140,
        render: (value: number | null) =>
          value === null || value === undefined ? '-' : value,
      },
      {
        title: '时薪',
        dataIndex: 'hourly_wage',
        key: 'hourly_wage',
        width: 120,
        render: (value: number | null) =>
          value === null || value === undefined ? '-' : value,
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 200,
        render: (value: string | null) => value || '-',
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
    <Table<PackagingEmployee>
      rowKey="id"
      loading={loading}
      columns={columns}
      dataSource={data}
      rowSelection={rowSelection}
      pagination={false}
      scroll={{ x: 1100, y: scrollY }}
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

export default memo(EmployeeTable)
