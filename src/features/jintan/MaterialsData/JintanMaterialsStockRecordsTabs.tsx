import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Pagination, Table, type TableColumnsType } from 'antd'

import type { JintanMaterialsStockIn } from '@/services/apiJintanMaterialsStockIn'
import type { JintanMaterialsStockOut } from '@/services/apiJintanMaterialsStockOut'
import { TableEmpty } from '@/ui/TableState'
import {
  JINTAN_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
  useJintanMaterialsStockInRecords,
  useJintanMaterialsStockOutRecords,
} from './useJintanMaterialsDataDetail'

function formatDateTime(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
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
        pageSize={JINTAN_MATERIALS_DETAIL_RECORDS_PAGE_SIZE}
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
      title="获取素材出入库记录失败"
      action={
        <Button size="small" onClick={onRetry}>
          重试
        </Button>
      }
    />
  )
}

const stockInColumns: TableColumnsType<JintanMaterialsStockIn> = [
  {
    title: '入库数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 110,
    render: (value: number) => Number(value ?? 0).toLocaleString('zh-CN'),
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
]

const stockOutColumns: TableColumnsType<JintanMaterialsStockOut> = [
  {
    title: '出库数量',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 110,
    render: (value: number) => Number(value ?? 0).toLocaleString('zh-CN'),
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
]

export function JintanMaterialsStockInRecordsTab({
  inventoryId,
}: {
  inventoryId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useJintanMaterialsStockInRecords({
    inventoryId,
    page,
  })
  const columns = useMemo(() => stockInColumns, [])

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
      <Table<JintanMaterialsStockIn>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 560 }}
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

export function JintanMaterialsStockOutRecordsTab({
  inventoryId,
}: {
  inventoryId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useJintanMaterialsStockOutRecords(
    {
      inventoryId,
      page,
    },
  )
  const columns = useMemo(() => stockOutColumns, [])

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
      <Table<JintanMaterialsStockOut>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 560 }}
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
