import { Form, Input, InputNumber, Modal } from 'antd'

import type { VillaLiftCuttingRecordFormValues } from '@/services/apiVillaLiftCutting'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface CuttingRecordEditModalProps {
  open: boolean
  initialValues: VillaLiftCuttingRecordFormValues | null
  isSubmitting: boolean
  onOk: (values: VillaLiftCuttingRecordFormValues) => Promise<void>
  onCancel: () => void
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export default function CuttingRecordEditModal({
  open,
  initialValues,
  isSubmitting,
  onOk,
  onCancel,
}: CuttingRecordEditModalProps) {
  const [form] = Form.useForm<VillaLiftCuttingRecordFormValues>()

  async function handleOk() {
    const values = await form.validateFields()
    await onOk(values)
  }

  return (
    <Modal
      title="编辑切割记录"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={isSubmitting}
      width={480}
      destroyOnClose
      afterOpenChange={(visible) => {
        if (visible && initialValues) {
          form.setFieldsValue(initialValues)
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues ?? undefined}
      >
        <Form.Item
          name="model"
          label="型号"
          rules={[{ required: true, message: '请输入型号' }]}
        >
          <Input placeholder="型号" />
        </Form.Item>

        <Form.Item name="name" label="名称">
          <Input placeholder="名称" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="spec" label="规格">
            <Input placeholder="规格" />
          </Form.Item>
          <Form.Item
            name="operator"
            label="操作人"
            rules={[{ required: true, message: '请输入操作人' }]}
          >
            <Input placeholder="操作人姓名" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-3 gap-x-4">
          <Form.Item
            name="cut_quantity"
            label="切割数量"
            rules={[{ required: true, message: '请输入' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="raw_scrap_quantity" label="原料报废">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="process_scrap_quantity" label="加工报废">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
        </div>

        <Form.Item name="remarks" label="备注" rules={[{ max: 500 }]}>
          <Input placeholder="备注" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
