import { useRef } from 'react'
import { App, FormInstance, Modal } from 'antd'

import type {
  VillaLiftOrder,
  VillaLiftOrderItemFormValues,
} from '@/services/apiVillaLiftOrders'
import {
  useUpsertVillaLiftOrderItems,
  useVillaLiftOrderItems,
} from './useVillaLiftOrders'
import VillaLiftOrderForm from './VillaLiftOrderForm'

export interface VillaLiftOrderItemsModalProps {
  open: boolean
  orderId: string | null
  onClose: () => void
}

export default function VillaLiftOrderItemsModal({
  open,
  orderId,
  onClose,
}: VillaLiftOrderItemsModalProps) {
  const { message } = App.useApp()
  const { data: items = [], isLoading } = useVillaLiftOrderItems(
    open ? orderId : null,
  )
  const upsertMutation = useUpsertVillaLiftOrderItems()
  const formRef = useRef<FormInstance<{
    items: VillaLiftOrderItemFormValues[]
  }> | null>(null)

  async function handleOk() {
    if (!orderId || !formRef.current) return
    try {
      const values = await formRef.current.validateFields()
      await upsertMutation.mutateAsync({
        orderId,
        items: values.items ?? [],
      })
      message.success('明细保存成功')
      onClose()
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message)
      }
    }
  }

  return (
    <Modal
      title="编辑订单明细"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={upsertMutation.isPending}
      width={800}
      destroyOnClose
    >
      <VillaLiftOrderForm
        onFinish={() => {}}
        setFormRef={(f) => {
          formRef.current = f as unknown as FormInstance<{
            items: VillaLiftOrderItemFormValues[]
          }>
        }}
        isSubmitting={upsertMutation.isPending}
        initialValues={
          orderId
            ? ({
                id: orderId,
                schedule_date: null,
                delivery_date: null,
                customer: '',
                project_name: '',
                product_name: '',
                color: '',
                quantity: 0,
                remarks: '',
                created_at: '',
                updated_at: '',
                items: isLoading ? [] : items,
              } as VillaLiftOrder)
            : null
        }
        itemsOnly
      />
    </Modal>
  )
}
