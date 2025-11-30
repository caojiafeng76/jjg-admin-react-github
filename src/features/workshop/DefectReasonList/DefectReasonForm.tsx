import { Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'
import type { WorkshopDefectReason } from '@/services/apiWorkshopDefectReasons'

interface Props {
  onFinish: (values: WorkshopDefectReason) => void
  setFormRef: (form: FormInstance<WorkshopDefectReason>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: WorkshopDefectReason
}

export default function DefectReasonForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit: _isEdit,
  initialValues,
}: Props) {
  const [form] = Form.useForm<WorkshopDefectReason>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
    }
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isCreating}
    >
      <Form.Item
        name="defect_reason"
        label="不良原因"
        rules={[
          { required: true, message: '请输入不良原因' },
          { max: 100, message: '不良原因不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入不良原因" disabled={isCreating} />
      </Form.Item>
    </Form>
  )
}

