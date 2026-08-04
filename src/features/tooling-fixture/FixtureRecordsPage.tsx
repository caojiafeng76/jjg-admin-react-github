import { useCallback, useMemo, useState } from 'react'
import {
  App,
  Button,
  Card,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { TableColumnsType } from 'antd'

import type { ToolingFixtureUsageRecord } from '@/services/apiToolingFixturePublic'
import {
  useDeleteToolingFixtureUsageRecords,
  useToolingFixtureUsageRecords,
} from './useToolingFixtures'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function FixtureRecordsPage() {
  const { message, modal } = App.useApp()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [action, setAction] = useState<ToolingFixtureUsageRecord['action']>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const { data, isLoading } = useToolingFixtureUsageRecords({
    page,
    pageSize,
    action,
  })
  const deleteMutation = useDeleteToolingFixtureUsageRecords()

  const handleDelete = useCallback(
    (record: ToolingFixtureUsageRecord) => {
      modal.confirm({
        title: '确认删除该条出入记录？',
        content: `删除后无法恢复，当前记录：${record.fixture_no}（${record.action}）`,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync([record.id])
            message.success('出入记录删除成功')
            setSelectedRowKeys([])
          } catch (error) {
            message.error(
              error instanceof Error ? error.message : '删除出入记录失败',
            )
          }
        },
      })
    },
    [deleteMutation, message, modal],
  )

  const handleDeleteSelected = useCallback(() => {
    const ids = selectedRowKeys.map(String)

    modal.confirm({
      title: '确认删除选中的出入记录？',
      content: `删除后无法恢复，共 ${ids.length} 条记录。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(ids)
          message.success('出入记录删除成功')
          setSelectedRowKeys([])
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : '删除出入记录失败',
          )
        }
      },
    })
  }, [deleteMutation, message, modal, selectedRowKeys])

  const columns = useMemo<TableColumnsType<ToolingFixtureUsageRecord>>(
    () => [
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
      {
        title: '操作',
        key: 'actions',
        fixed: 'right',
        width: 80,
        render: (_value, record) => (
          <Button
            type="link"
            danger
            size="small"
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        ),
      },
    ],
    [handleDelete],
  )

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
        <Space wrap className="mb-4">
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
          {selectedRowKeys.length > 0 ? (
            <Button danger onClick={handleDeleteSelected}>
              删除选中
            </Button>
          ) : null}
        </Space>
        <Table<ToolingFixtureUsageRecord>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={data?.items ?? []}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 800 }}
        />
        <div className="mt-4 flex justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.total ?? 0}
            showSizeChanger
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onChange={setPage}
            onShowSizeChange={(_current, size) => {
              setPage(1)
              setPageSize(size)
            }}
          />
        </div>
      </Card>
    </div>
  )
}
