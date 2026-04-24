import React, { useMemo, useState } from 'react'
import { Button, Spin, Table, Tag, Tooltip } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PencilSquareIcon,
} from '@heroicons/react/16/solid'

import type {
  VillaLiftOrder,
  VillaLiftOrderItem,
} from '@/services/apiVillaLiftOrders'
import { useVillaLiftOrderItems } from './useVillaLiftOrders'

// ----------------------------------------------------------------
// 列选项搜索辅助：从当前数据中提取唯一值，生成带搜索的过滤器
// ----------------------------------------------------------------
function getSelectFilter(
  dataIndex: keyof VillaLiftOrder,
  data: VillaLiftOrder[],
) {
  const options = Array.from(
    new Set(data.map((r) => String(r[dataIndex] ?? '')).filter(Boolean)),
  )
    .sort()
    .map((v) => ({ text: v, value: v }))

  return {
    filters: options,
    filterSearch: true,
    onFilter: (value: React.Key | boolean, record: VillaLiftOrder) =>
      String(record[dataIndex] ?? '') === String(value),
  }
}

// ----------------------------------------------------------------
// 展开行：明细子表
// ----------------------------------------------------------------
interface ExpandedItemsProps {
  orderId: string
  onEditItems: (orderId: string) => void
  canEditItems: boolean
}

