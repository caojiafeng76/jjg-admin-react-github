import { PencilSquareIcon } from '@heroicons/react/16/solid'
import type { TableColumnsType } from 'antd'
import { Button, Tooltip } from 'antd'

import type { ProductionSchedulingOrder } from '@/services/apiProductionScheduling'
import {
  getProductSpec,
  getProgressText,
  parseProjectNoDate,
  renderDate,
  renderDateTime,
  renderOrderCode,
  renderQuantity,
  renderText,
} from './productionSchedulingUtils'

function renderInventoryQuantity(record: ProductionSchedulingOrder) {
  const inventory = Number(record.inventory_quantity || 0)
  const detail = `精切 ${renderQuantity(record.inventory_precision_cutting_quantity)} + 自动切 ${renderQuantity(record.inventory_auto_cut_quantity)} - 报废 ${renderQuantity(record.inventory_defect_quantity)} - 转移 ${renderQuantity(record.transfer_quantity)}`

  return (
    <Tooltip title={detail}>
      <span
        className={
          inventory < 0 ? 'font-medium text-(--color-error)' : 'font-medium'
        }
      >
        {renderQuantity(inventory)}
      </span>
    </Tooltip>
  )
}

export function makeOrderColumns({
  onEdit,
}: {
  onEdit: (record: ProductionSchedulingOrder) => void
}): TableColumnsType<ProductionSchedulingOrder> {
  return [
    {
      title: '订单编号',
      key: 'order_code',
      width: 110,
      fixed: 'left',
      render: (_value, record) => renderText(renderOrderCode(record)),
    },
    {
      title: '订单日期',
      key: 'order_date',
      width: 100,
      render: (_value, record) =>
        renderText(parseProjectNoDate(record.project_no)),
    },
    {
      title: '项目号',
      dataIndex: 'project_no',
      key: 'project_no',
      width: 130,
      fixed: 'left',
      render: renderText,
    },
    {
      title: '客户名称',
      dataIndex: 'customer',
      key: 'customer',
      width: 120,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '产品名称及规格',
      key: 'product_spec',
      width: 240,
      ellipsis: true,
      render: (_value, record) => renderText(getProductSpec(record)),
    },
    {
      title: '订单数量',
      dataIndex: 'order_quantity',
      key: 'order_quantity',
      width: 100,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '合格标准',
      dataIndex: 'process_requirement',
      key: 'process_requirement',
      width: 160,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '计划开工时间',
      dataIndex: 'planned_start_date',
      key: 'planned_start_date',
      width: 128,
      render: renderDate,
    },
    {
      title: '计划完工时间',
      dataIndex: 'planned_finish_date',
      key: 'planned_finish_date',
      width: 128,
      render: renderDate,
    },
    {
      title: '交付日期',
      dataIndex: 'product_delivery_date',
      key: 'product_delivery_date',
      width: 118,
      render: renderDate,
    },
    {
      title: '分配设备(ERP编号)',
      dataIndex: 'tooling_status',
      key: 'tooling_status',
      width: 160,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '负责班组/人员',
      dataIndex: 'responsible_person_names',
      key: 'responsible_person_names',
      width: 160,
      ellipsis: true,
      render: (value: string[] | null | undefined) =>
        renderText(value?.length ? value.join('、') : null),
    },
    {
      title: '当前进度',
      key: 'progress',
      width: 150,
      render: (_value, record) => renderText(getProgressText(record)),
    },
    {
      title: '备注',
      dataIndex: 'scheduling_remark',
      key: 'scheduling_remark',
      width: 180,
      ellipsis: true,
      render: renderText,
    },
    {
      title: '转移数量',
      dataIndex: 'transfer_quantity',
      key: 'transfer_quantity',
      width: 110,
      align: 'right',
      render: renderQuantity,
    },
    {
      title: '转移进度',
      dataIndex: 'transfer_rate',
      key: 'transfer_rate',
      width: 100,
      align: 'right',
      render: (value) => `${Number(value || 0).toFixed(1)}%`,
    },
    {
      title: '最近转移车间',
      dataIndex: 'transfer_latest_workshop',
      key: 'transfer_latest_workshop',
      width: 130,
      render: renderText,
    },
    {
      title: '最近转移时间',
      dataIndex: 'transfer_latest_date',
      key: 'transfer_latest_date',
      width: 150,
      render: renderDateTime,
    },
    {
      title: '库存',
      dataIndex: 'inventory_quantity',
      key: 'inventory_quantity',
      width: 100,
      align: 'right',
      fixed: 'right',
      render: (_value, record) => renderInventoryQuantity(record),
    },
    {
      title: '操作',
      key: 'actions',
      width: 92,
      fixed: 'right',
      render: (_value, record) => (
        <Button
          size="small"
          icon={<PencilSquareIcon className="size-4" />}
          onClick={() => onEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ]
}
