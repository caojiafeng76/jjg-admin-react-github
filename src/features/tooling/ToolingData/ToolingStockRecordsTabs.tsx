import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Pagination, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import type { ToolingStockIn } from '@/services/apiToolingStockIn'
import type { ToolingStockOut } from '@/services/apiToolingStockOut'
import { TableEmpty } from '@/ui/TableState'
import { formatNumber } from '@/utils/format'
import {
  TOOLING_DETAIL_RECORDS_PAGE_SIZE,
  useToolingStockInRecords,
  useToolingStockOutRecords,
} from './useToolingDataDetail'

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function renderStatus(value: ToolingStockIn['status']) {
  return <Tag color={value === '已审核' ? 'success' : 'default'}>{value}</Tag>
}

function RecordsPagination({
  page,
  total,
  onChange,
}: {
  page: number
  total: number
  onChange: (page: number) => void
}) {
  return (
    <div className="mt-3 flex justify-end">
      <Pagination
        size="small"
        current={page}
        pageSize={TOOLING_DETAIL_RECORDS_PAGE_SIZE}
        total={total}
        showSizeChanger={false}
        showTotal={(value) => `共 ${value} 条`}
        onChange={onChange}
      />
    </div>
  )
}

function RecordsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert
      type="error"
      showIcon
      title="获取刀具出入库记录失败"
      action={
        <Button size="small" onClick={onRetry}>
          重试
        </Button>
      }
    />
  )
}

export function ToolingStockInRecordsTab({
  toolingDataId,
}: {
  toolingDataId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useToolingStockInRecords({
    toolingDataId,
    page,
  })

  const columns = useMemo<TableColumnsType<ToolingStockIn>>(
    () => [
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        render: renderStatus,
      },
      {
        title: '入库数量',
        dataIndex: 'stock_in_quantity',
        key: 'stock_in_quantity',
        width: 110,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        ellipsis: true,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
    ],
    [],
  )

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      setPage((current) => Math.max(current - 1, 1))
    }
  }, [data, page])

  if (error) {
    return <RecordsError onRetry={refetch} />
  }

  return (
    <>
      <Table<ToolingStockIn>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 640 }}
        size="small"
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无入库记录"
              description="可通过上方「新建入库」登记入库单"
            />
          ),
        }}
        rowClassName={(_, index) =>
          index % 2 === 0
            ? 'bg-white dark:bg-slate-800'
            : 'bg-slate-50/60 dark:bg-slate-800/60'
        }
      />
      <RecordsPagination
        page={page}
        total={data?.total || 0}
        onChange={setPage}
      />
    </>
  )
}

export function ToolingStockOutRecordsTab({
  toolingDataId,
}: {
  toolingDataId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useToolingStockOutRecords({
    toolingDataId,
    page,
  })

  const columns = useMemo<TableColumnsType<ToolingStockOut>>(
    () => [
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        render: renderStatus,
      },
      {
        title: '出库日期',
        dataIndex: 'stock_out_date',
        key: 'stock_out_date',
        width: 110,
        render: (value: string) => value || '-',
      },
      {
        title: '领用人',
        dataIndex: 'recipient',
        key: 'recipient',
        width: 100,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '用途',
        dataIndex: 'purpose',
        key: 'purpose',
        width: 140,
        ellipsis: true,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '领用方式',
        dataIndex: 'collection_method',
        key: 'collection_method',
        width: 100,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '机器编号',
        dataIndex: 'machine_no',
        key: 'machine_no',
        width: 130,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '出库数量',
        dataIndex: 'stock_out_quantity',
        key: 'stock_out_quantity',
        width: 100,
        render: (value: number) => formatNumber(value),
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        ellipsis: true,
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
    ],
    [],
  )

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      setPage((current) => Math.max(current - 1, 1))
    }
  }, [data, page])

  if (error) {
    return <RecordsError onRetry={refetch} />
  }

  return (
    <>
      <Table<ToolingStockOut>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 1040 }}
        size="small"
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无出库记录"
              description="可通过上方「新建出库」登记出库单"
            />
          ),
        }}
        rowClassName={(_, index) =>
          index % 2 === 0
            ? 'bg-white dark:bg-slate-800'
            : 'bg-slate-50/60 dark:bg-slate-800/60'
        }
      />
      <RecordsPagination
        page={page}
        total={data?.total || 0}
        onChange={setPage}
      />
    </>
  )
}
