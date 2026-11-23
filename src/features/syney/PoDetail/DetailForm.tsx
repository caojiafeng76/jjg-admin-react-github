import type { FormInstance } from 'antd'
import type { ISyneyItem } from '@/types'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

export interface DetailFormProps {
  onFinish: (values: ISyneyItem) => void
  setFormRef: (form: FormInstance<ISyneyItem>) => void
  isSubmitting?: boolean
  initialValues?: Partial<ISyneyItem>
}

export default function DetailForm({
  onFinish,
  setFormRef,
  isSubmitting = false,
  initialValues,
}: DetailFormProps) {
  const [form] = Form.useForm<ISyneyItem>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
      return
    }
    form.resetFields()
  }, [form, initialValues])

  return (
    <Form
      layout="vertical"
      name="po-detail"
      form={form}
      disabled={isSubmitting}
      onFinish={onFinish}
    >
      <Form.Item name="PartNo" label="件号">
        <Input disabled className="rounded-lg" />
      </Form.Item>

      <Form.Item name="PartName" label="名称">
        <Input disabled className="rounded-lg" />
      </Form.Item>

      <Form.Item name="Spec" label="规格">
        <Input disabled className="rounded-lg" />
      </Form.Item>

      <Form.Item
        name="ParamSpec"
        label="参数规格"
        rules={[{ required: true, message: '请输入参数规格' }]}
      >
        <Input
          disabled={isSubmitting}
          className="rounded-lg"
          placeholder="请输入参数规格"
        />
      </Form.Item>

      <Form.Item name="Remark" label="备注">
        <Input.TextArea
          rows={4}
          disabled
          className="rounded-lg"
          placeholder="备注不可编辑"
        />
      </Form.Item>
    </Form>
  )
}
