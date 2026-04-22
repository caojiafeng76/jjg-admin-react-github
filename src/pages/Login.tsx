import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/useAuth'
import { usePermissionContext } from '@/contexts/PermissionContext'
import { deriveDefaultHome } from '@/routes/pageHome'
import { translateErrorMessage } from '@/utils/errorHandler'
import Loading from '@ui/Loading'

const { Title, Text } = Typography
const REMEMBERED_LOGIN_EMAIL_KEY = 'jjg-login-email'

interface LoginFormValues {
  email: string
  password: string
  rememberMe?: boolean
}

function getSafeRedirectTarget(locationSearch: string) {
  const redirect = new URLSearchParams(locationSearch).get('redirect')

  if (!redirect) {
    return null
  }

  if (!redirect.startsWith('/') || redirect.startsWith('//')) {
    return null
  }

  return redirect
}

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, loading, error, clearError, signIn } = useAuth()
  const { permissions, isLoading: permLoading } = usePermissionContext()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const redirectTarget = getSafeRedirectTarget(location.search)

  useEffect(() => {
    // 必须等权限也加载完，否则自定义角色无法基于权限挑首页
    if (user && !loading && !permLoading) {
      let cancelled = false
      const resolve = async () => {
        const target =
          redirectTarget || (await deriveDefaultHome(role, permissions))
        if (!cancelled) {
          navigate(target, { replace: true })
        }
      }
      resolve()
      return () => {
        cancelled = true
      }
    }
  }, [user, role, loading, permLoading, navigate, redirectTarget, permissions])

  useEffect(() => {
    if (error) {
      const message = error.message || '认证出现问题，请稍后重试'
      setErrorMessage(translateErrorMessage(message))
    }
  }, [error])

  useEffect(() => {
    const nextMessage = (location.state as { message?: string } | null)?.message

    if (nextMessage) {
      setSuccessMessage(nextMessage)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(
      REMEMBERED_LOGIN_EMAIL_KEY,
    )

    if (rememberedEmail) {
      form.setFieldsValue({ email: rememberedEmail, rememberMe: true })
      return
    }

    form.setFieldsValue({ rememberMe: false })
  }, [form])

  const handleFinish = async (values: LoginFormValues) => {
    setErrorMessage(null)
    setSuccessMessage(null)
    clearError()
    setSubmitting(true)

    try {
      if (values.rememberMe) {
        window.localStorage.setItem(REMEMBERED_LOGIN_EMAIL_KEY, values.email)
      } else {
        window.localStorage.removeItem(REMEMBERED_LOGIN_EMAIL_KEY)
      }

      await signIn(values.email, values.password)
      setSuccessMessage('登录成功，正在跳转...')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '登录失败，请稍后重试'
      setErrorMessage(translateErrorMessage(message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !user && !submitting) {
    return <Loading />
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1762341118954-d0ce391674d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjb3Jwb3JhdGUlMjBvZmZpY2UlMjBidXNpbmVzcyUyMHdvcmtpbmd8ZW58MXx8fHwxNzc2NTc1MjU5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')",
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-950/25 to-slate-900/10" />

        <div className="relative flex h-full w-full flex-col justify-between px-12 py-12 text-white xl:px-16 xl:py-14">
          <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/18 bg-white/10 px-4 py-3 backdrop-blur-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-[11px] font-bold tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(37,99,235,0.4)]">
              JJG
            </div>
            <div>
              <div className="text-[11px] font-medium tracking-[0.28em] text-white/70 uppercase">
                Enterprise
              </div>
              <div className="text-sm font-semibold tracking-[0.04em] text-white">
                生产管理系统
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <h2 className="mb-4 text-4xl font-semibold tracking-[0.02em] text-white xl:text-5xl">
              企业级管理中枢
            </h2>
            <p className="max-w-lg text-lg leading-8 text-slate-200/92 xl:text-[19px]">
              为您提供高效、安全、智能的业务运营与管理解决方案。汇聚数据洞察，助力企业做出更明智的商业决策。
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50/60 px-6 py-12 lg:px-8">
        <div className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-[15px] font-bold tracking-[0.18em] text-white shadow-[0_16px_36px_rgba(37,99,235,0.32)]">
              JJG
            </div>
            <Title level={3} className="mb-1! text-slate-900!">
              欢迎回来
            </Title>
            <Text className="text-slate-500!">请输入您的邮箱和密码以登录</Text>
          </div>

          {errorMessage && (
            <Alert
              type="error"
              message={errorMessage}
              showIcon
              className="mb-4! rounded-xl!"
            />
          )}

          {successMessage && (
            <Alert
              type="success"
              message={successMessage}
              showIcon
              className="mb-4! rounded-xl!"
            />
          )}

          <Form<LoginFormValues>
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            autoComplete="on"
            disabled={submitting}
            size="large"
          >
            <Form.Item
              label={<span className="font-medium text-slate-700">邮箱</span>}
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-slate-400" />}
                placeholder="admin@example.com"
                autoComplete="username"
                className="h-12! rounded-xl! border-slate-200! shadow-none! placeholder:text-slate-400! hover:border-slate-300! focus:border-blue-500!"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium text-slate-700">密码</span>}
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-400" />}
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-12! rounded-xl! border-slate-200! shadow-none! placeholder:text-slate-400! hover:border-slate-300! focus:border-blue-500!"
              />
            </Form.Item>

            <Form.Item
              name="rememberMe"
              valuePropName="checked"
              className="mb-6!"
            >
              <Checkbox className="text-slate-600">记住我</Checkbox>
            </Form.Item>

            <Form.Item className="mb-0!">
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                className="h-11! rounded-xl! border-0! bg-blue-600! text-base! font-medium! shadow-[0_16px_32px_rgba(37,99,235,0.2)] hover:bg-blue-700!"
              >
                登 录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  )
}
