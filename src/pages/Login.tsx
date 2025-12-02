import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'

const { Title, Text } = Typography

interface LoginFormValues {
  email: string
  password: string
}

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const { user, loading, signIn } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const handleFinish = async (values: LoginFormValues) => {
    setErrorMessage(null)
    setSubmitting(true)
    try {
      await signIn(values.email, values.password)
      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      setErrorMessage(error?.message || '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <Card className="w-full max-w-md shadow-lg">
        <div className="mb-6 text-center">
          <Title level={3} style={{ marginBottom: 4 }}>
            系统登录
          </Title>
          <Text type="secondary">使用邮箱和密码登录系统</Text>
        </div>

        {errorMessage && (
          <Alert
            type="error"
            message={errorMessage}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form<LoginFormValues>
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          disabled={loading || submitting}
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="example@company.com"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting || loading}
            >
              登录
            </Button>
          </Form.Item>

          <Form.Item>
            <Text type="secondary">
              账号由管理员在 Supabase 控制台创建或通过注册接口创建。
            </Text>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
