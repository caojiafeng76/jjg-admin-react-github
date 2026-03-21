import { Alert, Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'

import type { Employee } from '@/services/apiEmployees'

export interface EmployeeAuthAccountValues {
  email: string
  password: string
  confirmPassword: string
}

interface Props {
  employee: Employee
  setFormRef: (form: FormInstance<EmployeeAuthAccountValues>) => void
  onFinish: (values: EmployeeAuthAccountValues) => void
  isSubmitting: boolean
}

export default function EmployeeAuthAccountForm({
  employee,
  setFormRef,
  onFinish,
  isSubmitting,
}: Props) {
  const [form] = Form.useForm<EmployeeAuthAccountValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.resetFields()
  }, [employee.id, form])

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} disabled={isSubmitting}>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message={`将为现有员工“${employee.name}”创建 Supabase Auth 登录账号，并自动绑定到当前员工记录。`}
      />

      <Form.Item label="员工姓名">
        <Input value={employee.name} disabled />
      </Form.Item>

      <Form.Item
        name="email"
        label="登录邮箱"
        rules={[
          { required: true, message: '请输入登录邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      >
        <Input placeholder="请输入员工登录邮箱" autoComplete="off" />
      </Form.Item>

      <Form.Item
        name="password"
        label="初始密码"
        rules={[
          { required: true, message: '请输入初始密码' },
          { min: 6, message: '初始密码至少 6 位' },
        ]}
      >
        <Input.Password placeholder="请输入初始密码" autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="确认密码"
        dependencies={['password']}
        rules={[
          { required: true, message: '请再次输入初始密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }

              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password placeholder="请再次输入初始密码" autoComplete="new-password" />
      </Form.Item>
    </Form>
  )
}