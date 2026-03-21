import { Alert, Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'

import type { Employee } from '@/services/apiEmployees'

export interface EmployeeRebindAccountValues {
  email: string
}

interface Props {
  employee: Employee
  setFormRef: (form: FormInstance<EmployeeRebindAccountValues>) => void
  onFinish: (values: EmployeeRebindAccountValues) => void
  isSubmitting: boolean
}

export default function EmployeeRebindAccountForm({
  employee,
  setFormRef,
  onFinish,
  isSubmitting,
}: Props) {
  const [form] = Form.useForm<EmployeeRebindAccountValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.resetFields()
  }, [employee.id, form])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={`将为员工“${employee.name}”绑定一个已存在的 Auth 账号。`}
      />

      <Form.Item label="员工姓名">
        <Input value={employee.name} disabled />
      </Form.Item>

      <Form.Item
        name="email"
        label="已存在账号的邮箱"
        rules={[
          { required: true, message: '请输入要重新绑定的邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input placeholder="请输入已存在的 Auth 账号邮箱" autoComplete="off" />
      </Form.Item>
    </Form>
  )
}
