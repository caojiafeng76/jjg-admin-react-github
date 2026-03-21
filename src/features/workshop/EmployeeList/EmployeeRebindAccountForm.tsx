import { Alert, Form, FormInstance, Input } from 'antd'
import { useEffect } from 'react'

import type { Employee } from '@/services/apiEmployees'

export interface EmployeeRebindAccountValues {
  email: string
}

interface Props {
  employee: Employee
  initialEmail?: string | null
  setFormRef: (form: FormInstance<EmployeeRebindAccountValues>) => void
  onFinish: (values: EmployeeRebindAccountValues) => void
  isSubmitting: boolean
  isLoadingInitialEmail?: boolean
}

export default function EmployeeRebindAccountForm({
  employee,
  initialEmail,
  setFormRef,
  onFinish,
  isSubmitting,
  isLoadingInitialEmail = false,
}: Props) {
  const [form] = Form.useForm<EmployeeRebindAccountValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.setFieldsValue({
      email: initialEmail || '',
    })
  }, [employee.id, form, initialEmail])

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
        <Input
          placeholder={
            isLoadingInitialEmail
              ? '正在读取当前绑定邮箱...'
              : '请输入已存在的 Auth 账号邮箱'
          }
          autoComplete="email"
        />
      </Form.Item>
    </Form>
  )
}
