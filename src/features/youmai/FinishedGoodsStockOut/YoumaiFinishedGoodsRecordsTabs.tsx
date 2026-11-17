import type { TableColumnsType } from 'antd'
import type { YoumaiFinishedGoodsInventoryAdjustment } from '@/services/apiYoumaiFinishedGoodsInventoryAdjustments'
import type { YoumaiFinishedGoodsStockIn } from '@/services/apiYoumaiFinishedGoodsStockIn'
import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { Alert, Button, Pagination, Table } from 'antd'
import { useEffect, useState } from 'react'

import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format'
import {
  useYoumaiFinishedGoodsAdjustmentRecords,
  useYoumaiFinishedGoodsStockInRecords,
  useYoumaiFinishedGoodsStockOutRecords,
  YOUMAI_FINISHED_GOODS_DETAIL_RECORDS_PAGE_SIZE,
} from './useYoumaiFinishedGoodsDetail'

function formatStockQty(value: number | null | undefined) {
  if (value === null || value === undefined)
    return '-'
  return Number.isInteger(value) ? formatNumber(value, 0) : formatNumber(value, 3)
}

function formatDifference(value: number) {
  const formatted = formatStockQty(value)
  return value > 0 ? `+${formatted}` : formatted
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
        pageSize={YOUMAI_FINISHED_GOODS_DETAIL_RECORDS_PAGE_SIZE}
        total={total}
        showSizeChanger={false}
        showTotal={value => `共 ${value} 条`}
        onChange={onChange}
      />
    </div>
  )
}

function RecordsError({
  title,
  onRetry,
}: {
  title: string
  onRetry: () => void
}) {
  return (
    <Alert
      type="error"
      showIcon
      title={title}
      action={(
        <Button size="small" onClick={onRetry}>
          重试
        </Button>
      )}
    />
  )
}

const stockInColumns: TableColumnsType<YoumaiFinishedGoodsStockIn> = [
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 96,
    render: (value: YoumaiFinishedGoodsStockIn['status']) => (
      <StatusPill tone={value === '已审核' ? 'success' : 'neutral'}>
        {value}
      </StatusPill>
    ),
  },
  {
    title: '入库数量',
    dataIndex: 'stock_in_quantity',
    key: 'stock_in_quantity',
    width: 100,
    align: 'right',
    render: (value: number) => formatStockQty(value),
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
    width: 155,
    render: (value: string) => formatDateTime(value),
  },
]

const stockOutColumns: TableColumnsType<YoumaiFinishedGoodsStockOut> = [
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 92,
    render: (value: YoumaiFinishedGoodsStockOut['status']) => (
      <StatusPill tone={value === '已审核' ? 'success' : 'neutral'}>
        {value}
      </StatusPill>
    ),
  },
  {
    title: '交货日期',
    dataIndex: 'delivery_date',
    key: 'delivery_date',
    width: 108,
    render: (value: string) => formatDate(value),
  },
  {
    title: '采购订单号',
    dataIndex: 'purchase_order_no',
    key: 'purchase_order_no',
    width: 140,
  },
  {
    title: '行号',
    dataIndex: 'purchase_order_line_no',
    key: 'purchase_order_line_no',
    width: 64,
    align: 'right',
  },
  {
    title: '合同号',
    dataIndex: 'contract_no',
    key: 'contract_no',
    width: 130,
    render: (value: string | null | undefined) => value || '-',
  },
  {
    title: '出库数量',
    dataIndex: 'stock_out_quantity',
    key: 'stock_out_quantity',
    width: 96,
    align: 'right',
    render: (value: number) => formatStockQty(value),
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    key: 'remarks',
    ellipsis: true,
    render: (value: string | null | undefined) => value || '-',
  },
]

