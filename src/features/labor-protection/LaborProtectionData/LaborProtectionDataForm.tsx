import type { FormInstance } from 'antd'
import type {
  LaborProtectionData,
  LaborProtectionDataFormValues,
} from '@/services/apiLaborProtectionData'
import { Form, Input } from 'antd'

import { useEffect } from 'react'

interface Props {
  onFinish: (values: LaborProtectionDataFormValues) => void
  setFormRef: (form: FormInstance<LaborProtectionDataFormValues>) => void
  isSubmitting: boolean
  initialValues?: LaborProtectionData | LaborProtectionDataFormValues
}

const DEFAULT_VALUES: LaborProtectionDataFormValues = {
  category: '',
}

export default function LaborProtectionDataForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
}: Props) {
  const [form] = Form.useForm<LaborProtectionDataFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...DEFAULT_VALUES,
        category: initialValues.category,
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
        name="category"
        label="种类"
        rules={[{ required: true, message: '请输入劳保种类' }]}
      >
        <Input placeholder="请输入劳保种类" />
      </Form.Item>
    </Form>
  )
}
