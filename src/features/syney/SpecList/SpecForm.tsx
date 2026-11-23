import type { FormInstance } from 'antd'
import type { ISyneySpec } from '@/types'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

export interface SpecFormProps {
  onFinish: (values: ISyneySpec) => void
  setFormRef: (form: FormInstance<ISyneySpec>) => void
  isSubmitting?: boolean
  isEditing: boolean
  initialValues?: Partial<ISyneySpec>
}

export default function SpecForm({
  onFinish,
  setFormRef,
  isSubmitting = false,
  isEditing,
  initialValues,
}: SpecFormProps) {
  const [form] = Form.useForm<ISyneySpec>()

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
      form={form}
      name="syney-spec-form"
      disabled={isSubmitting}
      onFinish={onFinish}
    >
      <Form.Item
        name="PartNo"
        label="件号"
        rules={[{ required: true, message: '请输入件号' }]}
      >
        <Input disabled={isEditing} className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="PartName"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="Spec"
        label="规格"
        rules={[{ required: true, message: '请输入规格' }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
      <Form.Item
        name="ParamSpec"
        label="参数规格"
        rules={[{ required: true, message: '请输入参数规格' }]}
      >
        <Input className="rounded-lg" />
      </Form.Item>
    </Form>
  )
}
