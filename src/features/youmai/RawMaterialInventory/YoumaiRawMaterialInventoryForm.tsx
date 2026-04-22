import { useEffect } from 'react'
import { Form, type FormInstance, Input, InputNumber } from 'antd'

import type {
  YoumaiRawMaterialInventory,
  YoumaiRawMaterialInventoryFormValues,
} from '@/services/apiYoumaiRawMaterialInventory'

interface Props {
  onFinish: (values: YoumaiRawMaterialInventoryFormValues) => void
  setFormRef: (form: FormInstance<YoumaiRawMaterialInventoryFormValues>) => void
  isSubmitting: boolean
  isEdit?: boolean
  initialValues?:
    | YoumaiRawMaterialInventory
    | YoumaiRawMaterialInventoryFormValues
}

const DEFAULT_VALUES: YoumaiRawMaterialInventoryFormValues = {
  model: '',
  specification: '',
  quantity: 0,
}

export default function YoumaiRawMaterialInventoryForm({
  onFinish,
  setFormRef,
  isSubmitting,
  isEdit = false,
  initialValues,
}: Props) {
  const [form] = Form.useForm<YoumaiRawMaterialInventoryFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        model: initialValues.model,
        specification: initialValues.specification,
        quantity: initialValues.quantity,
      })
      return
    }
    form.resetFields()
    form.setFieldsValue(DEFAULT_VALUES)
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Form.Item
        name="model"
        label="型号"
        rules={[{ required: true, message: '请输入型号' }]}
      >
        <Input placeholder="请输入型号" disabled={isEdit} />
      </Form.Item>
      <Form.Item
        name="specification"
        label="规格"
        rules={[{ required: true, message: '请输入规格' }]}
      >
        <Input placeholder="请输入规格" disabled={isEdit} />
      </Form.Item>
      <Form.Item
        name="quantity"
        label="库存数量"
        rules={[
          { required: true, message: '请输入库存数量' },
          { type: 'number', min: 0, message: '库存数量不能为负数' },
        ]}
      >
        <InputNumber
          min={0}
          precision={0}
          className="w-full"
          placeholder="请输入库存数量"
        />
      </Form.Item>
    </Form>
  )
}