const adjustmentColumns: TableColumnsType<YoumaiFinishedGoodsInventoryAdjustment> = [
  {
    title: '调整前',
    dataIndex: 'quantity_before',
    key: 'quantity_before',
    width: 90,
    align: 'right',
    render: (value: number) => formatStockQty(value),
  },
  {
    title: '调整后',
    dataIndex: 'quantity_after',
    key: 'quantity_after',
    width: 90,
    align: 'right',
    render: (value: number) => formatStockQty(value),
  },
  {
    title: '差额',
    dataIndex: 'difference',
    key: 'difference',
    width: 90,
    align: 'right',
    render: (value: number) => (
      <span className={value < 0 ? 'text-red-600 dark:text-red-400' : ''}>
        {formatDifference(value)}
      </span>
    ),
  },
  {
    title: '操作人',
    dataIndex: 'operator_name',
    key: 'operator_name',
    width: 96,
    render: (value: string | null | undefined) => value || '-',
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    key: 'remarks',
    ellipsis: true,
    render: (value: string | null | undefined) => value || '-',
  },
  {
    title: '调整时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 165,
    render: (value: string) => formatDateTime(value, { withSeconds: true }),
  },
]

export function YoumaiFinishedGoodsStockInRecordsTab({
  productDataId,
}: {
  productDataId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useYoumaiFinishedGoodsStockInRecords({
    productDataId,
    page,
  })

  useEffect(() => {
    setPage(1)
  }, [productDataId])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      setPage(current => Math.max(current - 1, 1))
    }
  }, [data, page])

  if (error) {
    return <RecordsError title="获取优迈成品入库记录失败" onRetry={refetch} />
  }

  return (
    <>
      <Table<YoumaiFinishedGoodsStockIn>
        rowKey="id"
        loading={isLoading}
        columns={stockInColumns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 580 }}
        size="small"
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无成品入库记录"
              description="可通过上方「新建入库」登记入库单"
            />
          ),
        }}
        rowClassName={(_, index) =>
          index % 2 === 0
            ? 'bg-white dark:bg-slate-800'
            : 'bg-slate-50/60 dark:bg-slate-800/60'}
      />
      <RecordsPagination
        page={page}
        total={data?.total || 0}
        onChange={setPage}
      />
    </>
  )
}

export function YoumaiFinishedGoodsStockOutRecordsTab({
  productDataId,
}: {
  productDataId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useYoumaiFinishedGoodsStockOutRecords({
    productDataId,
    page,
  })

  useEffect(() => {
    setPage(1)
  }, [productDataId])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      setPage(current => Math.max(current - 1, 1))
    }
  }, [data, page])

  if (error) {
    return <RecordsError title="获取优迈成品出库记录失败" onRetry={refetch} />
  }

  return (
    <>
      <Table<YoumaiFinishedGoodsStockOut>
        rowKey="id"
        loading={isLoading}
        columns={stockOutColumns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 760 }}
        size="small"
        locale={{
          emptyText: <TableEmpty title="暂无成品出库记录" />,
        }}
        rowClassName={(_, index) =>
          index % 2 === 0
            ? 'bg-white dark:bg-slate-800'
            : 'bg-slate-50/60 dark:bg-slate-800/60'}
      />
      <RecordsPagination
        page={page}
        total={data?.total || 0}
        onChange={setPage}
      />
    </>
  )
}

export function YoumaiFinishedGoodsAdjustmentRecordsTab({
  productDataId,
}: {
  productDataId: string
}) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error, refetch } = useYoumaiFinishedGoodsAdjustmentRecords({
    productDataId,
    page,
  })

  useEffect(() => {
    setPage(1)
  }, [productDataId])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      setPage(current => Math.max(current - 1, 1))
    }
  }, [data, page])

  if (error) {
    return <RecordsError title="获取优迈成品库存调整记录失败" onRetry={refetch} />
  }

  return (
    <>
      <Table<YoumaiFinishedGoodsInventoryAdjustment>
        rowKey="id"
        loading={isLoading}
        columns={adjustmentColumns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 720 }}
        size="small"
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无调整记录"
              description="直接修改或导入成品库存数量后会在这里留下记录"
            />
          ),
        }}
        rowClassName={(_, index) =>
          index % 2 === 0
            ? 'bg-white dark:bg-slate-800'
            : 'bg-slate-50/60 dark:bg-slate-800/60'}
      />
      <RecordsPagination
        page={page}
        total={data?.total || 0}
        onChange={setPage}
      />
    </>
  )
}
