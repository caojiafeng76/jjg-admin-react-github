import type { FormInstance } from 'antd'
import type { ISyneyStoreReport } from '@/types'
import { Form, Input } from 'antd'
import { useEffect } from 'react'

export interface ReportFormProps {
  onFinish: (values: ISyneyStoreReport) => void
  setFormRef: (form: FormInstance<ISyneyStoreReport>) => void
  isSubmitting?: boolean
}

export default function ReportForm({
  onFinish,
  setFormRef,
  isSubmitting = false,
}: ReportFormProps) {
  const [form] = Form.useForm<ISyneyStoreReport>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  return (
    <Form
      layout="vertical"
      form={form}
      name="report-form"
      disabled={isSubmitting}
      onFinish={onFinish}
    >
      <Form.Item
        name="Detail"
        label="详情"
        rules={[{ required: true, message: '请粘贴入库单详情数据' }]}
      >
        <Input.TextArea
          rows={16}
          disabled={isSubmitting}
          placeholder="粘贴或输入入库单 JSON 字符串"
          className="rounded-lg"
        />
      </Form.Item>
    </Form>
  )
}
