import type { TableColumnsType } from 'antd'
import type { WorkshopMiscMaterialsAdjustment } from '@/services/apiWorkshopMiscMaterialsReport'
import type {
  WorkshopMiscMaterialsStockDirection,
  WorkshopMiscMaterialsStockRecord,
} from '@/services/apiWorkshopMiscMaterialsStock'
import { Alert, Button, Pagination, Table } from 'antd'
import { useEffect, useState } from 'react'

import { WORKSHOP_MISC_MATERIALS_STOCK_LABELS } from '@/services/apiWorkshopMiscMaterialsStock'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { formatDateTime } from '@/utils/format'
import { formatQuantity, formatSignedQuantity, renderText } from '../display'
import {
  useWorkshopMiscMaterialsAdjustments,
  WORKSHOP_MISC_MATERIALS_DETAIL_RECORDS_PAGE_SIZE,
} from '../Inventory/useWorkshopMiscMaterialsInventory'
import { useWorkshopMiscMaterialsStockRecords } from '../Stock/useWorkshopMiscMaterialsStock'

function RecordsShell<T extends { id: string }>({
  title,
  query,
  page,
  setPage,
  columns,
  emptyTitle,
  emptyDescription,
  scrollX = 640,
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
  scrollX?: number
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
        scroll={{ x: scrollX }}
        size="small"
        locale={{
          emptyText: (
            <TableEmpty title={emptyTitle} description={emptyDescription} />
          ),
        }}
        rowClassName={zebraRowClassName}
      />
      <div className="mt-3 flex justify-end">
        <Pagination
          size="small"
          current={page}
          pageSize={WORKSHOP_MISC_MATERIALS_DETAIL_RECORDS_PAGE_SIZE}
          total={data?.total || 0}
          showSizeChanger={false}
          showTotal={value => `共 ${value} 条`}
          onChange={setPage}
        />
      </div>
    </>
  )
}

export function WorkshopMiscMaterialsStockRecordsTab({
  direction,
  inventoryId,
}: {
  direction: WorkshopMiscMaterialsStockDirection
  inventoryId: string
}) {
  const label = WORKSHOP_MISC_MATERIALS_STOCK_LABELS[direction]
  const [page, setPage] = useState(1)
  const query = useWorkshopMiscMaterialsStockRecords(direction, {
    inventoryId,
    page,
  })

  const columns: TableColumnsType<WorkshopMiscMaterialsStockRecord> = [
    {
      title: '原材料',
      dataIndex: 'raw_material_quantity',
      key: 'raw_material_quantity',
      width: 85,
      align: 'right',
      render: (value: number) => (
        <span className="tabular-nums">{formatQuantity(value)}</span>
      ),
    },
    {
      title: '半成品',
      dataIndex: 'semi_finished_quantity',
      key: 'semi_finished_quantity',
      width: 85,
      align: 'right',
      render: (value: number) => (
        <span className="tabular-nums">{formatQuantity(value)}</span>
      ),
    },
    {
      title: '成品',
      dataIndex: 'finished_quantity',
      key: 'finished_quantity',
      width: 85,
      align: 'right',
      render: (value: number) => (
        <span className="tabular-nums">{formatQuantity(value)}</span>
      ),
    },
    {
      title: '合计',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
      width: 85,
      align: 'right',
      render: (value: number) => (
        <span className="font-medium tabular-nums">{formatQuantity(value)}</span>
      ),
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
      width: 155,
      render: value => formatDateTime(value),
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
      scrollX={640}
    />
  )
}

function renderStageAdjustment(before: number, after: number, diff: number) {
  if (diff === 0) {
    return (
      <span className="text-text-tertiary tabular-nums">
        {formatQuantity(after)}
      </span>
    )
  }
  return (
    <span className="tabular-nums">
      {formatQuantity(before)}→{formatQuantity(after)}
      <span className={diff < 0 ? 'ml-1 text-error' : 'ml-1 text-success'}>
        ({formatSignedQuantity(diff)})
      </span>
    </span>
  )
}

const ADJUSTMENT_COLUMNS: TableColumnsType<WorkshopMiscMaterialsAdjustment> = [
  {
    title: '原材料',
    key: 'raw',
    width: 130,
    align: 'right',
    render: (_value, row) =>
      renderStageAdjustment(
        row.raw_material_before,
        row.raw_material_after,
        row.raw_material_diff,
      ),
  },
  {
    title: '半成品',
    key: 'semi',
    width: 130,
    align: 'right',
    render: (_value, row) =>
      renderStageAdjustment(
        row.semi_finished_before,
        row.semi_finished_after,
        row.semi_finished_diff,
      ),
  },
  {
    title: '成品',
    key: 'finished',
    width: 130,
    align: 'right',
    render: (_value, row) =>
      renderStageAdjustment(
        row.finished_before,
        row.finished_after,
        row.finished_diff,
      ),
  },
  {
    title: '合计差额',
    dataIndex: 'total_difference',
    key: 'total_difference',
    width: 90,
    align: 'right',
    render: (value: number) => (
      <span className={`font-medium tabular-nums ${value < 0 ? 'text-error' : 'text-success'}`}>
        {formatSignedQuantity(value)}
      </span>
    ),
  },
  {
    title: '操作人',
    dataIndex: 'operator_name',
    key: 'operator_name',
    width: 90,
    render: renderText,
  },
  {
    title: '备注',
    dataIndex: 'remarks',
    key: 'remarks',
    width: 160,
    ellipsis: true,
    render: renderText,
  },
  {
    title: '调整时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 155,
    render: value => formatDateTime(value),
  },
]

export function WorkshopMiscMaterialsAdjustmentRecordsTab({
  inventoryId,
}: {
  inventoryId: string
}) {
  const [page, setPage] = useState(1)
  const query = useWorkshopMiscMaterialsAdjustments({ inventoryId, page })

  return (
    <RecordsShell
      title="库存调整记录"
      query={query}
      page={page}
      setPage={setPage}
      columns={ADJUSTMENT_COLUMNS}
      emptyTitle="暂无调整记录"
      emptyDescription="直接修改或导入库存数量后会在这里留下记录"
      scrollX={885}
    />
  )
}
