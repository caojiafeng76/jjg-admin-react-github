import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import { translateErrorMessage } from '@/utils/errorHandler'
import Loading from '@ui/Loading'

const { Title, Text } = Typography

interface LoginFormValues {
  email: string
  password: string
}

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const { user, loading, error, clearError, signIn } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 已登录用户直接跳转（添加防抖，避免重复导航）
  useEffect(() => {
    if (user && !loading) {
      // 使用 setTimeout 确保导航在下一个事件循环中执行，避免与 signIn 中的导航冲突
      const timer = setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [user, loading, navigate])

  // 将 AuthContext 的错误同步到本地提示
  useEffect(() => {
    if (error) {
      const message = error.message || '认证出现问题，请稍后重试'
      setErrorMessage(translateErrorMessage(message))
    }
  }, [error])

  const handleFinish = async (values: LoginFormValues) => {
    setErrorMessage(null)
    clearError()
    setSubmitting(true)
    try {
      await signIn(values.email, values.password)
      // 登录成功后，由 useEffect 监听 user 变化来处理导航
      // 这里不直接导航，避免与 useEffect 中的导航冲突
      // navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const message = err?.message || '登录失败，请稍后重试'
      setErrorMessage(translateErrorMessage(message))
    } finally {
      setSubmitting(false)
    }
  }

  // 首次加载时正在确认登录状态，使用全屏 Loading，避免表单闪烁
  if (loading && !user && !submitting) {
    return <Loading />
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
          disabled={submitting}
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
              loading={submitting}
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
