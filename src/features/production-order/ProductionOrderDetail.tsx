import { useState } from 'react'
import { Card, Descriptions, Tag, Button } from 'antd'
import { PlusIcon } from '@heroicons/react/16/solid'

import ProductionOrderItemTable from './ProductionOrderItemTable'
import ProductionOrderItemForm from './ProductionOrderItemForm'
import {
  useProductionOrderItems,
  useAddProductionOrderItem,
  useUpdateProductionOrderItem,
  useDeleteProductionOrderItems,
} from './useProductionOrderItems'
import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'
import type { ProductionOrder } from '@/services/apiProductionOrders'

interface Props {
  order: ProductionOrder & { items?: ProductionOrderItem[] }
  onEdit: () => void
}

const STATUS_COLORS: Record<string, string> = {
  进行中: 'processing',
  已完成: 'success',
  已取消: 'default',
}

export default function ProductionOrderDetail({ order, onEdit }: Props) {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<
    ProductionOrderItem | undefined
  >()

  const {
    data: itemsData,
    isLoading: itemsLoading,
    refetch,
  } = useProductionOrderItems(order.id)
  const addItemMutation = useAddProductionOrderItem()
  const updateItemMutation = useUpdateProductionOrderItem()
  const deleteItemMutation = useDeleteProductionOrderItems()

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
    refetch()
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
    refetch()
  }

  const orderWithEmployee = order as ProductionOrder & {
    employee?: { name: string }
  }

  return (
    <div className="space-y-4">
      <Card
        title="生产工单信息"
        extra={
          <Button type="primary" onClick={onEdit}>
            编辑工单
          </Button>
        }
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="日期">{order.order_date}</Descriptions.Item>
          <Descriptions.Item label="操作人">
            {orderWithEmployee.employee?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="出勤工时">
            {order.work_hours} 小时
          </Descriptions.Item>
          <Descriptions.Item label="合格工时">
            {order.total_qualified_hours
              ? order.total_qualified_hours.toFixed(2)
              : '-'}{' '}
            小时
          </Descriptions.Item>
          <Descriptions.Item label="工时效率">
            {order.efficiency ? (order.efficiency * 100).toFixed(2) : '-'}%
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={STATUS_COLORS[order.status]}>{order.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {order.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title="工序明细"
        extra={
          <Button
            type="primary"
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={handleAddItem}
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
        />
      </Card>

      <ProductionOrderItemForm
        open={isItemModalOpen}
        onCancel={() => setIsItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        initialValues={editingItem}
        orderId={order.id}
      />
    </div>
  )
}
