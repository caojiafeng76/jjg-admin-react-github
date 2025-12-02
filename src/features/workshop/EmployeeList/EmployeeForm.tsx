import { Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'
import type { Employee } from '@/services/apiEmployees'

interface Props {
  onFinish: (values: Employee) => void
  setFormRef: (form: FormInstance<Employee>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: Employee
}

export default function EmployeeForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit: _isEdit,
  initialValues,
}: Props) {
  const [form] = Form.useForm<Employee>()

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
        name="name"
        label="姓名"
        rules={[
          { required: true, message: '请输入姓名' },
          { max: 100, message: '姓名不能超过100个字符' },
        ]}
      >
        <Input placeholder="请输入姓名" disabled={isCreating} />
      </Form.Item>
    </Form>
  )
}
