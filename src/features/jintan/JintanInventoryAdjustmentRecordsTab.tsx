import type { TableColumnsType } from 'antd'
import type { JintanInventoryAdjustment } from '@/services/apiJintanInventoryAdjustments'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Alert, Button, Pagination, Table } from 'antd'

import { useEffect, useState } from 'react'
import { queryConfig } from '@/config/queryClient'
import { getJintanInventoryAdjustmentList } from '@/services/apiJintanInventoryAdjustments'
import { TableEmpty } from '@/ui/TableState'
import { jintanKeys } from './queryKeys'

const JINTAN_ADJUSTMENT_RECORDS_PAGE_SIZE = 10

export type JintanInventoryCategory = 'parts' | 'profiles' | 'materials'

export interface JintanInventoryAdjustmentRecordsTabProps {
  category: JintanInventoryCategory
  inventoryId: string
}

const ADJUSTMENT_KEY_FACTORIES = {
  parts: jintanKeys.partsInventory.adjustments,
  profiles: jintanKeys.profilesInventory.adjustments,
  materials: jintanKeys.materialsInventory.adjustments,
} as const

function formatDifference(value: number) {
  const text = Number(value ?? 0).toLocaleString('zh-CN')
  return value > 0 ? `+${text}` : text
}

const columns: TableColumnsType<JintanInventoryAdjustment> = [
  {
    title: '调整前',
    dataIndex: 'quantity_before',
    key: 'quantity_before',
    width: 90,
    render: (value: number) => Number(value ?? 0).toLocaleString('zh-CN'),
  },
  {
    title: '调整后',
    dataIndex: 'quantity_after',
    key: 'quantity_after',
    width: 90,
    render: (value: number) => Number(value ?? 0).toLocaleString('zh-CN'),
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
    width: 170,
    render: (value: string) =>
      value ? new Date(value).toLocaleString('zh-CN') : '-',
  },
]

/** 资料详情抽屉内的库存调整记录，查询键挂在库存根下，库存更新后自动刷新 */
export default function JintanInventoryAdjustmentRecordsTab({
  category,
  inventoryId,
}: JintanInventoryAdjustmentRecordsTabProps) {
  const [page, setPage] = useState(1)
  const pageSize = JINTAN_ADJUSTMENT_RECORDS_PAGE_SIZE
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ADJUSTMENT_KEY_FACTORIES[category]({
      inventoryId,
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      getJintanInventoryAdjustmentList({ inventoryId, page, pageSize, signal }),
    placeholderData: keepPreviousData,
    throwOnError: false,
    ...queryConfig.list,
  })

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      setPage(current => Math.max(current - 1, 1))
    }
  }, [data, page])

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        title="获取库存调整记录失败"
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
      <Table<JintanInventoryAdjustment>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data?.items || []}
        pagination={false}
        scroll={{ x: 720 }}
        size="small"
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无调整记录"
              description="直接修改或导入库存数量后会在这里留下记录"
            />
          ),
        }}
        rowClassName={(_, index) =>
          index % 2 === 0
            ? 'bg-white dark:bg-slate-800'
            : 'bg-slate-50/60 dark:bg-slate-800/60'}
      />
      <div className="mt-3 flex justify-end">
        <Pagination
          size="small"
          current={page}
          pageSize={pageSize}
          total={data?.total || 0}
          showSizeChanger={false}
          showTotal={value => `共 ${value} 条`}
          onChange={setPage}
        />
      </div>
    </>
  )
}
