import { useState } from 'react'
import { App, Button, Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/useAuth'
import { translateErrorMessage } from '@/utils/errorHandler'
import EmployeeChangePasswordForm, {
  type EmployeeChangePasswordValues,
} from './EmployeeChangePasswordForm'

const { Paragraph, Title } = Typography

export default function EmployeeMobileChangePasswordPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { changePassword, signOut, user, employeeProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChangePassword = async ({
    currentPassword,
    password,
  }: EmployeeChangePasswordValues) => {
    setIsSubmitting(true)

    try {
      await changePassword(currentPassword, password)
      await signOut()
      navigate('/login', {
        replace: true,
        state: { message: '密码修改成功，请使用新密码重新登录' },
      })
    } catch (error) {
      message.error(
        error instanceof Error
          ? translateErrorMessage(error.message)
          : '密码修改失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-52">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="text-[11px] font-semibold tracking-[0.28em] text-slate-400 uppercase">
            Account Security
          </div>
          <Title level={3} style={{ marginTop: 12, marginBottom: 8 }}>
            修改我的密码
          </Title>
          <Paragraph className="mb-0 text-slate-500">
            密码修改成功后将自动退出，并要求使用新密码重新登录。
          </Paragraph>
        </section>

        <Card className="rounded-4xl border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <EmployeeChangePasswordForm
            employeeName={employeeProfile?.name || user?.email || null}
            loading={isSubmitting}
            onFinish={handleChangePassword}
          />
        </Card>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
      >
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
          <Button className="h-11 rounded-2xl" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="employee-change-password-form"
            className="h-11 rounded-2xl"
            loading={isSubmitting}
          >
            保存新密码
          </Button>
        </div>
      </div>
    </div>
  )
}
