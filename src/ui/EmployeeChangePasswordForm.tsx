import { Alert, Form, Input } from 'antd'

export interface EmployeeChangePasswordValues {
  currentPassword: string
  password: string
  confirmPassword: string
}

interface Props {
  loading?: boolean
  employeeName?: string | null
  onFinish: (values: EmployeeChangePasswordValues) => void
}

export default function EmployeeChangePasswordForm({
  loading = false,
  employeeName,
  onFinish,
}: Props) {
  const [form] = Form.useForm<EmployeeChangePasswordValues>()

  return (
    <Form<EmployeeChangePasswordValues>
      id="employee-change-password-form"
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={loading}
    >
      <Alert
        type="info"
        showIcon
        className="mb-4 rounded-2xl"
        message={`正在为${employeeName || '当前账号'}修改登录密码，请先验证原密码。`}
      />

      <Form.Item
        name="currentPassword"
        label="原密码"
        rules={[{ required: true, message: '请输入原密码' }]}
      >
        <Input.Password
          placeholder="请输入当前登录密码"
          autoComplete="current-password"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '新密码至少 6 位' },
        ]}
      >
        <Input.Password
          placeholder="请输入新的登录密码"
          autoComplete="new-password"
        />
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
        <Input.Password
          placeholder="请再次输入新的登录密码"
          autoComplete="new-password"
        />
      </Form.Item>

      <button type="submit" hidden aria-hidden="true" />
    </Form>
  )
}
