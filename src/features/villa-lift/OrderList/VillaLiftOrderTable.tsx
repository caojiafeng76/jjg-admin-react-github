import React, { memo, useMemo, useState } from 'react'
import type { CSSProperties, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { Button, Spin, Table, Tag, Tooltip } from 'antd'
import type { TableColumnsType, TableProps } from 'antd'
import dayjs from 'dayjs'
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

const EXPAND_COLUMN_WIDTH = 36
const SELECTION_COLUMN_WIDTH = 36

const DENSE_TABLE_CELL_STYLE: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  padding: '4px 6px',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
}

const DENSE_TABLE_STYLES = {
  root: {
    fontSize: 12,
    lineHeight: 1.2,
  },
} satisfies NonNullable<TableProps<VillaLiftOrder>['styles']>

function DenseHeaderCell({
  style,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    />
  )
}

function DenseBodyCell({
  style,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      style={{
        ...style,
        ...DENSE_TABLE_CELL_STYLE,
      }}
    />
  )
}

const DENSE_TABLE_COMPONENTS = {
  body: { cell: DenseBodyCell },
  header: { cell: DenseHeaderCell },
} satisfies NonNullable<TableProps<VillaLiftOrder>['components']>

function getTableColumnWidth<RecordType>(
  columns: TableColumnsType<RecordType>,
) {
  return columns.reduce((total, column) => {
    const width = column.width

    return total + (typeof width === 'number' ? width : 0)
  }, 0)
}

// ----------------------------------------------------------------
// 计划日期对照颜色：
// - 已完成（actual 已填）：绿色
// - 未完成：按距离交货日期的天数判断
//   - > 7 天：绿色（充裕）
//   - 3 ~ 7 天：黄色（接近）
//   - < 3 天（含已超过交货日期）：红色（紧迫）
// - 缺少计划日期或交货日期：不上色
// ----------------------------------------------------------------
function renderPlannedDate(
  planned: string | null,
  actual: string | null,
  delivery: string | null,
) {
  if (!planned) return '-'
  let color: string | undefined
  if (actual) {
    color = '#52c41a'
  } else if (delivery) {
    const remaining = dayjs(delivery)
      .startOf('day')
      .diff(dayjs().startOf('day'), 'day')
    if (remaining > 7) color = '#52c41a'
    else if (remaining >= 3) color = '#faad14'
    else color = '#ff4d4f'
  }
  return (
    <span style={{ color, fontWeight: color ? 600 : undefined }}>
      {planned}
    </span>
  )
}

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
  rowHeight?: number
  canEdit: boolean
  canEditItems: boolean
  onEdit: (record: VillaLiftOrder) => void
  onEditItems: (orderId: string) => void
  selectedRowKeys: string[]
  onSelectionChange: (keys: string[]) => void
}

