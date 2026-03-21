import { Alert, Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'

import type { Employee } from '@/services/apiEmployees'

export interface EmployeeResetPasswordValues {
  password: string
  confirmPassword: string
}

interface Props {
  employee: Employee
  setFormRef: (form: FormInstance<EmployeeResetPasswordValues>) => void
  onFinish: (values: EmployeeResetPasswordValues) => void
  isSubmitting: boolean
}

export default function EmployeeResetPasswordForm({
  employee,
  setFormRef,
  onFinish,
  isSubmitting,
}: Props) {
  const [form] = Form.useForm<EmployeeResetPasswordValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.resetFields()
  }, [employee.id, form])

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} disabled={isSubmitting}>
      <Alert
        type="warning"
        showIcon
        className="mb-4"
        message={`将重置员工“${employee.name}”的登录密码。`}
      />

      <Form.Item label="员工姓名">
        <Input value={employee.name} disabled />
      </Form.Item>

      <Form.Item
        name="password"
        label="新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '新密码至少 6 位' },
        ]}
      >
        <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="确认新密码"
        dependencies={['password']}
        rules={[
          { required: true, message: '请再次输入新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || value === getFieldValue('password')) {
                return Promise.resolve()
              }

              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
      </Form.Item>
    </Form>
  )
}