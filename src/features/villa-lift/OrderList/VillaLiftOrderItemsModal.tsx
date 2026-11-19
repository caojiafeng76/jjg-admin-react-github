import type { FormInstance } from 'antd'
import type {
  VillaLiftOrder,
  VillaLiftOrderItemFormValues,
} from '@/services/apiVillaLiftOrders'
import { App, Modal } from 'antd'

import { useRef, useState } from 'react'
import FormErrorAlert from '@/ui/FormErrorAlert'
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
  const [formError, setFormError] = useState<unknown>(null)
  const { data: items = [], isLoading } = useVillaLiftOrderItems(
    open ? orderId : null,
  )
  const upsertMutation = useUpsertVillaLiftOrderItems()
  const formRef = useRef<FormInstance<{
    items: VillaLiftOrderItemFormValues[]
  }> | null>(null)

  async function handleOk() {
    if (!orderId || !formRef.current)
      return
    try {
      setFormError(null)
      const values = await formRef.current.validateFields()
      await upsertMutation.mutateAsync({
        orderId,
        items: values.items ?? [],
      })
      message.success('明细保存成功')
      onClose()
    }
    catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err)
        return
      setFormError(err)
    }
  }

  return (
    <Modal
      title="编辑订单明细"
      open={open}
      onOk={handleOk}
      onCancel={() => {
        setFormError(null)
        onClose()
      }}
      confirmLoading={upsertMutation.isPending}
      width={720}
      destroyOnHidden
    >
      <div className="space-y-4">
        <FormErrorAlert error={formError} />
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
      </div>
    </Modal>
  )
}
