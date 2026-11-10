import type { TableColumnsType } from 'antd'
import type { SyneyMaterialsAdjustment } from '@/services/apiSyneyMaterialsReport'
import type { SyneyMaterialsStockDirection, SyneyMaterialsStockRecord } from '@/services/apiSyneyMaterialsStock'
import { Alert, Button, Pagination, Table } from 'antd'
import { useEffect, useState } from 'react'

import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import { TableEmpty } from '@/ui/TableState'
import { formatDateTime, renderText, zebraRowClassName } from '../display'
import {
  SYNEY_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
  useSyneyMaterialsAdjustments,
} from '../Inventory/useSyneyMaterialsInventory'
import { useSyneyMaterialsStockRecords } from '../Stock/useSyneyMaterialsStock'

function formatQuantity(value: number) {
  return Number(value ?? 0).toLocaleString('zh-CN')
}

function formatDifference(value: number) {
  const text = formatQuantity(value)
  return value > 0 ? `+${text}` : text
}

function RecordsShell<T extends { id: string }>({
  title,
  query,
  page,
  setPage,
  columns,
  emptyTitle,
  emptyDescription,
}: {
  title: string
  query: {
    data?: { items: T[], total: number }
    isLoading: boolean
    error: unknown
    refetch: () => unknown
  }
  page: number
  setPage: (page: number) => void
  columns: TableColumnsType<T>
  emptyTitle: string
  emptyDescription: string
}) {
  const { data, isLoading, error, refetch } = query

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0)
      setPage(Math.max(page - 1, 1))
  }, [data, page, setPage])

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title={`获取${title}失败`}
        action={(
          <Button size="small" onClick={() => refetch()}>
            重试
          </Button>
        )}
      />
    )
  }

  return (
    <>
      <Table<T>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 560 }}
        size="small"
        locale={{
          emptyText: <TableEmpty title={emptyTitle} description={emptyDescription} />,
        }}
        rowClassName={zebraRowClassName}
      />
      <div className="mt-3 flex justify-end">
        <Pagination
          size="small"
          current={page}
          pageSize={SYNEY_MATERIALS_DETAIL_RECORDS_PAGE_SIZE}
          total={data?.total || 0}
          showSizeChanger={false}
          showTotal={value => `共 ${value} 条`}
          onChange={setPage}
        />
      </div>
    </>
  )
}

export function SyneyMaterialsStockRecordsTab({
  direction,
  inventoryId,
}: {
  direction: SyneyMaterialsStockDirection
  inventoryId: string
}) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  const [page, setPage] = useState(1)
  const query = useSyneyMaterialsStockRecords(direction, { inventoryId, page })

  const columns: TableColumnsType<SyneyMaterialsStockRecord> = [
    {
      title: `${label}数量`,
      dataIndex: 'quantity',
      key: 'quantity',
      width: 110,
      render: formatQuantity,
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
      render: renderText,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: formatDateTime,
    },
  ]

  return (
    <RecordsShell
      title={`材料${label}记录`}
      query={query}
      page={page}
      setPage={setPage}
      columns={columns}
      emptyTitle={`暂无${label}记录`}
      emptyDescription={`可通过上方「新建${label}」登记${label}单`}
    />
  )
}

const ADJUSTMENT_COLUMNS: TableColumnsType<SyneyMaterialsAdjustment> = [
  {
    title: '调整前',
    dataIndex: 'quantity_before',
    key: 'quantity_before',
    width: 90,
    render: formatQuantity,
  },
  {
    title: '调整后',
    dataIndex: 'quantity_after',
    key: 'quantity_after',
    width: 90,
    render: formatQuantity,
  },
  {
    title: '差额',
    dataIndex: 'difference',
    key: 'difference',
    width: 90,
    render: (value: number) => (
      <span className={value < 0 ? 'text-red-500' : ''}>
        {formatDifference(value)}
      </span>
    ),
  },
  {
    title: '操作人',
    dataIndex: 'operator_name',
    key: 'operator_name',
    width: 100,
    render: renderText,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    key: 'remarks',
    ellipsis: true,
    render: renderText,
  },
  {
    title: '调整时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 170,
    render: formatDateTime,
  },
]

export function SyneyMaterialsAdjustmentRecordsTab({
  inventoryId,
}: {
  inventoryId: string
}) {
  const [page, setPage] = useState(1)
  const query = useSyneyMaterialsAdjustments({ inventoryId, page })

  return (
    <RecordsShell
      title="库存调整记录"
      query={query}
      page={page}
      setPage={setPage}
      columns={ADJUSTMENT_COLUMNS}
      emptyTitle="暂无调整记录"
      emptyDescription="直接修改或导入库存数量后会在这里留下记录"
    />
  )
}
