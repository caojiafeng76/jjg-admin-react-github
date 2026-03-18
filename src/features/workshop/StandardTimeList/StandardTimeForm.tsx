import { Form, FormInstance, Input, InputNumber } from 'antd'
import { useEffect } from 'react'
import type { StandardTime } from '@/services/apiStandardTimes'

interface Props {
  onFinish: (values: StandardTime) => void
  setFormRef: (form: FormInstance<StandardTime>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: StandardTime
}

export default function StandardTimeForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit: _isEdit,
  initialValues,
}: Props) {
  const [form] = Form.useForm<StandardTime>()

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
        name="operation"
        label="工序"
        rules={[
          { required: true, message: '请输入工序' },
          { max: 100, message: '工序不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入工序" disabled={isCreating} />
      </Form.Item>
      <Form.Item
        name="model"
        label="型号"
        rules={[
          { required: true, message: '请输入型号' },
          { max: 100, message: '型号不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入型号" disabled={isCreating} />
      </Form.Item>
      <Form.Item
        name="standard_seconds"
        label="标准工时（秒）"
        rules={[{ required: true, message: '请输入标准工时' }]}
      >
        <InputNumber
          placeholder="请输入标准工时"
          disabled={isCreating}
          min={0}
          style={{ width: '100%' }}
        />
      </Form.Item>
    </Form>
  )
}
