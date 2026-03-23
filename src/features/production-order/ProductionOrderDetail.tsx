import { useState } from 'react'
import { Card, Descriptions, Button, Tag } from 'antd'
import { PlusIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

import ProductionOrderItemTable from './ProductionOrderItemTable'
import ProductionOrderItemMobileList from './ProductionOrderItemMobileList'
import ProductionOrderItemForm from './ProductionOrderItemForm'
import {
  useProductionOrderItems,
  useAddProductionOrderItem,
  useUpdateProductionOrderItem,
  useDeleteProductionOrderItems,
} from './useProductionOrderItems'
import { useProductionOrder } from './useProductionOrders'
import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'
import type { ProductionOrder } from '@/services/apiProductionOrders'

interface Props {
  order: ProductionOrder & { items?: ProductionOrderItem[] }
  onEdit: () => void
  compact?: boolean
  canEdit?: boolean
}

export default function ProductionOrderDetail({
  order,
  onEdit,
  compact = false,
  canEdit = true,
}: Props) {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<
    ProductionOrderItem | undefined
  >()

  const {
    data: itemsData,
    isLoading: itemsLoading,
    refetch,
  } = useProductionOrderItems(order.id)
  const { data: orderData, refetch: refetchOrder } = useProductionOrder(
    order.id,
  )
  const addItemMutation = useAddProductionOrderItem()
  const updateItemMutation = useUpdateProductionOrderItem()
  const deleteItemMutation = useDeleteProductionOrderItems()

  const currentOrder = orderData || order
  const items = itemsData || order.items || []

  const handleAddItem = () => {
    setEditingItem(undefined)
    setIsItemModalOpen(true)
  }

  const handleEditItem = (item: ProductionOrderItem) => {
    setEditingItem(item)
    setIsItemModalOpen(true)
  }

  const handleDeleteItem = async (ids: string[]) => {
    await deleteItemMutation.mutateAsync(ids)
    await Promise.all([refetch(), refetchOrder()])
  }

  const handleItemSubmit = async (values: Partial<ProductionOrderItem>) => {
    if (editingItem) {
      await updateItemMutation.mutateAsync({
        id: editingItem.id,
        values,
      })
    } else {
      await addItemMutation.mutateAsync(values as ProductionOrderItem)
    }
    setIsItemModalOpen(false)
    await Promise.all([refetch(), refetchOrder()])
  }

  const orderWithEmployee = currentOrder as ProductionOrder & {
    employee?: { name: string }
  }
  const positiveQualifiedHours = Number(
    items
      .reduce((total, item) => total + Number(item.qualified_hours || 0), 0)
      .toFixed(2),
  )
  const formattedAuditedAt = currentOrder.audited_at
    ? dayjs(currentOrder.audited_at).format('YYYY-MM-DD HH:mm:ss')
    : null

  return (
    <div className="space-y-4">
      {compact ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.24em] text-slate-400 uppercase">
                Order Summary
              </div>
              <div className="mt-1 text-xl font-black tracking-tight text-slate-900">
                {currentOrder.order_date}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {orderWithEmployee.employee?.name || '-'}
              </div>
              <div className="mt-2">
                <Tag color={currentOrder.is_audited ? 'success' : 'default'}>
                  {currentOrder.is_audited ? '已审核' : '待审核'}
                </Tag>
              </div>
            </div>

            <Button type="primary" onClick={onEdit} disabled={!canEdit}>
              编辑工单
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                出勤工时
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {currentOrder.work_hours} 小时
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                正工工时
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {positiveQualifiedHours.toFixed(2)} 小时
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                零工工时
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {(currentOrder.extra_qualified_hours ?? 0).toFixed(2)} 小时
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                总工时
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {(currentOrder.total_qualified_hours ?? 0).toFixed(2)} 小时
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                审核时间
              </div>
              <div className="mt-1 font-semibold text-slate-900">
                {formattedAuditedAt || '未审核'}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <Card
          title="生产工单信息"
          extra={
            <Button type="primary" onClick={onEdit} disabled={!canEdit}>
              编辑工单
            </Button>
          }
        >
          <Descriptions column={compact ? 1 : 2} size="small">
            <Descriptions.Item label="日期">
              {currentOrder.order_date}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {orderWithEmployee.employee?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="审核状态">
              <Tag color={currentOrder.is_audited ? 'success' : 'default'}>
                {currentOrder.is_audited ? '已审核' : '待审核'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="审核时间">
              {formattedAuditedAt || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="出勤工时">
              {currentOrder.work_hours} 小时
            </Descriptions.Item>
            <Descriptions.Item label="正工工时">
              {positiveQualifiedHours.toFixed(2)} 小时
            </Descriptions.Item>
            <Descriptions.Item label="零工工时">
              {(currentOrder.extra_qualified_hours ?? 0).toFixed(2)} 小时
            </Descriptions.Item>
            <Descriptions.Item label="总工时">
              {currentOrder.total_qualified_hours === null ||
              currentOrder.total_qualified_hours === undefined
                ? '-'
                : currentOrder.total_qualified_hours.toFixed(2)}{' '}
              小时
            </Descriptions.Item>
            <Descriptions.Item label="工时效率">
              {currentOrder.efficiency === null ||
              currentOrder.efficiency === undefined
                ? '-'
                : (currentOrder.efficiency * 100).toFixed(2)}
              %
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {currentOrder.remark || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {compact ? (
        <section className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs tracking-[0.24em] text-slate-400 uppercase">
                Process Items
              </div>
              <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                工序明细
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={handleAddItem}
              disabled={!canEdit}
            >
              添加
            </Button>
          </div>

          <div className="mt-4">
            <ProductionOrderItemMobileList
              loading={itemsLoading}
              data={items}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              showActions={canEdit}
            />
          </div>
        </section>
      ) : (
        <Card
          title="工序明细"
          extra={
            <Button
              type="primary"
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={handleAddItem}
              disabled={!canEdit}
            >
              添加工序
            </Button>
          }
        >
          <ProductionOrderItemTable
            loading={itemsLoading}
            data={items}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            scrollY={300}
            showActions={canEdit}
          />
        </Card>
      )}

      <ProductionOrderItemForm
        open={isItemModalOpen}
        onCancel={() => setIsItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        initialValues={editingItem}
        orderId={order.id}
        compact={compact}
      />
    </div>
  )
}