function ExpandedItems({
  orderId,
  onEditItems,
  canEditItems,
}: ExpandedItemsProps) {
  const { data: items = [], isLoading } = useVillaLiftOrderItems(orderId)

  const itemColumns: TableColumnsType<VillaLiftOrderItem> = [
    { title: '型号', dataIndex: 'model', key: 'model', width: 120 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '规格', dataIndex: 'spec', key: 'spec', width: 200 },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right',
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      render: (v: string) => v || '-',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spin size="small" />
      </div>
    )
  }

  return (
    <div className="px-8 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          订单明细 ({items.length} 条)
        </span>
        {canEditItems && (
          <Button
            type="dashed"
            size="small"
            icon={<PencilSquareIcon className="size-3.5" />}
            onClick={() => onEditItems(orderId)}
          >
            编辑明细
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="py-2 text-sm text-gray-400">暂无明细</div>
      ) : (
        <Table<VillaLiftOrderItem>
          dataSource={items}
          columns={itemColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// 主表格
// ----------------------------------------------------------------
interface Props {
  loading: boolean
  data: VillaLiftOrder[]
  page: number
  pageSize: number
  scrollY?: number
  canEdit: boolean
  canEditItems: boolean
  onEdit: (record: VillaLiftOrder) => void
  onEditItems: (orderId: string) => void
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
}

export default function VillaLiftOrderTable({
  loading,
  data,
  page,
  pageSize,
  scrollY = 400,
  canEdit,
  canEditItems,
  onEdit,
  onEditItems,
  selectedRowKeys,
  onSelectionChange,
}: Props) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const columns: TableColumnsType<VillaLiftOrder> = useMemo(
    () => [
      {
        title: '#',
        key: '#',
        width: 55,
        fixed: 'left',
        render: (_v: unknown, _r: VillaLiftOrder, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: '计划交货日期',
        dataIndex: 'planned_delivery_date',
        key: 'planned_delivery_date',
        width: 120,
        fixed: 'left',
        ...getSelectFilter('planned_delivery_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '排产日期',
        dataIndex: 'schedule_date',
        key: 'schedule_date',
        width: 110,
        fixed: 'left',
        ...getSelectFilter('schedule_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 130,
        fixed: 'left',
        ...getSelectFilter('customer', data),
        render: (v: string) => v || '-',
      },
      {
        title: '项目名称',
        dataIndex: 'project_name',
        key: 'project_name',
        width: 160,
        fixed: 'left',
        ...getSelectFilter('project_name', data),
        render: (v: string) => v || '-',
      },
      {
        title: '产品名称',
        dataIndex: 'product_name',
        key: 'product_name',
        width: 140,
        fixed: 'left',
        ...getSelectFilter('product_name', data),
        render: (v: string) => v || '-',
      },
      {
        title: '颜色',
        dataIndex: 'color',
        key: 'color',
        width: 100,
        fixed: 'left',
        ...getSelectFilter('color', data),
        render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 80,
        fixed: 'left',
        align: 'right',
        ...getSelectFilter('quantity', data),
      },
      {
        title: '挑料计划完成日期',
        dataIndex: 'tinting_plan_date',
        key: 'tinting_plan_date',
        width: 150,
        ...getSelectFilter('tinting_plan_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '挑料完成日期',
        dataIndex: 'material_selection_date',
        key: 'material_selection_date',
        width: 130,
        ...getSelectFilter('material_selection_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '喷涂计划完成日期',
        dataIndex: 'painting_plan_date',
        key: 'painting_plan_date',
        width: 150,
        ...getSelectFilter('painting_plan_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '喷涂完成日期',
        dataIndex: 'painting_date',
        key: 'painting_date',
        width: 130,
        ...getSelectFilter('painting_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '贴膜计划完成日期',
        dataIndex: 'film_plan_date',
        key: 'film_plan_date',
        width: 150,
        ...getSelectFilter('film_plan_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '贴膜完成日期',
        dataIndex: 'film_date',
        key: 'film_date',
        width: 130,
        ...getSelectFilter('film_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '切割要求完成日期',
        dataIndex: 'cutting_required_date',
        key: 'cutting_required_date',
        width: 150,
        ...getSelectFilter('cutting_required_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '切割实际完成日期',
        dataIndex: 'cutting_actual_date',
        key: 'cutting_actual_date',
        width: 150,
        ...getSelectFilter('cutting_actual_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '加工要求完成日期',
        dataIndex: 'processing_required_date',
        key: 'processing_required_date',
        width: 150,
        ...getSelectFilter('processing_required_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '加工实际完成日期',
        dataIndex: 'processing_actual_date',
        key: 'processing_actual_date',
        width: 150,
        ...getSelectFilter('processing_actual_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '检验完成日期',
        dataIndex: 'inspection_date',
        key: 'inspection_date',
        width: 130,
        ...getSelectFilter('inspection_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '组装完成日期',
        dataIndex: 'assembly_date',
        key: 'assembly_date',
        width: 130,
        ...getSelectFilter('assembly_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '包装完成日期',
        dataIndex: 'packaging_date',
        key: 'packaging_date',
        width: 130,
        ...getSelectFilter('packaging_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '发货日期',
        dataIndex: 'delivery_date',
        key: 'delivery_date',
        width: 110,
        ...getSelectFilter('delivery_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        ...getSelectFilter('remarks', data),
        render: (v: string) => v || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        fixed: 'right',
        filters: [
          { text: '已结案', value: 'closed' },
          { text: '未结案', value: 'open' },
        ],
        onFilter: (value: boolean | React.Key, record: VillaLiftOrder) =>
          record.status === String(value),
        render: (v: string) =>
          v === 'closed' ? (
            <Tag color="green">已结案</Tag>
          ) : (
            <Tag color="red">未结案</Tag>
          ),
      },
      {
        title: '操作',
        key: 'action',
        width: 70,
        fixed: 'right',
        render: (_v: unknown, record: VillaLiftOrder) =>
          canEdit ? (
            <Tooltip title="编辑订单">
              <Button
                type="text"
                size="small"
                icon={
                  <PencilSquareIcon className="size-4 text-yellow-500/80!" />
                }
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          ) : null,
      },
    ],
    [page, pageSize, canEdit, canEditItems, onEdit, data],
  )

  const expandable: TableProps<VillaLiftOrder>['expandable'] = {
    expandedRowKeys: expandedKeys,
    onExpand: (expanded, record) => {
      setExpandedKeys(
        expanded
          ? [...expandedKeys, record.id]
          : expandedKeys.filter((k) => k !== record.id),
      )
    },
    expandIcon: ({ expanded, onExpand, record }) => (
      <Button
        type="text"
        size="small"
        icon={
          expanded ? (
            <ChevronDownIcon className="size-4 text-blue-500" />
          ) : (
            <ChevronRightIcon className="size-4 text-gray-400" />
          )
        }
        onClick={(e) => onExpand(record, e)}
      />
    ),
    expandedRowRender: (record) => (
      <ExpandedItems
        orderId={record.id}
        onEditItems={onEditItems}
        canEditItems={canEditItems}
      />
    ),
  }

  return (
    <Table<VillaLiftOrder>
      loading={loading}
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      scroll={{ x: 1200, y: scrollY }}
      pagination={false}
      expandable={expandable}
      rowSelection={{
        selectedRowKeys,
        onChange: (keys) => onSelectionChange(keys as string[]),
      }}
    />
  )
}
