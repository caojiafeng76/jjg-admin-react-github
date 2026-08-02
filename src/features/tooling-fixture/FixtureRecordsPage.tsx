import { useState } from 'react'
import { Card, Pagination, Select, Table, Tag, Typography } from 'antd'
import type { TableColumnsType } from 'antd'

import type { ToolingFixtureUsageRecord } from '@/services/apiToolingFixturePublic'
import { useToolingFixtureUsageRecords } from './useToolingFixtures'

const PAGE_SIZE = 20

const columns: TableColumnsType<ToolingFixtureUsageRecord> = [
  {
    title: '时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 190,
    render: (value: string) => new Date(value).toLocaleString('zh-CN'),
  },
  {
    title: '动作',
    dataIndex: 'action',
    key: 'action',
    width: 100,
    render: (value: ToolingFixtureUsageRecord['action']) => (
      <Tag color={value === '使用' ? 'orange' : 'green'}>{value}</Tag>
    ),
  },
  {
    title: '工装模具编号',
    dataIndex: 'fixture_no',
    key: 'fixture_no',
    width: 180,
  },
  {
    title: '产品名称',
    dataIndex: 'product_name',
    key: 'product_name',
    width: 180,
  },
  {
    title: '操作者',
    dataIndex: 'operator_name',
    key: 'operator_name',
    width: 140,
  },
]

export default function FixtureRecordsPage() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<ToolingFixtureUsageRecord['action']>()
  const { data, isLoading } = useToolingFixtureUsageRecords({
    page,
    pageSize: PAGE_SIZE,
    action,
  })

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <Typography.Title level={2} className="!mb-1">
          工装出入记录
        </Typography.Title>
        <Typography.Text type="secondary">
          查看现场扫码产生的使用与归还记录。
        </Typography.Text>
      </div>
      <Card>
        <div className="mb-4">
          <Select
            allowClear
            placeholder="按动作筛选"
            value={action}
            style={{ width: 150 }}
            options={[
              { label: '使用记录', value: '使用' },
              { label: '归还记录', value: '归还' },
            ]}
            onChange={(
              value: ToolingFixtureUsageRecord['action'] | undefined,
            ) => {
              setPage(1)
              setAction(value)
            }}
          />
        </div>
        <Table<ToolingFixtureUsageRecord>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          pagination={false}
          scroll={{ x: 800 }}
        />
        <div className="mt-4 flex justify-end">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={data?.total ?? 0}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      </Card>
    </div>
  )
}
