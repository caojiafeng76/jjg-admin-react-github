import { Alert, Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'

import type { Employee } from '@/services/apiEmployees'
import { DEFAULT_EMPLOYEE_AUTH_PASSWORD } from './constants'

export interface EmployeeAuthAccountValues {
  email: string
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
        message={`将为现有员工“${employee.name}”创建 Supabase Auth 登录账号，并自动绑定到当前员工记录。默认密码为 ${DEFAULT_EMPLOYEE_AUTH_PASSWORD}。`}
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

      <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-2 text-xs leading-6 text-sky-700">
        默认初始密码为 {DEFAULT_EMPLOYEE_AUTH_PASSWORD}
        ，开通后员工可在手机端自行修改密码。
      </div>
    </Form>
  )
}