function VillaLiftOrderTable({
  loading,
  data,
  page,
  pageSize,
  scrollY = 400,
  rowHeight,
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
        width: 46,
        fixed: 'left',
        align: 'center',
        render: (_v: unknown, _r: VillaLiftOrder, index: number) =>
          (page - 1) * pageSize + index + 1,
      },
      {
        title: '计划交货日期',
        dataIndex: 'planned_delivery_date',
        key: 'planned_delivery_date',
        width: 92,
        fixed: 'left',
        ...getSelectFilter('planned_delivery_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '排产日期',
        dataIndex: 'schedule_date',
        key: 'schedule_date',
        width: 86,
        ...getSelectFilter('schedule_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 90,
        ...getSelectFilter('customer', data),
        render: (v: string) => v || '-',
      },
      {
        title: '项目名称',
        dataIndex: 'project_name',
        key: 'project_name',
        width: 116,
        ...getSelectFilter('project_name', data),
        render: (v: string) => v || '-',
      },
      {
        title: '产品名称',
        dataIndex: 'product_name',
        key: 'product_name',
        width: 104,
        ...getSelectFilter('product_name', data),
        render: (v: string) => v || '-',
      },
      {
        title: '颜色',
        dataIndex: 'color',
        key: 'color',
        width: 76,
        ...getSelectFilter('color', data),
        render: (v: string) => (v ? <Tag>{v}</Tag> : '-'),
      },
      {
        title: '数量',
        dataIndex: 'quantity',
        key: 'quantity',
        width: 60,
        align: 'right',
        ...getSelectFilter('quantity', data),
      },
      {
        title: '挑料计划完成日期',
        dataIndex: 'tinting_plan_date',
        key: 'tinting_plan_date',
        width: 104,
        ...getSelectFilter('tinting_plan_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '挑料完成日期',
        dataIndex: 'material_selection_date',
        key: 'material_selection_date',
        width: 98,
        ...getSelectFilter('material_selection_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '喷涂计划完成日期',
        dataIndex: 'painting_plan_date',
        key: 'painting_plan_date',
        width: 104,
        ...getSelectFilter('painting_plan_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '喷涂完成日期',
        dataIndex: 'painting_date',
        key: 'painting_date',
        width: 98,
        ...getSelectFilter('painting_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '贴膜计划完成日期',
        dataIndex: 'film_plan_date',
        key: 'film_plan_date',
        width: 104,
        ...getSelectFilter('film_plan_date', data),
        render: (v: string | null, r: VillaLiftOrder) =>
          renderPlannedDate(v, r.film_date, r.delivery_date),
      },
      {
        title: '贴膜完成日期',
        dataIndex: 'film_date',
        key: 'film_date',
        width: 98,
        ...getSelectFilter('film_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '切割要求完成日期',
        dataIndex: 'cutting_required_date',
        key: 'cutting_required_date',
        width: 112,
        ...getSelectFilter('cutting_required_date', data),
        render: (v: string | null, r: VillaLiftOrder) =>
          renderPlannedDate(v, r.cutting_actual_date, r.delivery_date),
      },
      {
        title: '切割实际完成日期',
        dataIndex: 'cutting_actual_date',
        key: 'cutting_actual_date',
        width: 112,
        ...getSelectFilter('cutting_actual_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '加工要求完成日期',
        dataIndex: 'processing_required_date',
        key: 'processing_required_date',
        width: 112,
        ...getSelectFilter('processing_required_date', data),
        render: (v: string | null, r: VillaLiftOrder) =>
          renderPlannedDate(v, r.processing_actual_date, r.delivery_date),
      },
      {
        title: '加工实际完成日期',
        dataIndex: 'processing_actual_date',
        key: 'processing_actual_date',
        width: 112,
        ...getSelectFilter('processing_actual_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '轿箱加工完成日期',
        dataIndex: 'cabin_processing_date',
        key: 'cabin_processing_date',
        width: 112,
        ...getSelectFilter('cabin_processing_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '中分门加工完成日期',
        dataIndex: 'middle_door_processing_date',
        key: 'middle_door_processing_date',
        width: 120,
        ...getSelectFilter('middle_door_processing_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '井架加工完成日期',
        dataIndex: 'frame_processing_date',
        key: 'frame_processing_date',
        width: 112,
        ...getSelectFilter('frame_processing_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '检验完成日期',
        dataIndex: 'inspection_date',
        key: 'inspection_date',
        width: 98,
        ...getSelectFilter('inspection_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '组装完成日期',
        dataIndex: 'assembly_date',
        key: 'assembly_date',
        width: 98,
        ...getSelectFilter('assembly_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '包装完成日期',
        dataIndex: 'packaging_date',
        key: 'packaging_date',
        width: 98,
        ...getSelectFilter('packaging_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '发货日期',
        dataIndex: 'delivery_date',
        key: 'delivery_date',
        width: 86,
        ...getSelectFilter('delivery_date', data),
        render: (v: string | null) => v ?? '-',
      },
      {
        title: '备注',
        dataIndex: 'remarks',
        key: 'remarks',
        width: 130,
        ...getSelectFilter('remarks', data),
        render: (v: string) => v || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 76,
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
        width: 56,
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
    [page, pageSize, canEdit, onEdit, data],
  )

  const expandable: TableProps<VillaLiftOrder>['expandable'] = {
    columnWidth: EXPAND_COLUMN_WIDTH,
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

  const tableWidth =
    getTableColumnWidth(columns) + EXPAND_COLUMN_WIDTH + SELECTION_COLUMN_WIDTH

  return (
    <Table<VillaLiftOrder>
      loading={loading}
      dataSource={data}
      columns={columns}
      rowKey="id"
      size="small"
      components={DENSE_TABLE_COMPONENTS}
      scroll={{ x: tableWidth, y: scrollY }}
      pagination={false}
      expandable={expandable}
      styles={DENSE_TABLE_STYLES}
      onRow={() => ({ style: { height: rowHeight } })}
      rowSelection={{
        columnWidth: SELECTION_COLUMN_WIDTH,
        selectedRowKeys,
        onChange: (keys) => onSelectionChange(keys as string[]),
      }}
    />
  )
}

export default memo(VillaLiftOrderTable)
